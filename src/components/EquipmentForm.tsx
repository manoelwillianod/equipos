import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadImage, validateImageFile } from '../utils/imageUpload';
import { Camera, X, CheckCircle } from 'lucide-react';

interface EquipmentFormProps {
  onSuccess: () => void;
}

export default function EquipmentForm({ onSuccess }: EquipmentFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newPhotos = [...photos];
    newPhotos[index] = file;
    setPhotos(newPhotos);

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPreviews = [...photoPreviews];
      newPreviews[index] = reader.result as string;
      setPhotoPreviews(newPreviews);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);

    const newPreviews = [...photoPreviews];
    newPreviews[index] = '';
    setPhotoPreviews(newPreviews);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!profile) throw new Error('Usuário não autenticado');

      if (photos.some(photo => !photo)) {
        throw new Error('Todas as 4 fotos são obrigatórias');
      }

      const photoUrls = await Promise.all(
        photos.map((photo) => uploadImage(photo!, `equipment/${profile.id}`))
      );

      const { error: insertError } = await supabase
        .from('equipment')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            photo_url_1: photoUrls[0],
            photo_url_2: photoUrls[1],
            photo_url_3: photoUrls[2],
            photo_url_4: photoUrls[3],
            created_by: profile.id,
            status: 'disponível',
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar equipamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">Equipamento cadastrado com sucesso!</p>
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
            Nome do Equipamento *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descrição *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Fotos do Equipamento (4 fotos obrigatórias) *
          </label>
          <p className="text-sm text-slate-600 mb-4">
            Registre o estado de conservação do equipamento com 4 fotos diferentes
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index}>
                {photoPreviews[index] ? (
                  <div className="relative">
                    <img
                      src={photoPreviews[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                      Foto {index + 1}
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-600 font-medium">Foto {index + 1}</span>
                    <span className="text-xs text-slate-500 mt-1">Clique para adicionar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(index, e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cadastrando...' : success ? 'Cadastrado!' : 'Cadastrar Equipamento'}
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
