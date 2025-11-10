import { Package, Calendar, ShoppingCart, Bell, User, Home, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [expandEquipment, setExpandEquipment] = useState(
    currentView === 'equipment' || currentView === 'kits' || currentView === 'add-equipment' || currentView === 'add-kit'
  );

  const menuItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'purchase', label: 'Solicitar Compra', icon: ShoppingCart },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const equipmentSubItems = [
    { id: 'equipment', label: 'Todos os Equipamentos' },
    { id: 'kits', label: 'Kits' },
  ];

  const handleEquipmentClick = (subItemId: string) => {
    onViewChange(subItemId);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Gestão de</h1>
            <p className="text-sm text-slate-600">Equipamentos</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}

          <li className="pt-2">
            <button
              onClick={() => setExpandEquipment(!expandEquipment)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                expandEquipment || currentView === 'equipment' || currentView === 'kits'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Package className="w-5 h-5 flex-shrink-0" />
              <span>Equipamentos</span>
              <ChevronDown
                className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${
                  expandEquipment ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandEquipment && (
              <ul className="space-y-1 mt-1 ml-2 border-l-2 border-slate-200">
                {equipmentSubItems.map((item) => {
                  const isActive = currentView === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleEquipmentClick(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 ml-1'
                            : 'text-slate-700 hover:bg-slate-50 ml-1'
                        }`}
                      >
                        <span className="text-sm">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  );
}
