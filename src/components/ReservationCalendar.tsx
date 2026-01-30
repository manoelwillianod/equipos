import { useState, useEffect } from 'react';
import { supabase, Reservation, Equipment, Kit, Profile } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import PickupEquipment from './PickupEquipment';

interface ReservationWithDetails extends Reservation {
  equipment?: Equipment;
  kits?: Kit;
  profiles?: Profile;
}

export default function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupReservations, setPickupReservations] = useState<ReservationWithDetails[]>([]);

  useEffect(() => {
    loadReservations();
  }, [currentDate]);

  const loadReservations = async () => {
    setLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        equipment(*),
        kits(*),
        profiles(*)
      `)
      .gte('start_date', startOfMonth.toISOString().split('T')[0])
      .lte('end_date', endOfMonth.toISOString().split('T')[0])
      .in('status', ['agendado', 'em uso']);

    if (!error && data) {
      setReservations(data as any);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(reservation => {
      const start = new Date(reservation.start_date);
      const end = new Date(reservation.end_date);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isPickupEligible = (reservation: ReservationWithDetails) => {
    if (reservation.status !== 'agendado') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(reservation.start_date);
    startDate.setHours(0, 0, 0, 0);
    return startDate <= today;
  };

  const handlePickupClick = (reservation: ReservationWithDetails) => {
    setPickupReservations([reservation]);
    setShowPickupModal(true);
  };

  const handlePickupComplete = () => {
    loadReservations();
    setShowPickupModal(false);
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const selectedDateReservations = selectedDate ? getReservationsForDate(selectedDate) : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 capitalize">{monthName}</h3>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayReservations = getReservationsForDate(day);
              const hasReservations = dayReservations.length > 0;
              const isTodayDate = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-2 rounded-lg border-2 transition ${
                    isTodayDate
                      ? 'border-blue-500 bg-blue-50'
                      : hasReservations
                      ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-900">
                    {day.getDate()}
                  </div>
                  {hasReservations && (
                    <div className="flex justify-center mt-1">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-4">
                Reservas para {selectedDate.toLocaleDateString('pt-BR')}
              </h4>
              {selectedDateReservations.length === 0 ? (
                <p className="text-slate-600">Nenhuma reserva para esta data</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateReservations.map((reservation) => {
                    const isEligible = isPickupEligible(reservation);
                    return (
                      <div
                        key={reservation.id}
                        className="p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {reservation.equipment?.name || reservation.kits?.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              Por: {reservation.profiles?.full_name}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            reservation.status === 'agendado' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {reservation.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {new Date(reservation.start_date).toLocaleDateString('pt-BR')} até{' '}
                          {new Date(reservation.end_date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-slate-700 mb-3">
                          <span className="font-medium">Motivo:</span> {reservation.reason}
                        </p>
                        {isEligible && (
                          <button
                            onClick={() => handlePickupClick(reservation)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
                          >
                            <Package className="w-4 h-4" />
                            Retirar Agora
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showPickupModal && (
        <PickupEquipment
          reservations={pickupReservations}
          onClose={() => setShowPickupModal(false)}
          onComplete={handlePickupComplete}
        />
      )}
    </div>
  );
}
