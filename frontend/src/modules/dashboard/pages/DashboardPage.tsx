import { useQuery } from '@tanstack/react-query';
import { budgetsApi } from '@/services/budgets';
import { Link } from 'react-router-dom';
import { formatPrice, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Percent, 
  Plus, 
  Users, 
  Package, 
  ArrowUpRight,
  TrendingUp 
} from 'lucide-react';



export default function DashboardPage() {
  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => budgetsApi.getDashboardStats(),
    refetchOnWindowFocus: true,
  });

  const stats = statsData?.data;



  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
        Carregando indicadores do painel...
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-6 text-center text-red-400">
        Erro ao carregar os dados estatísticos do painel.
      </div>
    );
  }

  // Calculate SVG circular properties for closing rate
  const strokeRadius = 36;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (Math.min(100, stats.conversion_rate) / 100) * strokeCircumference;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Painel de Controle</h2>
        <p className="mt-1.5 text-sm text-slate-450">
          Acompanhe o faturamento, conversão de propostas e funil de vendas em tempo real.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Orçado */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-blue-900/40 hover:bg-slate-900/60 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute inset-0 bg-radial from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450">Total Orçado</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/10">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-4 text-2.5xl font-black text-white font-mono tracking-tight relative z-10">
            {formatPrice(stats.total_value)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 relative z-10">
            {stats.total_count} {stats.total_count === 1 ? 'proposta emitida' : 'propostas emitidas'}
          </p>
        </div>

        {/* Metric 2: Aprovados */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-emerald-900/40 hover:bg-slate-900/60 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450">Aprovados</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/10">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-4 text-2.5xl font-black text-emerald-400 font-mono tracking-tight relative z-10">
            {formatPrice(stats.approved_value)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 relative z-10">
            {stats.approved_count} {stats.approved_count === 1 ? 'proposta fechada' : 'propostas fechadas'}
          </p>
        </div>

        {/* Metric 3: Pendentes */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-amber-900/40 hover:bg-slate-900/60 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450">Em Aberto</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/10">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-4 text-2.5xl font-black text-amber-500 font-mono tracking-tight relative z-10">
            {formatPrice(stats.pending_value)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 relative z-10">
            {stats.pending_count} {stats.pending_count === 1 ? 'proposta pendente' : 'propostas pendentes'}
          </p>
        </div>

        {/* Metric 4: Conversão (Circular design) */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-purple-900/40 hover:bg-slate-900/60 transition-all duration-300 relative group overflow-hidden flex items-center justify-between">
          <div className="absolute inset-0 bg-radial from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 block">Conversão</span>
            <p className="mt-2 text-3xl font-black text-purple-400 font-mono tracking-tight">
              {stats.conversion_rate}%
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Taxa de fechamento</p>
          </div>

          <div className="relative h-18 w-18 flex items-center justify-center z-10">
            <svg className="h-full w-full -rotate-90">
              <circle
                cx="36"
                cy="36"
                r={strokeRadius}
                className="stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="36"
                cy="36"
                r={strokeRadius}
                className="stroke-purple-500 transition-all duration-500"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-slate-450">
              <Percent className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent activity and actions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Recent Budgets Table */}
        <div className="rounded-2xl border border-slate-800/85 bg-slate-900/30 p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Últimos Orçamentos</h3>
              <p className="text-xs text-slate-500">Atividades recentes registradas no sistema</p>
            </div>
            <Link 
              to="/budgets" 
              className="rounded-lg border border-slate-800 hover:bg-slate-800 text-xs text-blue-400 hover:text-blue-300 font-semibold px-3 py-1.5 transition-all flex items-center gap-1 cursor-pointer"
            >
              Ver Todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {stats.recent.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-500">
                <p className="text-sm">Nenhum orçamento cadastrado recentemente.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                    <th className="px-4 py-3">Código / Versão</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {stats.recent.map((budget) => {
                    return (
                      <tr key={budget.id} className="hover:bg-slate-800/25 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          <Link to={`/budgets/${budget.id}/edit`} className="hover:underline text-blue-450">
                            {budget.number_formatted} v{budget.version}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-white max-w-[150px] truncate">{budget.customer_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-450">{formatDate(budget.created_at)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={budget.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white font-bold">
                          {formatPrice(budget.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Quick actions panel */}
        <div className="rounded-2xl border border-slate-800/85 bg-slate-900/30 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Atalhos Rápidos</h3>
            <p className="text-xs text-slate-500">Crie ou gerencie dados essenciais em poucos cliques</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 flex-1 mt-4">
            <Link
              to="/budgets/new"
              className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 p-4 transition-all text-white group shadow-md hover:shadow-blue-500/10 active:scale-[0.99]"
            >
              <div className="rounded-xl bg-white/10 p-2.5 text-xl flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Novo Orçamento</p>
                <p className="text-[11px] text-blue-200/90">Monte uma proposta comercial</p>
              </div>
            </Link>

            <Link
              to="/customers"
              className="flex items-center gap-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/70 p-4 transition-all border border-slate-800 text-white group active:scale-[0.99]"
            >
              <div className="rounded-xl bg-slate-800 group-hover:bg-slate-700 p-2.5 text-slate-400 group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Cadastrar Cliente</p>
                <p className="text-[11px] text-slate-500">Adicione contatos e leads</p>
              </div>
            </Link>

            <Link
              to="/products"
              className="flex items-center gap-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/70 p-4 transition-all border border-slate-800 text-white group active:scale-[0.99]"
            >
              <div className="rounded-xl bg-slate-800 group-hover:bg-slate-700 p-2.5 text-slate-400 group-hover:text-white transition-colors">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Catálogo de Esquadrias</p>
                <p className="text-[11px] text-slate-500">Gerencie modelos e preços</p>
              </div>
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 mt-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Dica: Mantenha seus catálogos de linhas e vidros atualizados para agilizar o preenchimento de propostas comerciais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
