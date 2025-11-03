import { useState, ChangeEvent } from 'react';
import { supabase, Reservation, Equipment, Kit } from '../lib/supabase';
import { uploadImage, validateImageFile } from '../utils/imageUpload';
import { Camera, X, CheckCircle } from 'lucide-react';

interface ReturnEquipmentProps {
  reservations: (Reservation & { equipment?: Equipment; kit?: Kit })[];
  onClose: () => void;
  onComplete: () => void;
}

export default function ReturnEquipment({ reservations, onClose, onComplete }: ReturnEquipmentProps) {
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [returnPhotos, setReturnPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePhotoAdd = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setReturnPhotos([...returnPhotos, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setReturnPhotos(returnPhotos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleReturn = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!selectedReservationId) {
        throw new Error('Selecione um equipamento ou kit para devolver');
      }

      if (returnPhotos.length === 0) {
        throw new Error('Adicione pelo menos uma foto da devolução');
      }

      const reservation = reservations.find(r => r.id === selectedReservationId);
      if (!reservation) throw new Error('Reserva não encontrada');

      const photoUrls = await Promise.all(
        returnPhotos.map(photo => uploadImage(photo, `returns/${reservation.user_id}`))
      );

      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'concluído',
          return_photos: photoUrls,
        })
        .eq('id', selectedReservationId);

      if (updateError) throw updateError;

      if (reservation.equipment_id) {
        await supabase
          .from('equipment')
          .update({ status: 'disponível' })
          .eq('id', reservation.equipment_id);
      } else if (reservation.kit_id) {
        const { data: kitEquipment } = await supabase
          .from('kit_equipment')
          .select('equipment_id')
          .eq('kit_id', reservation.kit_id);

        if (kitEquipment) {
          const equipmentIds = kitEquipment.map(ke => ke.equipment_id);
          await supabase
            .from('equipment')
            .update({ status: 'disponível' })
            .in('id', equipmentIds);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar devolução');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Devolução de Equipamentos</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-sm">Devolução registrada com sucesso!</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Selecione o item a ser devolvido *
            </label>
            <div className="space-y-2">
              {reservations.map((reservation) => (
                <label
                  key={reservation.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedReservationId === reservation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reservation"
                    value={reservation.id}
                    checked={selectedReservationId === reservation.id}
                    onChange={(e) => setSelectedReservationId(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  {reservation.equipment && (
                    <>
                      <img
                        src={reservation.equipment.photo_url_1}
                        alt={reservation.equipment.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{reservation.equipment.name}</p>
                        <p className="text-sm text-slate-600">
                          Retirado em: {new Date(reservation.start_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </>
                  )}
                  {reservation.kit && (
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{reservation.kit.name}</p>
                        <p className="text-sm text-slate-600">
                          Retirado em: {new Date(reservation.start_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {selectedReservationId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Fotos da Devolução *
              </label>
              <p className="text-sm text-slate-600 mb-4">
                Tire fotos do(s) equipamento(s) no momento da devolução para registro do estado
              </p>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600 font-medium">Adicionar Fotos</span>
                <span className="text-xs text-slate-500 mt-1">
                  {photoPreviews.length} {photoPreviews.length === 1 ? 'foto adicionada' : 'fotos adicionadas'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoAdd}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-3">
          <button
            onClick={handleReturn}
            disabled={loading || success || !selectedReservationId}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : success ? 'Devolução Concluída!' : 'Confirmar Devolução'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
