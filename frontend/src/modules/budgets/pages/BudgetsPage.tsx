import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { budgetsApi } from '@/services/budgets';
import type { Budget } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { STATUS_THEMES } from '@/components/StatusBadge';
import Toast from '@/components/Toast';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { 
  Plus, 
  Edit, 
  Copy, 
  GitBranch, 
  Trash2, 
  Download, 
  Link2, 
  Settings, 
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';



export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { message: successMsg, showToast } = useToast(4000);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Status transition modal
  const [transitioningBudget, setTransitioningBudget] = useState<Budget | null>(null);
  const [newStatus, setNewStatus] = useState<Budget['status'] | ''>('');
  const [statusNotes, setStatusNotes] = useState('');

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Deletion confirmation state
  const [budgetToDelete, setBudgetToDelete] = useState<{ id: string; code: string } | null>(null);

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



  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
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
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-6 text-center text-red-400 flex items-center justify-center gap-2">
        <AlertCircle className="h-5 w-5" />
        Ocorreu um erro ao carregar os orçamentos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Orçamentos Comercial</h2>
          <p className="mt-1 text-sm text-slate-400">Emita propostas comerciais, duplique, versione e controle o fluxo de fechamento.</p>
        </div>
        <Link
          to="/budgets/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Novo Orçamento
        </Link>
      </div>

      {/* Success Notification (Toast) */}
      <Toast message={successMsg} />

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por código ou cliente..."
        />

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
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
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 overflow-visible">
        <div className="overflow-x-auto min-h-[350px]">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-slate-750 border-t-blue-500"></div>
              Carregando orçamentos...
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400 p-6">
              <p className="text-lg font-bold text-white mb-1">Nenhum orçamento encontrado</p>
              <p className="text-xs text-slate-500">Crie novas propostas para começar a listar aqui.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4.5">Código / Versão</th>
                  <th className="px-6 py-4.5">Cliente</th>
                  <th className="px-6 py-4.5">Data Vencimento</th>
                  <th className="px-6 py-4.5 text-right">Subtotal</th>
                  <th className="px-6 py-4.5 text-right">Desconto</th>
                  <th className="px-6 py-4.5 text-right">Total</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-350">
                {filteredBudgets.map((budget) => {
                  const theme = STATUS_THEMES[budget.status] || STATUS_THEMES.draft;
                  const isExpired = budget.expiration_date && new Date(budget.expiration_date) < new Date() && budget.status !== 'approved' && budget.status !== 'rejected';
                  return (
                    <tr key={budget.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        <Link to={`/budgets/${budget.id}/edit`} className="hover:underline text-blue-450">
                          {budget.number_formatted} v{budget.version}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{budget.customer?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={isExpired ? 'text-red-450 font-bold' : ''}>
                          {formatDate(budget.expiration_date)}
                          {isExpired && ' (Vencido)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{formatPrice(budget.subtotal)}</td>
                      <td className="px-6 py-4 text-right font-mono text-red-400">-{formatPrice(budget.discount)}</td>
                      <td className="px-6 py-4 text-right font-mono text-white font-black">{formatPrice(budget.total)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openStatusModal(budget)}
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border} cursor-pointer hover:scale-102 transition-transform`}
                          title="Alterar Status"
                        >
                          {theme.label} <Settings className="h-3 w-3 ml-1.5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === budget.id ? null : budget.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-805 hover:text-white transition-all cursor-pointer"
                            title="Opções"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>

                          {openDropdownId === budget.id && (
                            <>
                              {/* Overlay backdrop */}
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              {/* Dropdown Menu */}
                              <div className="absolute right-6 top-12 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl z-40 text-left animate-scale-up">
                                {budget.status === 'draft' && (
                                  <Link
                                    to={`/budgets/${budget.id}/edit`}
                                    onClick={() => setOpenDropdownId(null)}
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4" /> Editar Orçamento
                                  </Link>
                                )}

                                <button
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    handleCreateVersion(budget.id);
                                  }}
                                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-purple-400 transition-colors cursor-pointer text-left"
                                >
                                  <GitBranch className="h-4 w-4" /> Gerar Nova Versão
                                </button>

                                <button
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    handleCopyLink(budget.public_token);
                                  }}
                                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-indigo-400 transition-colors cursor-pointer text-left"
                                >
                                  <Link2 className="h-4 w-4" /> Copiar Link Público
                                </button>

                                <button
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    handleDownloadPdf(budget.id, budget.number_formatted, budget.version);
                                  }}
                                  disabled={downloadingId === budget.id}
                                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors cursor-pointer text-left disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  {downloadingId === budget.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-500" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                  Baixar PDF
                                </button>

                                <button
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    handleDuplicate(budget.id);
                                  }}
                                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors cursor-pointer text-left"
                                >
                                  <Copy className="h-4 w-4" /> Duplicar Orçamento
                                </button>

                                {budget.status === 'draft' && (
                                  <>
                                    <div className="h-px bg-slate-800 my-1" />

                                    <button
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setBudgetToDelete({ id: budget.id, code: budget.number_formatted });
                                      }}
                                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer text-left font-semibold"
                                    >
                                      <Trash2 className="h-4 w-4" /> Excluir Orçamento
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={meta ? Math.ceil(meta.total / meta.per_page) : 1}
          totalItems={meta?.total || 0}
          isLoading={isLoading}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Status Transition Modal */}
      <Modal
        isOpen={transitioningBudget !== null}
        onClose={closeStatusModal}
        title={`Transição de Status — ${transitioningBudget?.number_formatted || ''}`}
        description="Registre a mudança no fluxo de fechamento e anote detalhes da negociação."
        maxWidth="max-w-md"
      >
        {transitioningBudget && (
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Novo Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Budget['status'])}
                className="w-full rounded-xl border border-slate-750 bg-slate-850 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none cursor-pointer"
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
              <label className="mb-1 block text-xs font-semibold text-slate-400">Observações da Mudança (Opcional)</label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-750 bg-slate-850 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="Ex: Cliente solicitou desconto de 5% para fechar. Alterado para negociação."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={closeStatusModal}
                className="rounded-xl bg-slate-800 hover:bg-slate-750 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={statusMutation.isPending}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/10"
              >
                {statusMutation.isPending ? 'Gravando...' : 'Salvar Alteração'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={budgetToDelete !== null}
        title="Excluir Orçamento"
        description={`Tem certeza de que deseja excluir o orçamento ${budgetToDelete?.code}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        isDangerous={true}
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (budgetToDelete) {
            await handleDelete(budgetToDelete.id);
            setBudgetToDelete(null);
          }
        }}
        onCancel={() => setBudgetToDelete(null)}
      />
    </div>
  );
}
