import { useQuery } from '@tanstack/react-query';
import { budgetsApi } from '@/services/budgets';
import { Link } from 'react-router-dom';
import type { Budget } from '@/types';

const STATUS_THEMES: Record<Budget['status'], { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Rascunho', bg: 'bg-gray-800/50', text: 'text-gray-400', border: 'border-gray-700/50' },
  sent: { label: 'Enviado', bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-900/40' },
  viewed: { label: 'Visualizado', bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-900/40' },
  negotiating: { label: 'Em Negociação', bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-900/40' },
  approved: { label: 'Aprovado', bg: 'bg-green-950/40', text: 'text-green-400', border: 'border-green-900/40' },
  rejected: { label: 'Rejeitado', bg: 'bg-red-950/40', text: 'text-red-400', border: 'border-red-900/40' },
  expired: { label: 'Expirado', bg: 'bg-zinc-800/30', text: 'text-zinc-500', border: 'border-zinc-800' },
};

export default function DashboardPage() {
  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => budgetsApi.getDashboardStats(),
    refetchOnWindowFocus: true,
  });

  const stats = statsData?.data;

  const formatPrice = (price: number | string | undefined) => {
    const numeric = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric || 0);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-400">
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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Painel Geral</h2>
        <p className="mt-1 text-sm text-gray-400">
          Acompanhe o desempenho comercial e faturamento de sua serralheria.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Orçado */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-blue-900/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Total Orçado</span>
            <span className="text-xl">📋</span>
          </div>
          <p className="mt-4 text-3xl font-black text-white font-mono">{formatPrice(stats.total_value)}</p>
          <p className="mt-1.5 text-xs text-gray-500">
            {stats.total_count} {stats.total_count === 1 ? 'proposta gerada' : 'propostas geradas'}
          </p>
        </div>

        {/* Metric 2: Aprovados */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-green-900/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Aprovados</span>
            <span className="text-xl">💰</span>
          </div>
          <p className="mt-4 text-3xl font-black text-green-400 font-mono">{formatPrice(stats.approved_value)}</p>
          <p className="mt-1.5 text-xs text-gray-500">
            {stats.approved_count} {stats.approved_count === 1 ? 'fechamento confirmado' : 'fechamentos confirmados'}
          </p>
        </div>

        {/* Metric 3: Pendentes */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-amber-900/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Em Aberto</span>
            <span className="text-xl">⏳</span>
          </div>
          <p className="mt-4 text-3xl font-black text-amber-500 font-mono">{formatPrice(stats.pending_value)}</p>
          <p className="mt-1.5 text-xs text-gray-500">
            {stats.pending_count} {stats.pending_count === 1 ? 'proposta pendente' : 'propostas pendentes'}
          </p>
        </div>

        {/* Metric 4: Conversão */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-purple-900/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Taxa de Fechamento</span>
            <span className="text-xl">📈</span>
          </div>
          <p className="mt-4 text-3xl font-black text-purple-400 font-mono">{stats.conversion_rate}%</p>
          <div className="mt-3.5 h-1.5 w-full rounded-full bg-gray-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${Math.min(100, stats.conversion_rate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Recent activity and actions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Recent Budgets Table */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white">Orçamentos Recentes</h3>
            <Link to="/budgets" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Ver Todos →
            </Link>
          </div>

          <div className="overflow-x-auto">
            {stats.recent.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-gray-500">
                <p className="text-sm">Nenhum orçamento cadastrado recentemente.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-950 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {stats.recent.map((budget) => {
                    const theme = STATUS_THEMES[budget.status];
                    return (
                      <tr key={budget.id} className="hover:bg-gray-850 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          <Link to={`/budgets/${budget.id}/edit`} className="hover:underline">
                            {budget.number_formatted} v{budget.version}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-white max-w-[120px] truncate">{budget.customer_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-400">{formatDate(budget.created_at)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            {theme.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white font-semibold">
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
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-6">
          <h3 className="text-md font-bold text-white">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/budgets/new"
              className="flex items-center gap-4 rounded-lg bg-blue-600 hover:bg-blue-500 p-4 transition-colors text-white"
            >
              <div className="rounded-lg bg-white/10 p-2.5 text-xl">📄</div>
              <div>
                <p className="text-sm font-semibold">Novo Orçamento</p>
                <p className="text-[11px] text-blue-200">Monte uma proposta personalizada</p>
              </div>
            </Link>

            <Link
              to="/customers"
              className="flex items-center gap-4 rounded-lg bg-gray-800 hover:bg-gray-750 p-4 transition-colors border border-gray-750 text-white"
            >
              <div className="rounded-lg bg-gray-700 p-2.5 text-xl">👥</div>
              <div>
                <p className="text-sm font-semibold">Cadastrar Cliente</p>
                <p className="text-[11px] text-gray-400">Adicione novos contatos à carteira</p>
              </div>
            </Link>

            <Link
              to="/products"
              className="flex items-center gap-4 rounded-lg bg-gray-800 hover:bg-gray-750 p-4 transition-colors border border-gray-750 text-white"
            >
              <div className="rounded-lg bg-gray-700 p-2.5 text-xl">📦</div>
              <div>
                <p className="text-sm font-semibold">Catálogo de Esquadrias</p>
                <p className="text-[11px] text-gray-400">Gerencie produtos e preços de base</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
