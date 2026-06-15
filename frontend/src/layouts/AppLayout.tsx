import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BookOpen, 
  FileText, 
  Settings, 
  LogOut, 
  Calendar as CalendarIcon, 
  CircleCheck, 
  User as UserIcon 
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Clientes', path: '/customers', icon: Users },
  { label: 'Produtos', path: '/products', icon: Package },
  { label: 'Catálogos', path: '/catalogs', icon: BookOpen },
  { label: 'Orçamentos', path: '/budgets', icon: FileText },
  { label: 'Configurações', path: '/settings', icon: Settings },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
        <div className="flex h-16 items-center px-6 border-b border-slate-800/60">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Serralheiro<span className="text-blue-500">.</span>SaaS
            </span>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile section at the bottom */}
        <div className="border-t border-slate-800/60 bg-slate-900/20 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-slate-350">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.company?.name}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            <span className="capitalize">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-6">
            {/* System Online Badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
              <CircleCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Sistema Online
              </span>
            </div>
          </div>
        </header>

        {/* Outlet Main View Container */}
        <main className="flex-1 p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
