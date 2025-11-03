import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Reservation, Equipment, Kit } from '../lib/supabase';
import { LogOut, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import Home from './Home';
import Profile from './Profile';
import Notifications from './Notifications';
import EquipmentList from './EquipmentList';
import EquipmentForm from './EquipmentForm';
import KitList from './KitList';
import KitForm from './KitForm';
import ReservationCalendar from './ReservationCalendar';
import ReservationForm from './ReservationForm';
import ReturnEquipment from './ReturnEquipment';
import PurchaseRequestForm from './PurchaseRequestForm';

type View = 'home' | 'equipment' | 'kits' | 'calendar' | 'purchase' | 'add-equipment' | 'add-kit' | 'reserve' | 'profile' | 'notifications';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [pendingReturns, setPendingReturns] = useState<(Reservation & { equipment?: Equipment; kit?: Kit })[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    if (profile) {
      loadPendingReturns();
    }
  }, [profile]);

  const loadPendingReturns = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        equipment(*),
        kits(*)
      `)
      .eq('user_id', profile.id)
      .eq('status', 'em uso');

    if (!error && data) {
      setPendingReturns(data as any);
    }
  };

  const handleReturnComplete = () => {
    loadPendingReturns();
    setShowReturnModal(false);
  };

  const getFirstTwoNames = (fullName: string) => {
    const names = fullName.split(' ');
    return names.slice(0, 2).join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentView={currentView} onViewChange={(view) => setCurrentView(view as View)} />

      <div className="flex-1 ml-64">
        <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex justify-end items-center">
              <div className="flex items-center gap-4">
                {profile?.photo_url && (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {profile?.full_name ? getFirstTwoNames(profile.full_name) : ''}
                  </p>
                  <p className="text-xs text-slate-600">{profile?.team}</p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {pendingReturns.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <p className="text-amber-900 font-medium">
                    Você tem {pendingReturns.length} {pendingReturns.length === 1 ? 'equipamento' : 'equipamentos'} para devolver
                  </p>
                </div>
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
                >
                  Devolver Agora
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-8 py-8">

          {currentView === 'home' && (
            <Home onCreateReservation={() => setCurrentView('reserve')} />
          )}

          {currentView === 'profile' && <Profile />}

          {currentView === 'notifications' && <Notifications />}

          {currentView === 'equipment' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Equipamentos</h2>
              <button
                onClick={() => setCurrentView('add-equipment')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Equipamento
              </button>
            </div>
            <EquipmentList onReserveClick={() => setCurrentView('reserve')} />
          </div>
        )}

        {currentView === 'kits' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Kits</h2>
              <button
                onClick={() => setCurrentView('add-kit')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Criar Kit
              </button>
            </div>
            <KitList onReserveClick={() => setCurrentView('reserve')} />
          </div>
        )}

        {currentView === 'calendar' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Calendário de Reservas</h2>
            <ReservationCalendar />
          </div>
        )}

        {currentView === 'purchase' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Solicitar Compra</h2>
            <PurchaseRequestForm onSuccess={() => setCurrentView('equipment')} />
          </div>
        )}

        {currentView === 'add-equipment' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Cadastrar Novo Equipamento</h2>
            <EquipmentForm onSuccess={() => setCurrentView('equipment')} />
          </div>
        )}

        {currentView === 'add-kit' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Criar Novo Kit</h2>
            <KitForm onSuccess={() => setCurrentView('kits')} />
          </div>
        )}

          {currentView === 'reserve' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Nova Reserva</h2>
              <ReservationForm onSuccess={() => setCurrentView('calendar')} />
            </div>
          )}
        </div>

        {showReturnModal && (
          <ReturnEquipment
            reservations={pendingReturns}
            onClose={() => setShowReturnModal(false)}
            onComplete={handleReturnComplete}
          />
        )}
      </div>
    </div>
  );
}
