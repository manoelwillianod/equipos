import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Reservation, Equipment, Kit } from '../lib/supabase';
import { Bell, Calendar, AlertCircle, Clock } from 'lucide-react';

export default function Notifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<(Reservation & { equipment?: Equipment; kit?: Kit })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadNotifications();
    }
  }, [profile]);

  const loadNotifications = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          equipment(*),
          kits(*)
        `)
        .eq('user_id', profile.id)
        .in('status', ['agendado', 'em uso'])
        .lte('end_date', threeDaysFromNow.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (!error && data) {
        setNotifications(data as any);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilReturn = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getNotificationColor = (days: number) => {
    if (days < 0) return 'red';
    if (days === 0) return 'orange';
    if (days <= 2) return 'amber';
    return 'blue';
  };

  const getNotificationMessage = (days: number) => {
    if (days < 0) return 'Devolução atrasada';
    if (days === 0) return 'Devolução hoje';
    if (days === 1) return 'Devolução amanhã';
    return `Devolução em ${days} dias`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Notificações</h2>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nenhuma notificação
          </h3>
          <p className="text-slate-600">
            Você não tem reservas próximas da data de devolução.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((reservation) => {
            const daysUntilReturn = getDaysUntilReturn(reservation.end_date);
            const color = getNotificationColor(daysUntilReturn);
            const message = getNotificationMessage(daysUntilReturn);
            const itemName = reservation.equipment?.name || reservation.kit?.name || 'Item desconhecido';

            return (
              <div
                key={reservation.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${
                  color === 'red'
                    ? 'border-red-500'
                    : color === 'orange'
                    ? 'border-orange-500'
                    : color === 'amber'
                    ? 'border-amber-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    color === 'red'
                      ? 'bg-red-100'
                      : color === 'orange'
                      ? 'bg-orange-100'
                      : color === 'amber'
                      ? 'bg-amber-100'
                      : 'bg-blue-100'
                  }`}>
                    {color === 'red' || color === 'orange' ? (
                      <AlertCircle className={`w-6 h-6 ${
                        color === 'red' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                    ) : (
                      <Clock className={`w-6 h-6 ${
                        color === 'amber' ? 'text-amber-600' : 'text-blue-600'
                      }`} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {itemName}
                        </h3>
                        <p className={`text-sm font-medium ${
                          color === 'red'
                            ? 'text-red-600'
                            : color === 'orange'
                            ? 'text-orange-600'
                            : color === 'amber'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                        }`}>
                          {message}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        reservation.status === 'em uso'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {reservation.status === 'em uso' ? 'Em Uso' : 'Agendado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Devolução: {new Date(reservation.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {reservation.reason && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Motivo:</span> {reservation.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
