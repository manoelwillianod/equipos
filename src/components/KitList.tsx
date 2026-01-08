import { useState, useEffect } from 'react';
import { supabase, Kit, Equipment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Box, Calendar, Edit2, Trash2 } from 'lucide-react';

interface KitListProps {
  onReserveClick: () => void;
  onEditClick?: (kit: Kit) => void;
}

interface KitWithEquipment extends Kit {
  equipment: Equipment[];
}

export default function KitList({ onReserveClick, onEditClick }: KitListProps) {
  const { profile } = useAuth();
  const [kits, setKits] = useState<KitWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKit, setSelectedKit] = useState<KitWithEquipment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    setLoading(true);
    const { data: kitsData, error: kitsError } = await supabase
      .from('kits')
      .select('*')
      .order('created_at', { ascending: false });

    if (!kitsError && kitsData) {
      const kitsWithEquipment = await Promise.all(
        kitsData.map(async (kit) => {
          const { data: kitEquipment } = await supabase
            .from('kit_equipment')
            .select('equipment_id')
            .eq('kit_id', kit.id);

          if (kitEquipment && kitEquipment.length > 0) {
            const equipmentIds = kitEquipment.map(ke => ke.equipment_id);
            const { data: equipment } = await supabase
              .from('equipment')
              .select('*')
              .in('id', equipmentIds);

            return { ...kit, equipment: equipment || [] };
          }

          return { ...kit, equipment: [] };
        })
      );

      setKits(kitsWithEquipment);
    }
    setLoading(false);
  };

  const getKitStatus = (kit: KitWithEquipment) => {
    if (kit.equipment.length === 0) return 'vazio';
    const allAvailable = kit.equipment.every(eq => eq.status === 'disponível');
    if (allAvailable) return 'disponível';
    const anyInUse = kit.equipment.some(eq => eq.status === 'em uso');
    if (anyInUse) return 'em uso';
    return 'reservado';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponível':
        return 'bg-green-100 text-green-800';
      case 'reservado':
        return 'bg-yellow-100 text-yellow-800';
      case 'em uso':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('kits').delete().eq('id', id);
      setKits(kits.filter(k => k.id !== id));
      setDeleteConfirm(null);
      if (selectedKit?.id === id) {
        setSelectedKit(null);
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (kits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Box className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 text-lg">Nenhum kit criado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits.map((kit) => {
          const status = getKitStatus(kit);
          return (
            <div
              key={kit.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedKit(kit)}
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                <Box className="w-16 h-16 text-white opacity-90" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-lg">{kit.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                <p className="text-slate-600 text-sm line-clamp-2 mb-3">{kit.description}</p>
                <p className="text-slate-500 text-sm">
                  {kit.equipment.length} {kit.equipment.length === 1 ? 'equipamento' : 'equipamentos'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedKit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{selectedKit.name}</h2>
              <button
                onClick={() => setSelectedKit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getKitStatus(selectedKit))}`}>
                  {getKitStatus(selectedKit)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Descrição</h3>
                <p className="text-slate-600">{selectedKit.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Equipamentos ({selectedKit.equipment.length})
                </h3>
                {selectedKit.equipment.length === 0 ? (
                  <p className="text-slate-500">Este kit não possui equipamentos</p>
                ) : (
                  <div className="space-y-3">
                    {selectedKit.equipment.map((equipment) => (
                      <div
                        key={equipment.id}
                        className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                      >
                        <img
                          src={equipment.photo_url_1}
                          alt={equipment.name}
                          className="w-16 h-16 object-cover rounded"
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {getKitStatus(selectedKit) === 'disponível' && (
                  <button
                    onClick={() => {
                      setSelectedKit(null);
                      onReserveClick();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    <Calendar className="w-5 h-5" />
                    Reservar
                  </button>
                )}
                {profile?.id === selectedKit.created_by && onEditClick && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedKit(null);
                        onEditClick(selectedKit);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-600 text-white py-3 rounded-lg font-semibold hover:bg-slate-700 transition"
                    >
                      <Edit2 className="w-5 h-5" />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(selectedKit.id)}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Confirmar exclusão</h3>
            <p className="text-slate-600 mb-6">Tem certeza que deseja excluir este kit? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
