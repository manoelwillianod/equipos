import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Equipment, Kit } from '../lib/supabase';
import { CheckCircle, Search } from 'lucide-react';

interface KitFormProps {
  onSuccess: () => void;
  initialData?: Kit;
  isEditing?: boolean;
}

export default function KitForm({ onSuccess, initialData, isEditing = false }: KitFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
  });
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadEquipment();
    if (isEditing && initialData) {
      loadKitEquipment();
    }
  }, []);

  const loadEquipment = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name');

    if (!error && data) {
      setAllEquipment(data);
    }
  };

  const loadKitEquipment = async () => {
    if (!initialData) return;
    const { data, error } = await supabase
      .from('kit_equipment')
      .select('equipment_id')
      .eq('kit_id', initialData.id);

    if (!error && data) {
      setSelectedEquipment(data.map(ke => ke.equipment_id));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const filteredEquipment = allEquipment.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!profile) throw new Error('Usuário não autenticado');

      if (selectedEquipment.length === 0) {
        throw new Error('Selecione pelo menos um equipamento para o kit');
      }

      if (isEditing && initialData) {
        const { error: kitError } = await supabase
          .from('kits')
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq('id', initialData.id);

        if (kitError) throw kitError;

        const { error: deleteError } = await supabase
          .from('kit_equipment')
          .delete()
          .eq('kit_id', initialData.id);

        if (deleteError) throw deleteError;

        const kitEquipmentData = selectedEquipment.map(equipmentId => ({
          kit_id: initialData.id,
          equipment_id: equipmentId,
        }));

        const { error: equipmentError } = await supabase
          .from('kit_equipment')
          .insert(kitEquipmentData);

        if (equipmentError) throw equipmentError;
      } else {
        const { data: kitData, error: kitError } = await supabase
          .from('kits')
          .insert([
            {
              name: formData.name,
              description: formData.description,
              created_by: profile.id,
            },
          ])
          .select()
          .single();

        if (kitError) throw kitError;

        const kitEquipmentData = selectedEquipment.map(equipmentId => ({
          kit_id: kitData.id,
          equipment_id: equipmentId,
        }));

        const { error: equipmentError } = await supabase
          .from('kit_equipment')
          .insert(kitEquipmentData);

        if (equipmentError) throw equipmentError;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditing ? 'Erro ao editar kit' : 'Erro ao criar kit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">{isEditing ? 'Kit atualizado com sucesso!' : 'Kit criado com sucesso!'}</p>
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
            Nome do Kit *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ex: Kit Copa Truck, Kit Feiras, Kit Entrevistas"
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
            placeholder="Descreva o propósito e conteúdo deste kit"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Equipamentos do Kit *
          </label>
          <p className="text-sm text-slate-600 mb-3">
            Selecione os equipamentos que farão parte deste kit
          </p>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar equipamentos..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div className="border border-slate-300 rounded-lg max-h-80 overflow-y-auto">
            {filteredEquipment.length === 0 ? (
              <div className="p-4 text-center text-slate-600">
                Nenhum equipamento encontrado
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredEquipment.map((equipment) => (
                  <label
                    key={equipment.id}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEquipment.includes(equipment.id)}
                      onChange={() => toggleEquipment(equipment.id)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <img
                      src={equipment.photo_url_1}
                      alt={equipment.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{equipment.name}</p>
                      <p className="text-sm text-slate-600 line-clamp-1">{equipment.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      equipment.status === 'disponível' ? 'bg-green-100 text-green-800' :
                      equipment.status === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {equipment.status}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedEquipment.length > 0 && (
            <p className="mt-2 text-sm text-slate-600">
              {selectedEquipment.length} {selectedEquipment.length === 1 ? 'equipamento selecionado' : 'equipamentos selecionados'}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditing ? 'Atualizando...' : 'Criando...') : success ? (isEditing ? 'Atualizado!' : 'Criado!') : (isEditing ? 'Atualizar Kit' : 'Criar Kit')}
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
