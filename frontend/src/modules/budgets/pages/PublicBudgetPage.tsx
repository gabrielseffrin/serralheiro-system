import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { budgetsApi } from '@/services/budgets';
import { 
  Download, 
  X, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ThumbsDown
} from 'lucide-react';

export default function PublicBudgetPage() {
  const { token } = useParams<{ token: string }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Query details using public token
  const { data: budgetData, isLoading, refetch } = useQuery({
    queryKey: ['public-budget', token],
    queryFn: () => budgetsApi.getPublic(token!),
    enabled: !!token,
    retry: false,
  });

  const budget = budgetData?.data;

  // Mutations for guest actions
  const approveMutation = useMutation({
    mutationFn: (notes?: string) => budgetsApi.approvePublic(token!, notes),
    onSuccess: () => {
      setSuccessMessage('Proposta aprovada com sucesso! Obrigado pelo retorno.');
      setIsApproveModalOpen(false);
      refetch();
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Falha ao aprovar orçamento.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (notes?: string) => budgetsApi.rejectPublic(token!, notes),
    onSuccess: () => {
      setSuccessMessage('Retorno enviado. Lamentamos que a proposta não atenda suas necessidades.');
      setIsRejectModalOpen(false);
      refetch();
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Falha ao rejeitar orçamento.');
    },
  });

  const handleDownloadPdf = async () => {
    if (!token || downloading) return;
    setDownloading(true);
    try {
      const blob = await budgetsApi.downloadPublicPdf(token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const formattedNum = String(budget?.number).padStart(6, '0');
      link.setAttribute('download', `proposta_${formattedNum}_v${budget?.version}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar/baixar PDF. Tente novamente mais tarde.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
          Carregando proposta comercial...
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4 animate-bounce" />
          <h2 className="text-xl font-bold text-white mb-2">Proposta não encontrada</h2>
          <p className="text-sm text-slate-400 mb-6">
            O link de visualização pode ter expirado ou o código do orçamento é inválido. Entre em contato com a empresa para obter um novo link.
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isPendingActions = ['sent', 'viewed', 'negotiating'].includes(budget.status);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 min-h-screen text-slate-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
      {/* Floating Action Header Bar */}
      <div className="max-w-4xl w-full sticky top-4 z-10 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping"></span>
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            Você está visualizando a proposta {budget.number_formatted}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 px-4 py-2 text-xs font-bold text-white transition-colors border border-slate-750 flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {downloading ? 'Gerando...' : <span className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Baixar PDF</span>}
          </button>
          {isPendingActions && (
            <>
              <button
                onClick={() => {
                  setClientNotes('');
                  setIsRejectModalOpen(true);
                }}
                className="rounded-xl bg-red-650/20 hover:bg-red-650/35 border border-red-800 text-red-400 px-4 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" /> Recusar
              </button>
              <button
                onClick={() => {
                  setClientNotes('');
                  setIsApproveModalOpen(true);
                }}
                className="rounded-xl bg-green-600 hover:bg-green-500 text-white px-5 py-2 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-green-900/30 flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Aprovar Proposta
              </button>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="max-w-4xl w-full rounded-xl border border-green-800 bg-green-950/20 p-4 text-sm text-green-400 flex items-center gap-2.5 shadow-lg animate-scale-up">
          <CheckCircle2 className="h-5 w-5 text-green-455" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-4xl w-full rounded-xl border border-red-850 bg-red-950/20 p-4 text-sm text-red-400 shadow-md">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Budget Proposal Sheet (Print-like document) */}
      <div className="max-w-4xl w-full bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-12 overflow-hidden border border-slate-200">
        
        {/* Proposal Header Banner inside the document */}
        {!isPendingActions && (
          <div className={`mb-8 p-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 border ${
            budget.status === 'approved' 
              ? 'bg-green-950/20 text-green-455 border-green-900/40' 
              : budget.status === 'rejected'
              ? 'bg-red-950/20 text-red-450 border-red-900/40'
              : 'bg-slate-900/30 text-slate-550 border-slate-800/60'
          }`}>
            {budget.status === 'approved' && (
              <>
                <CheckCircle2 className="h-4.5 w-4.5 text-green-555" />
                <span>Esta proposta foi aprovada comercialmente.</span>
              </>
            )}
            {budget.status === 'rejected' && (
              <>
                <X className="h-4.5 w-4.5 text-red-400" />
                <span>Esta proposta foi recusada pelo cliente.</span>
              </>
            )}
            {budget.status === 'expired' && (
              <>
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                <span>Esta proposta expirou e não está mais disponível para aceite.</span>
              </>
            )}
          </div>
        )}

        <header className="border-b-2 border-slate-800 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start gap-6">
          {/* Empresa */}
          <div>
            {budget.company?.logo ? (
              <img src={budget.company.logo} alt="Logo" className="h-20 object-contain mb-3" />
            ) : (
              <div className="h-16 w-16 bg-slate-900 rounded-lg flex items-center justify-center text-white text-2xl font-black mb-3">
                {budget.company?.name ? budget.company.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{budget.company?.name}</h1>
            {budget.company?.trade_name && (
              <p className="text-slate-500 font-semibold text-sm">{budget.company.trade_name}</p>
            )}
            <div className="text-xs mt-3 text-slate-650 space-y-0.5">
              {budget.company?.document && <p>CNPJ: <strong>{budget.company.document}</strong></p>}
              {budget.company?.phone && <p>Telefone: <strong>{budget.company.phone}</strong></p>}
              {budget.company?.email && <p>E-mail: <strong>{budget.company.email}</strong></p>}
              {budget.company?.address && <p>Endereço: <strong>{budget.company.address}</strong></p>}
            </div>
          </div>

          {/* Badge do orçamento */}
          <div className="sm:text-right">
            <div className="bg-slate-900 text-white rounded-lg px-5 py-3 inline-block text-left sm:text-right">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-300">Proposta Comercial</p>
              <p className="text-3xl font-black leading-tight">{budget.number_formatted}</p>
              <p className="text-xs font-semibold text-slate-400">Versão {budget.version}</p>
            </div>
            <div className="mt-4 text-xs text-slate-650 space-y-0.5">
              <p>Emissão: <strong>{new Date(budget.created_at).toLocaleDateString('pt-BR')}</strong></p>
              {budget.expiration_date && (
                <p>Válido até: <strong className="text-red-650">{new Date(budget.expiration_date).toLocaleDateString('pt-BR')}</strong></p>
              )}
            </div>
          </div>
        </header>

        {/* Cliente e Local de Instalação */}
        <section className="border border-slate-200 rounded-xl p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Dados cadastrais */}
            <div>
              <h2 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                Destinatário / Cliente
              </h2>
              <p className="font-bold text-slate-800 text-base">
                {budget.customer?.name}
              </p>
              <div className="mt-2 text-xs text-slate-650 space-y-0.5">
                {budget.customer?.document && <p>CPF/CNPJ: <strong>{budget.customer.document}</strong></p>}
                {budget.customer?.phone && <p>Telefone: <strong>{budget.customer.phone}</strong></p>}
                {budget.customer?.email && <p>E-mail: <strong>{budget.customer.email}</strong></p>}
              </div>
            </div>

            {/* Coluna 2: Dados da obra */}
            <div>
              <h2 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                Dados da Obra / Entrega
              </h2>
              <div className="text-xs text-slate-655 space-y-0.5">
                {budget.customer?.address ? (
                  <p>Local: <strong>{budget.customer.address}</strong></p>
                ) : (
                  <p className="text-slate-400 italic">Mesmo endereço cadastrado</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Itens */}
        <h2 className="font-black uppercase mb-4 tracking-wide text-slate-800 text-sm">
          Itens do Orçamento
        </h2>

        <div className="space-y-4 mb-8">
          {budget.items?.map((item, index) => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-5 bg-white text-slate-800">
              {/* Cabeçalho do item */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Item {index + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-800">
                    {item.product?.name}
                  </h3>
                  {(item.tag || item.location) && (
                    <p className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-1.5 items-center">
                      {item.tag && (
                        <span className="bg-slate-105 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                          {item.tag}
                        </span>
                      )}
                      {item.location && <span>Local: {item.location}</span>}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Quantidade</p>
                  <p className="text-lg font-black text-slate-800">{item.quantity}</p>
                </div>
              </div>

              {/* Especificações técnicas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {item.width && item.height && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Dimensão</p>
                    <p className="font-bold text-slate-700">{item.width} x {item.height} mm</p>
                  </div>
                )}
                {item.line && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Linha</p>
                    <p className="font-bold text-slate-700">{item.line.name}</p>
                  </div>
                )}
                {item.profile_color && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Cor Perfil</p>
                    <p className="font-bold text-slate-700">{item.profile_color.name}</p>
                  </div>
                )}
                {item.glass_type && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Vidro</p>
                    <p className="font-bold text-slate-700">{item.glass_type.name}</p>
                  </div>
                )}
                {item.accessory_color && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Cor Acessório</p>
                    <p className="font-bold text-slate-700">{item.accessory_color.name}</p>
                  </div>
                )}
              </div>

              {/* Observação do item */}
              {item.notes && (
                <div className="mt-4 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-100">
                  <strong className="text-slate-700">Observação:</strong> {item.notes}
                </div>
              )}

              {/* Valores */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-8 text-right">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Valor Unitário</p>
                  <p className="font-mono text-slate-700">{formatCurrency(parseFloat(item.unit_price))}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total do Item</p>
                  <p className="font-mono font-black text-slate-900 text-base">{formatCurrency(parseFloat(item.total))}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo Financeiro */}
        <div className="flex justify-end mt-6 mb-8">
          <div className="w-80 border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3 space-y-2 text-xs font-mono text-slate-700">
              <div className="flex justify-between">
                <span className="font-sans">Subtotal:</span>
                <span>{formatCurrency(parseFloat(budget.subtotal))}</span>
              </div>
              {parseFloat(budget.discount) > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span className="font-sans">Desconto (−):</span>
                  <span>{formatCurrency(parseFloat(budget.discount))}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <span className="font-bold uppercase text-sm">Total Geral</span>
              <span className="text-2xl font-black">{formatCurrency(parseFloat(budget.total))}</span>
            </div>
          </div>
        </div>

        {/* Condições Comerciais */}
        <section className="border-t-2 border-slate-200 pt-6 mb-10">
          <h2 className="font-black uppercase mb-4 tracking-wide text-sm text-slate-800">
            Condições Comerciais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            {budget.payment_method && (
              <div className="bg-slate-55 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Forma de Pagamento</p>
                <p className="font-bold text-slate-800">{budget.payment_method}</p>
              </div>
            )}

            {budget.delivery_term && (
              <div className="bg-slate-55 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Prazo de Entrega</p>
                <p className="font-bold text-slate-800">{budget.delivery_term}</p>
              </div>
            )}

            {budget.warranty_term && (
              <div className="bg-slate-55 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Garantia</p>
                <p className="font-bold text-slate-800">{budget.warranty_term}</p>
              </div>
            )}
          </div>

          {budget.notes && (
            <div className="mt-4 bg-slate-50 rounded-lg p-4 text-xs border border-slate-100 text-slate-650">
              <p className="font-bold text-slate-700 mb-1">Observações Gerais:</p>
              <p className="whitespace-pre-line leading-relaxed">{budget.notes}</p>
            </div>
          )}
        </section>

        {/* Assinaturas */}
        <div className="grid grid-cols-2 gap-8 md:gap-20 mt-16 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 pt-3 mx-4 md:mx-8">
              <p className="font-bold text-slate-800">{budget.company?.name}</p>
              <p className="text-slate-500">Responsável Comercial</p>
            </div>
          </div>

          <div>
            <div className="border-t border-slate-400 pt-3 mx-4 md:mx-8 flex flex-col items-center">
              <div className="w-full mb-2 h-12 flex items-center justify-center">
                {budget.status === 'approved' && (
                  <div className="text-green-600 font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded">
                    <Check className="h-3.5 w-3.5 text-green-600" /> Aceito Digitalmente
                  </div>
                )}
              </div>
              <p className="font-bold text-slate-800">{budget.customer?.name}</p>
              <p className="text-slate-555">Aceite do Cliente</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
          Orçamento válido conforme condições descritas neste documento.
          <br />
          Gerado em {new Date(budget.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </footer>

      </div>

      {/* Approve Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-400 animate-pulse" /> Confirmar Aprovação
            </h3>
            <p className="text-sm text-slate-400">
              Ao confirmar, você formaliza a aprovação comercial desta proposta de orçamento. Você pode deixar um comentário ou observação para a serralheria abaixo:
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Observações adicionais (opcional)</label>
              <textarea
                rows={3}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Ex: Pode iniciar. Aguardo o contato para agendar as medições finais."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => approveMutation.mutate(clientNotes)}
                disabled={approveMutation.isPending}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-green-950/20 cursor-pointer"
              >
                {approveMutation.isPending ? 'Confirmando...' : 'Confirmar e Aprovar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              <ThumbsDown className="h-5 w-5 text-red-400" /> Recusar Proposta
            </h3>
            <p className="text-sm text-slate-400">
              Por favor, informe-nos o motivo do declínio para que possamos ajustar a proposta ou melhorar nosso atendimento:
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Motivo do declínio *</label>
              <textarea
                rows={3}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Ex: Preço acima do orçamento planejado, prazo de entrega muito longo, etc."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate(clientNotes)}
                disabled={rejectMutation.isPending}
                className="flex-1 rounded-xl bg-red-650 hover:bg-red-550 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-red-950/20 cursor-pointer"
              >
                {rejectMutation.isPending ? 'Enviando...' : 'Enviar e Recusar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
