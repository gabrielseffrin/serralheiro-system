import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Menu,
  Calendar as CalendarIcon,
  CircleCheck,
  User as UserIcon,
  ChevronRight,
  Home,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Clientes', path: '/customers', icon: Users },
  { label: 'Produtos', path: '/products', icon: Package },
  { label: 'Catálogos', path: '/catalogs', icon: BookOpen },
  { label: 'Orçamentos', path: '/budgets', icon: FileText },
  { label: 'Configurações', path: '/settings', icon: Settings },
];

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const breadcrumbMap: Record<string, string> = {
    customers: 'Clientes',
    products: 'Produtos',
    catalogs: 'Catálogos',
    budgets: 'Orçamentos',
    settings: 'Configurações',
    new: 'Novo',
    edit: 'Editar',
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground py-2">
      <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="h-3 w-3" />
      </Link>
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label = breadcrumbMap[segment] || segment;

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-border" />
            {isLast ? (
              <span className="text-foreground font-semibold">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center px-6 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setSheetOpen(false)}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            S
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
            Serralheiro<span className="text-blue-500">.</span>SaaS
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto" aria-label="Navegação principal">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSheetOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/10'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
                active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
              }`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 bg-card/20 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.company?.name}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/50 hover:bg-secondary px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair da Conta
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans antialiased">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>

      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-border/60 bg-card/40 backdrop-blur-md">
        {sidebarContent}
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-md px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-card/95 border-border p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de Navegação</SheetTitle>
                </SheetHeader>
                {sidebarContent}
              </SheetContent>
            </Sheet>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              <span className="capitalize">{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
              <CircleCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Sistema Online</span>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 lg:p-8 animate-fade-in">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
