import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { budgetsApi } from '@/services/budgets';
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

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Status transition modal
  const [transitioningBudget, setTransitioningBudget] = useState<Budget | null>(null);
  const [newStatus, setNewStatus] = useState<Budget['status'] | ''>('');
  const [statusNotes, setStatusNotes] = useState('');

  // Fetch budgets
  const { data, isLoading, isError } = useQuery({
    queryKey: ['budgets', currentPage],
    queryFn: () => budgetsApi.list(currentPage),
    refetchOnWindowFocus: true,
  });

  const budgets = data?.data || [];
  const meta = data?.meta;

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast('Orçamento excluído com sucesso!');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.duplicate(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast(`Orçamento duplicado com sucesso! Código: ${res.data.number_formatted}`);
      navigate(`/budgets/${res.data.id}/edit`);
    },
  });

  const versionMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.createVersion(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast(`Nova versão criada! Versão: ${res.data.version}`);
      navigate(`/budgets/${res.data.id}/edit`);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: Budget['status']; notes?: string }) =>
      budgetsApi.changeStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      showToast('Status do orçamento atualizado!');
      closeStatusModal();
    },
  });

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`Tem certeza que deseja excluir o orçamento ${code}?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleDuplicate = async (id: string) => {
    await duplicateMutation.mutateAsync(id);
  };

  const handleCreateVersion = async (id: string) => {
    await versionMutation.mutateAsync(id);
  };

  const handleCopyLink = (publicToken: string) => {
    const publicUrl = `${window.location.origin}/p/${publicToken}`;
    navigator.clipboard.writeText(publicUrl);
    showToast('Link da proposta copiado para a área de transferência!');
  };

  const handleDownloadPdf = async (id: string, code: string, version: number) => {
    setDownloadingId(id);
    try {
      const blob = await budgetsApi.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const formattedNum = code.replace('#', '');
      link.setAttribute('download', `orcamento_${formattedNum}_v${version}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`PDF do orçamento ${code} baixado com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar/baixar o PDF. Tente novamente mais tarde.');
    } finally {
      setDownloadingId(null);
    }
  };

  const openStatusModal = (budget: Budget) => {
    setTransitioningBudget(budget);
    setNewStatus(budget.status);
    setStatusNotes('');
  };

  const closeStatusModal = () => {
    setTransitioningBudget(null);
    setNewStatus('');
    setStatusNotes('');
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transitioningBudget && newStatus) {
      statusMutation.mutate({
        id: transitioningBudget.id,
        status: newStatus,
        notes: statusNotes || undefined,
      });
    }
  };

  const formatPrice = (price: string | number) => {
    const numeric = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric || 0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
      new Date(dateString)
    );
  };

  // Local filtering by search and status
  const filteredBudgets = budgets.filter((budget) => {
    const codeStr = budget.number_formatted.toLowerCase();
    const customerLower = budget.customer?.name.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = codeStr.includes(searchLower) || customerLower.includes(searchLower);
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isError) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-6 text-center text-red-400">
        Ocorreu um erro ao carregar os orçamentos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Orçamentos Comercial</h2>
          <p className="mt-1 text-sm text-gray-400">Emita propostas comerciais, duplique, versione e controle o fluxo de aprovação.</p>
        </div>
        <Link
          to="/budgets/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
        >
          ➕ Novo Orçamento
        </Link>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 p-4 text-sm text-green-400 transition-all">
          ✓ {successMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <label className="sr-only">Buscar orçamento</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código ou cliente..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Filtrar por Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="draft">Rascunho</option>
            <option value="sent">Enviado</option>
            <option value="viewed">Visualizado</option>
            <option value="negotiating">Em Negociação</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
            <option value="expired">Expirado</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-gray-400">
              Carregando orçamentos...
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-gray-400">
              <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
              <p className="text-sm text-gray-500">Crie propostas para começar a fechar negócios.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-gray-300">
              <thead className="bg-gray-950 text-xs font-semibold uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Data Vencimento</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                  <th className="px-6 py-4 text-right">Desconto</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredBudgets.map((budget) => {
                  const theme = STATUS_THEMES[budget.status];
                  const isExpired = budget.expiration_date && new Date(budget.expiration_date) < new Date() && budget.status !== 'approved' && budget.status !== 'rejected';
                  return (
                    <tr key={budget.id} className="hover:bg-gray-850 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        <Link to={`/budgets/${budget.id}/edit`} className="hover:underline text-blue-400">
                          {budget.number_formatted} v{budget.version}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{budget.customer?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={isExpired ? 'text-red-400 font-semibold' : ''}>
                          {formatDate(budget.expiration_date)}
                          {isExpired && ' (Vencido)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{formatPrice(budget.subtotal)}</td>
                      <td className="px-6 py-4 text-right font-mono text-red-400">-{formatPrice(budget.discount)}</td>
                      <td className="px-6 py-4 text-right font-mono text-white font-bold">{formatPrice(budget.total)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openStatusModal(budget)}
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border} cursor-pointer hover:opacity-80`}
                          title="Alterar Status"
                        >
                          {theme.label} ⚙️
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/budgets/${budget.id}/edit`}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                            title="Editar Orçamento"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => handleCreateVersion(budget.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-purple-400 transition-colors cursor-pointer"
                            title="Gerar Nova Versão"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => handleCopyLink(budget.public_token)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-indigo-400 transition-colors cursor-pointer"
                            title="Copiar Link Público"
                          >
                            🔗
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(budget.id, budget.number_formatted, budget.version)}
                            disabled={downloadingId === budget.id}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-green-400 transition-colors cursor-pointer disabled:opacity-30"
                            title="Baixar PDF"
                          >
                            {downloadingId === budget.id ? '⏳' : '📄'}
                          </button>
                          <button
                            onClick={() => handleDuplicate(budget.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-blue-400 transition-colors cursor-pointer"
                            title="Duplicar Orçamento"
                          >
                            👯
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id, budget.number_formatted)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.total > meta.per_page && (
          <div className="flex items-center justify-between border-t border-gray-800 bg-gray-950 px-6 py-4">
            <span className="text-xs text-gray-400">
              Página <strong className="text-white">{meta.current_page}</strong> de{' '}
              <strong className="text-white">{Math.ceil(meta.total / meta.per_page)}</strong> (
              Total: {meta.total} )
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="rounded bg-gray-850 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-850 cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= Math.ceil(meta.total / meta.per_page) || isLoading}
                className="rounded bg-gray-850 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-850 cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Transition Modal */}
      {transitioningBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative">
            <button
              onClick={closeStatusModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-2">
              Transição de Status — {transitioningBudget.number_formatted}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Registre a mudança no fluxo de fechamento e anote detalhes da negociação.
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Novo Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Budget['status'])}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="draft">Rascunho (Em Elaboração)</option>
                  <option value="sent">Enviado (Aguardando Retorno)</option>
                  <option value="viewed">Visualizado (Cliente abriu a proposta)</option>
                  <option value="negotiating">Em Negociação (Ajustes de preço/condição)</option>
                  <option value="approved">Aprovado (Confirmado/Fechado)</option>
                  <option value="rejected">Rejeitado (Descartado pelo cliente)</option>
                  <option value="expired">Expirado (Validade vencida)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Observações da Mudança (Opcional)</label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: Cliente solicitou desconto de 5% para fechar. Alterado para negociação."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  className="rounded-lg bg-gray-800 hover:bg-gray-750 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={statusMutation.isPending}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {statusMutation.isPending ? 'Gravando...' : 'Salvar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
