import { useState, useEffect } from 'react';
import { supabase, Equipment } from '../lib/supabase';
import { Package, Calendar } from 'lucide-react';

interface EquipmentListProps {
  onReserveClick: () => void;
}

export default function EquipmentList({ onReserveClick }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEquipment(data);
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 text-lg">Nenhum equipamento cadastrado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedEquipment(item)}
          >
            <img
              src={item.photo_url_1}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 text-lg">{item.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-slate-600 text-sm line-clamp-2">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedEquipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{selectedEquipment.name}</h2>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEquipment.status)}`}>
                  {selectedEquipment.status}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Descrição</h3>
                <p className="text-slate-600">{selectedEquipment.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Fotos do Equipamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <img src={selectedEquipment.photo_url_1} alt="Foto 1" className="w-full h-48 object-cover rounded-lg" />
                  <img src={selectedEquipment.photo_url_2} alt="Foto 2" className="w-full h-48 object-cover rounded-lg" />
                  <img src={selectedEquipment.photo_url_3} alt="Foto 3" className="w-full h-48 object-cover rounded-lg" />
                  <img src={selectedEquipment.photo_url_4} alt="Foto 4" className="w-full h-48 object-cover rounded-lg" />
                </div>
              </div>
              {selectedEquipment.status === 'disponível' && (
                <button
                  onClick={() => {
                    setSelectedEquipment(null);
                    onReserveClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Calendar className="w-5 h-5" />
                  Reservar Equipamento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
