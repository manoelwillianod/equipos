import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Equipment, Kit } from '../lib/supabase';
import { uploadImage, validateImageFile } from '../utils/imageUpload';
import { Camera, X, CheckCircle } from 'lucide-react';

interface ReservationFormProps {
  onSuccess: () => void;
}

type ReservationType = 'equipment' | 'kit';

export default function ReservationForm({ onSuccess }: ReservationFormProps) {
  const { profile } = useAuth();
  const [reservationType, setReservationType] = useState<ReservationType>('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [formData, setFormData] = useState({
    selectedId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [pickupPhotos, setPickupPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadEquipment();
    loadKits();
  }, []);

  const loadEquipment = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('status', 'disponível')
      .order('name');

    if (!error && data) {
      setEquipment(data);
    }
  };

  const loadKits = async () => {
    const { data, error } = await supabase
      .from('kits')
      .select('*')
      .order('name');

    if (!error && data) {
      setKits(data);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoAdd = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setPickupPhotos([...pickupPhotos, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPickupPhotos(pickupPhotos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const checkAvailability = async () => {
    if (!formData.selectedId || !formData.startDate || !formData.endDate) {
      return true;
    }

    const field = reservationType === 'equipment' ? 'equipment_id' : 'kit_id';
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq(field, formData.selectedId)
      .in('status', ['agendado', 'em uso'])
      .or(`start_date.lte.${formData.endDate},end_date.gte.${formData.startDate}`);

    return !data || data.length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!profile) throw new Error('Usuário não autenticado');

      if (pickupPhotos.length === 0) {
        throw new Error('Adicione pelo menos uma foto da retirada');
      }

      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        throw new Error('Este item já está reservado para o período selecionado');
      }

      const photoUrls = await Promise.all(
        pickupPhotos.map(photo => uploadImage(photo, `reservations/${profile.id}`))
      );

      const reservationData: any = {
        user_id: profile.id,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        status: 'em uso',
        pickup_photos: photoUrls,
      };

      if (reservationType === 'equipment') {
        reservationData.equipment_id = formData.selectedId;
      } else {
        reservationData.kit_id = formData.selectedId;
      }

      const { error: insertError } = await supabase
        .from('reservations')
        .insert([reservationData]);

      if (insertError) throw insertError;

      if (reservationType === 'equipment') {
        await supabase
          .from('equipment')
          .update({ status: 'em uso' })
          .eq('id', formData.selectedId);
      } else {
        const { data: kitEquipment } = await supabase
          .from('kit_equipment')
          .select('equipment_id')
          .eq('kit_id', formData.selectedId);

        if (kitEquipment) {
          const equipmentIds = kitEquipment.map(ke => ke.equipment_id);
          await supabase
            .from('equipment')
            .update({ status: 'em uso' })
            .in('id', equipmentIds);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">Reserva criada com sucesso!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tipo de Reserva *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="equipment"
                checked={reservationType === 'equipment'}
                onChange={(e) => {
                  setReservationType(e.target.value as ReservationType);
                  setFormData({ ...formData, selectedId: '' });
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-slate-700">Equipamento Individual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="kit"
                checked={reservationType === 'kit'}
                onChange={(e) => {
                  setReservationType(e.target.value as ReservationType);
                  setFormData({ ...formData, selectedId: '' });
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-slate-700">Kit Completo</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {reservationType === 'equipment' ? 'Selecione o Equipamento' : 'Selecione o Kit'} *
          </label>
          <select
            name="selectedId"
            value={formData.selectedId}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            required
          >
            <option value="">Selecione...</option>
            {reservationType === 'equipment'
              ? equipment.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))
              : kits.map(kit => (
                  <option key={kit.id} value={kit.id}>{kit.name}</option>
                ))
            }
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data de Retirada *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data de Devolução *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Motivo do Uso *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={4}
            placeholder="Descreva o motivo e contexto desta reserva"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Fotos da Retirada *
          </label>
          <p className="text-sm text-slate-600 mb-4">
            Tire fotos do(s) equipamento(s) no momento da retirada para registro
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

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando Reserva...' : success ? 'Reserva Criada!' : 'Confirmar Reserva'}
          </button>
          <button
            type="button"
            onClick={onSuccess}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
