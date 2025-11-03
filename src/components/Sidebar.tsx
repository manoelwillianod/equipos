import { Package, Box, Calendar, ShoppingCart, Bell, User, Home } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'equipment', label: 'Todos os Equipamentos', icon: Package, parent: 'Equipamentos' },
    { id: 'kits', label: 'Kits', icon: Box, parent: 'Equipamentos' },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'purchase', label: 'Solicitar Compra', icon: ShoppingCart },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const equipmentItems = menuItems.filter(item => item.parent === 'Equipamentos');
  const mainItems = menuItems.filter(item => !item.parent);

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
          {mainItems.map((item) => {
            if (item.id === 'equipment') return null;

            const Icon = item.icon;
            const isActive = currentView === item.id;

            if (item.id === 'home') {
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
            }

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
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Equipamentos
              </p>
            </div>
            <ul className="space-y-1">
              {equipmentItems.map((item) => {
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
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
