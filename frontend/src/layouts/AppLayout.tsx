import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Clientes', path: '/customers', icon: '👥' },
  { label: 'Produtos', path: '/products', icon: '📦' },
  { label: 'Catálogos', path: '/catalogs', icon: '📚' },
  { label: 'Orçamentos', path: '/budgets', icon: '📋' },
  { label: 'Configurações', path: '/settings', icon: '⚙️' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-900">
        <div className="flex h-16 items-center border-b border-gray-800 px-6">
          <h1 className="text-xl font-black text-white bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Serralheiro</h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="mb-3 text-sm text-gray-400">
            <p className="font-medium text-white">{user?.name}</p>
            <p className="text-xs">{user?.company?.name}</p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-700 hover:text-white cursor-pointer"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <div className="h-16 border-b border-gray-800 bg-gray-900/50" />
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
