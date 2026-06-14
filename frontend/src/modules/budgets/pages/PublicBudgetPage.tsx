import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { budgetsApi } from '@/services/budgets';

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
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
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
            {downloading ? 'Gerando...' : '📥 Baixar PDF'}
          </button>
          {isPendingActions && (
            <>
              <button
                onClick={() => {
                  setClientNotes('');
                  setIsRejectModalOpen(true);
                }}
                className="rounded-xl bg-red-650/20 hover:bg-red-650/35 border border-red-800 text-red-400 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                ✕ Recusar
              </button>
              <button
                onClick={() => {
                  setClientNotes('');
                  setIsApproveModalOpen(true);
                }}
                className="rounded-xl bg-green-600 hover:bg-green-500 text-white px-5 py-2 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-green-900/30"
              >
                ✓ Aprovar Proposta
              </button>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="max-w-4xl w-full rounded-xl border border-green-800 bg-green-900/20 p-4 text-sm text-green-400 shadow-md">
          🎉 {successMessage}
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
          <div className={`mb-8 p-4 rounded-xl text-center font-bold text-sm ${
            budget.status === 'approved' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : budget.status === 'rejected'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {budget.status === 'approved' && '✓ Esta proposta foi aprovada comercialmente.'}
            {budget.status === 'rejected' && '✕ Esta proposta foi recusada pelo cliente.'}
            {budget.status === 'expired' && '⚠️ Esta proposta expirou e não está mais disponível para aceite.'}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 mb-8 gap-6">
          <div>
            {budget.company?.logo ? (
              <img src={budget.company.logo} alt="Logo" className="h-16 object-contain mb-4" />
            ) : (
              <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-black mb-4">
                {budget.company?.name ? budget.company.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-800">{budget.company?.name}</h1>
            {budget.company?.trade_name && (
              <p className="text-xs text-slate-500 font-medium">{budget.company.trade_name}</p>
            )}
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              {budget.company?.document && <p>CNPJ: {budget.company.document}</p>}
              {budget.company?.phone && <p>Fone: {budget.company.phone}</p>}
              {budget.company?.email && <p>E-mail: {budget.company.email}</p>}
              {budget.company?.address && <p>Endereço: {budget.company.address}</p>}
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-block bg-blue-550/10 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mb-3">
              Proposta Comercial
            </span>
            <h2 className="text-2xl font-black text-slate-900">{budget.number_formatted}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Versão {budget.version}</p>
            <div className="mt-4 text-xs text-slate-600 space-y-0.5">
              <p>Data de emissão: <strong>{new Date(budget.created_at).toLocaleDateString('pt-BR')}</strong></p>
              {budget.expiration_date && (
                <p>Válido até: <strong className="text-red-650">{new Date(budget.expiration_date).toLocaleDateString('pt-BR')}</strong></p>
              )}
              <p>Status: <strong className="uppercase">{budget.status}</strong></p>
            </div>
          </div>
        </div>

        {/* Customer Detail / Installation Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Destinatário / Cliente</h3>
            <p className="font-bold text-slate-800">{budget.customer?.name}</p>
            <div className="mt-1.5 text-xs text-slate-600 space-y-0.5">
              {budget.customer?.document && <p>CPF/CNPJ: {budget.customer.document}</p>}
              {budget.customer?.phone && <p>Fone: {budget.customer.phone}</p>}
              {budget.customer?.email && <p>E-mail: {budget.customer.email}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Local da Obra</h3>
            <div className="text-xs text-slate-600 space-y-0.5">
              <p>Instalação em: {budget.customer?.address || 'Mesmo endereço cadastrado'}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Itens Inclusos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-105 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <th className="p-3 w-12 text-center">Item</th>
                  <th className="p-3">Esquadria / Descrição Detalhada</th>
                  <th className="p-3 w-16 text-center">Qtd</th>
                  <th className="p-3 w-32 text-right">Unitário</th>
                  <th className="p-3 w-32 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                {budget.items?.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{item.product?.name}</p>
                      {(item.tag || item.location) && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          {item.tag && <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono font-bold mr-1">{item.tag}</span>}
                          {item.location && <span>- Local: {item.location}</span>}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1">
                        {item.width && item.height && (
                          <p>Medidas: <strong>{item.width} x {item.height} mm</strong></p>
                        )}
                        {item.line && <p>Linha: <strong>{item.line.name}</strong></p>}
                        {item.profile_color && <p>Perfil: <strong>{item.profile_color.name}</strong></p>}
                        {item.glass_type && <p>Vidro: <strong>{item.glass_type.name}</strong></p>}
                        {item.accessory_color && <p>Acessório: <strong>{item.accessory_color.name}</strong></p>}
                      </div>
                      
                      {item.notes && (
                        <p className="text-[11px] italic text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 mt-2">
                          Obs: {item.notes}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                    <td className="p-3 text-right font-mono text-slate-650">{formatCurrency(parseFloat(item.unit_price))}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(parseFloat(item.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Details */}
        <div className="flex justify-end mb-8">
          <div className="w-72 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 font-mono text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(parseFloat(budget.subtotal))}</span>
            </div>
            {parseFloat(budget.discount) > 0 && (
              <div className="flex justify-between text-red-650 font-semibold">
                <span>Desconto (-) :</span>
                <span>{formatCurrency(parseFloat(budget.discount))}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm font-bold text-slate-900">
              <span className="font-sans">Valor Total:</span>
              <span className="text-blue-700">{formatCurrency(parseFloat(budget.total))}</span>
            </div>
          </div>
        </div>

        {/* Commercial Conditions */}
        <div className="border-t border-slate-200 pt-6 mb-12 space-y-4 text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Condições Comerciais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {budget.payment_method && (
              <div>
                <span className="font-semibold text-slate-400 block">Forma de Pagamento</span>
                <span className="text-slate-800 font-medium">{budget.payment_method}</span>
              </div>
            )}
            {budget.delivery_term && (
              <div>
                <span className="font-semibold text-slate-400 block">Prazo de Entrega</span>
                <span className="text-slate-800 font-medium">{budget.delivery_term}</span>
              </div>
            )}
            {budget.warranty_term && (
              <div>
                <span className="font-semibold text-slate-400 block">Termo de Garantia</span>
                <span className="text-slate-800 font-medium">{budget.warranty_term}</span>
              </div>
            )}
          </div>
          {budget.notes && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
              <span className="font-semibold text-slate-500 block mb-1">Observações Adicionais:</span>
              <p className="whitespace-pre-line text-slate-650 text-[11px] leading-relaxed">{budget.notes}</p>
            </div>
          )}
        </div>

        {/* Signature Box */}
        <div className="grid grid-cols-2 gap-8 pt-12 border-t border-slate-200 text-center text-xs text-slate-400">
          <div className="flex flex-col items-center">
            <div className="w-48 border-b border-slate-200 mb-2 h-12"></div>
            <p className="font-bold text-slate-700">{budget.company?.name}</p>
            <p>Representante Comercial</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-48 border-b border-slate-200 mb-2 h-12">
              {budget.status === 'approved' && (
                <div className="text-green-600 font-mono text-[10px] uppercase font-bold flex items-center justify-center h-full tracking-widest bg-green-50 rounded">
                  ✓ Aceito Digitalmente
                </div>
              )}
            </div>
            <p className="font-bold text-slate-700">{budget.customer?.name}</p>
            <p>Assinatura / Aceite do Cliente</p>
          </div>
        </div>

      </div>

      {/* Approve Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🎉 Confirmar Aprovação
            </h3>
            <p className="text-sm text-slate-400">
              Ao confirmar, você formaliza a aprovação comercial desta proposta de orçamento. Você pode deixar um comentário ou observação para a serralheria abaixo:
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Observações adicionais (opcional)</label>
              <textarea
                rows={3}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Ex: Pode iniciar. Aguardo o contato para agendar as medições finais."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => approveMutation.mutate(clientNotes)}
                disabled={approveMutation.isPending}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {approveMutation.isPending ? 'Confirmando...' : 'Confirmar e Aprovar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              ✕ Recusar Proposta
            </h3>
            <p className="text-sm text-slate-400">
              Por favor, informe-nos o motivo do declínio para que possamos ajustar a proposta ou melhorar nosso atendimento:
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Motivo do declínio *</label>
              <textarea
                rows={3}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Ex: Preço acima do orçamento planejado, prazo de entrega muito longo, etc."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate(clientNotes)}
                disabled={rejectMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
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
