import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Equipment, Kit, Reservation } from '../lib/supabase';
import { Calendar, Package, Box, TrendingUp, Clock, Plus } from 'lucide-react';

interface HomeProps {
  onCreateReservation: () => void;
}

export default function Home({ onCreateReservation }: HomeProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalEquipment: 0,
    totalKits: 0,
    activeReservations: 0,
    availableEquipment: 0,
  });
  const [recentReservations, setRecentReservations] = useState<(Reservation & { equipment?: Equipment; kit?: Kit })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const [equipmentRes, kitsRes, reservationsRes, activeRes] = await Promise.all([
        supabase.from('equipment').select('*', { count: 'exact', head: true }),
        supabase.from('kits').select('*', { count: 'exact', head: true }),
        supabase
          .from('reservations')
          .select(`
            *,
            equipment(*),
            kits(*)
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .in('status', ['agendado', 'em uso']),
      ]);

      const availableEquipmentRes = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disponível');

      setStats({
        totalEquipment: equipmentRes.count || 0,
        totalKits: kitsRes.count || 0,
        activeReservations: activeRes.count || 0,
        availableEquipment: availableEquipmentRes.count || 0,
      });

      if (reservationsRes.data) {
        setRecentReservations(reservationsRes.data as any);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Bem-vindo de volta, {profile?.full_name.split(' ')[0]}!
        </h2>
        <p className="text-slate-600">
          Aqui está um resumo do sistema de gestão de equipamentos
        </p>
      </div>

      <div className="mb-8">
        <button
          onClick={onCreateReservation}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg">Criar Reserva</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {stats.totalEquipment}
          </h3>
          <p className="text-sm text-slate-600">Total de Equipamentos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Box className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {stats.totalKits}
          </h3>
          <p className="text-sm text-slate-600">Total de Kits</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {stats.activeReservations}
          </h3>
          <p className="text-sm text-slate-600">Reservas Ativas</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {stats.availableEquipment}
          </h3>
          <p className="text-sm text-slate-600">Disponíveis</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">
          Suas Reservas Recentes
        </h3>

        {recentReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Você ainda não tem reservas</p>
            <button
              onClick={onCreateReservation}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Criar sua primeira reserva
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentReservations.map((reservation) => {
              const itemName = reservation.equipment?.name || reservation.kit?.name || 'Item desconhecido';
              const statusColors = {
                agendado: 'bg-blue-100 text-blue-700',
                'em uso': 'bg-green-100 text-green-700',
                concluído: 'bg-slate-100 text-slate-700',
                cancelado: 'bg-red-100 text-red-700',
              };

              return (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg">
                      {reservation.equipment ? (
                        <Package className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Box className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{itemName}</h4>
                      <p className="text-sm text-slate-600">
                        {new Date(reservation.start_date).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(reservation.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[reservation.status]}`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
