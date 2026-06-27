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
  Send,
  Settings,
  AlertCircle,
  MoreVertical,
  Package,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableSkeleton } from '@/components/TableSkeleton';

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { message: successMsg, variant, showToast } = useToast(4000);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [transitioningBudget, setTransitioningBudget] = useState<Budget | null>(null);
  const [newStatus, setNewStatus] = useState<Budget['status'] | ''>('');
  const [statusNotes, setStatusNotes] = useState('');

  const [budgetToDelete, setBudgetToDelete] = useState<{ id: string; code: string } | null>(null);

  // Share modal state
  const [sharingBudget, setSharingBudget] = useState<Budget | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['budgets', currentPage],
    queryFn: () => budgetsApi.list(currentPage),
    refetchOnWindowFocus: true,
  });

  const budgets = data?.data || [];
  const meta = data?.meta;

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
    navigator.clipboard.writeText(publicUrl).then(() => {
      showToast('Link da proposta copiado para a área de transferência!');
    }).catch(() => {
      showToast('Erro ao copiar o link.', 'error');
    });
  };

  const handleShareWhatsApp = (budget: Budget) => {
    const publicUrl = `${window.location.origin}/p/${budget.public_token}`;
    const message = encodeURIComponent(
      `Olá ${budget.customer?.name || ''}, segue a proposta comercial ${budget.number_formatted}.\n\n${publicUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
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
    } catch {
      showToast('Erro ao gerar/baixar o PDF. Tente novamente mais tarde.', 'error');
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Orçamentos Comercial</h2>
          <p className="mt-1 text-sm text-muted-foreground">Emita propostas comerciais, duplique, versione e controle o fluxo de fechamento.</p>
        </div>
        <Link
          to="/budgets/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Novo Orçamento
        </Link>
      </div>

      <Toast message={successMsg} variant={variant} />

      <div className="rounded-2xl border border-border/80 bg-card/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por código ou cliente..." />
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none cursor-pointer"
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

      <div className="rounded-2xl border border-border/80 bg-card/20 overflow-visible">
        <div className="overflow-x-auto min-h-[350px]">
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filteredBudgets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground p-6">
              <p className="text-lg font-bold text-foreground mb-1">Nenhum orçamento encontrado</p>
              <p className="text-xs text-muted-foreground/80">Crie novas propostas para começar a listar aqui.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead className="bg-muted/60 text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border/80">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Código / Versão</th>
                  <th className="px-6 py-4 whitespace-nowrap">Cliente</th>
                  <th className="px-6 py-4 whitespace-nowrap">Itens</th>
                  <th className="px-6 py-4 whitespace-nowrap">Data Vencimento</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Subtotal</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Desconto</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Total</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {filteredBudgets.map((budget) => {
                  const theme = STATUS_THEMES[budget.status] || STATUS_THEMES.draft;
                  const isExpired = budget.expiration_date && new Date(budget.expiration_date) < new Date() && budget.status !== 'approved' && budget.status !== 'rejected';
                  return (
                    <tr key={budget.id} className="hover:bg-card/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        <Link to={`/budgets/${budget.id}/edit`} className="hover:underline text-blue-400">
                          {budget.number_formatted} v{budget.version}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">{budget.customer?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted border border-input px-2 py-0.5 text-xs font-semibold text-foreground">
                          <Package className="h-3 w-3 text-muted-foreground/80" />
                          {budget.items_count ?? 0} ite{(budget.items_count ?? 0) !== 1 ? 'ns' : 'm'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={isExpired ? 'text-red-400 font-bold' : ''}>
                          {formatDate(budget.expiration_date)}
                          {isExpired && ' (Vencido)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{formatPrice(budget.subtotal)}</td>
                      <td className="px-6 py-4 text-right font-mono text-red-400">-{formatPrice(budget.discount)}</td>
                      <td className="px-6 py-4 text-right font-mono text-foreground font-black">{formatPrice(budget.total)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openStatusModal(budget)}
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border} cursor-pointer hover:scale-105 transition-transform`}
                          title="Alterar Status"
                        >
                          {theme.label} <Settings className="h-3 w-3 ml-1.5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer" title="Opções">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {budget.status === 'draft' && (
                              <DropdownMenuItem asChild>
                                <Link to={`/budgets/${budget.id}/edit`}>
                                  <Edit className="h-4 w-4" /> Editar Orçamento
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleCreateVersion(budget.id)}>
                              <GitBranch className="h-4 w-4" /> Gerar Nova Versão
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(budget.public_token)}>
                              <Link2 className="h-4 w-4" /> Copiar Link Público
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSharingBudget(budget)}>
                              <Send className="h-4 w-4" /> Enviar para Cliente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(budget.id, budget.number_formatted, budget.version)} disabled={downloadingId === budget.id}>
                              {downloadingId === budget.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-emerald-500" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              Baixar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(budget.id)}>
                              <Copy className="h-4 w-4" /> Duplicar Orçamento
                            </DropdownMenuItem>
                            {budget.status === 'draft' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => setBudgetToDelete({ id: budget.id, code: budget.number_formatted })}>
                                  <Trash2 className="h-4 w-4" /> Excluir Orçamento
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Novo Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Budget['status'])}
                className="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none cursor-pointer"
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
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Observações da Mudança (Opcional)</label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none"
                placeholder="Ex: Cliente solicitou desconto de 5% para fechar. Alterado para negociação."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={closeStatusModal} className="rounded-xl bg-muted hover:bg-accent px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" disabled={statusMutation.isPending} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/10">
                {statusMutation.isPending ? 'Gravando...' : 'Salvar Alteração'}
              </button>
            </div>
          </form>
        )}
      </Modal>

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

      {/* Share / Send to Client Modal */}
      <Modal
        isOpen={sharingBudget !== null}
        onClose={() => setSharingBudget(null)}
        title="Enviar Proposta para o Cliente"
        description="Compartilhe o link da proposta com o cliente via WhatsApp ou copie o link."
        maxWidth="max-w-md"
      >
        {sharingBudget && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Link da Proposta</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/p/${sharingBudget.public_token}`}
                  className="flex-1 rounded-xl border border-input bg-input px-3 py-2 text-sm text-foreground"
                />
                <button
                  onClick={() => handleCopyLink(sharingBudget.public_token)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-all cursor-pointer"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleShareWhatsApp(sharingBudget)}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> Abrir no WhatsApp
              </button>
              <button
                onClick={() => handleDownloadPdf(sharingBudget.id, sharingBudget.number_formatted, sharingBudget.version)}
                disabled={downloadingId === sharingBudget.id}
                className="flex-1 rounded-xl bg-muted hover:bg-accent px-4 py-3 text-sm font-bold text-foreground transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Baixar PDF
              </button>
            </div>

            <p className="text-xs text-muted-foreground/60 text-center">
              O cliente poderá visualizar, baixar o PDF e aprovar ou rejeitar a proposta pelo link.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
