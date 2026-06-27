import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { companyApi } from '@/services/company';
import { companySchema, type CompanyFormData } from '../schemas/company';
import { Building2, Save, UploadCloud, Loader2, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { inputStyle } from '@/lib/utils';

export default function CompanyPage() {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { message: successMsg, variant, showToast } = useToast();

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.get(),
  });

  const company = companyData?.data;

  const updateMutation = useMutation({
    mutationFn: (data: CompanyFormData) => companyApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      showToast('Configurações salvas com sucesso!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Erro ao salvar configurações.', 'error');
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => companyApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      showToast('Logotipo atualizado com sucesso!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Erro ao enviar logotipo.', 'error');
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: () => companyApi.removeLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      showToast('Logotipo removido com sucesso!');
      setIsConfirmOpen(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Erro ao remover logotipo.', 'error');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    values: company ? {
      name: company.name,
      trade_name: company.trade_name || '',
      document: company.document || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      default_notes: company.default_notes || '',
      default_payment_method: company.default_payment_method || '',
      default_delivery_term: company.default_delivery_term || '',
      default_warranty_term: company.default_warranty_term || '',
    } : undefined,
  });

  const onSubmit = async (data: CompanyFormData) => {
    await updateMutation.mutateAsync(data);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadLogoMutation.mutate(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        Carregando dados da empresa...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Dados da Empresa</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Gerencie as informações cadastrais e as definições padrão da sua serralheria.</p>
      </div>

      <Toast message={successMsg} variant={variant} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card/40 p-6 space-y-4 text-center">
          <h3 className="text-sm font-semibold text-foreground">Logotipo</h3>
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 overflow-hidden relative group">
            {company?.logo ? (
              <img src={company.logo} alt="Logo da Empresa" className="max-h-full max-w-full object-contain p-2" loading="lazy" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/80">
                <Building2 className="h-10 w-10 text-muted-foreground/50" />
                <span className="text-xs">Sem Logo</span>
              </div>
            )}
            {uploadLogoMutation.isPending && (
              <div className="absolute inset-0 bg-muted/60 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card/50 hover:bg-muted px-4 py-2.5 text-xs font-bold text-foreground hover:text-foreground transition-all">
              <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
              {company?.logo ? 'Alterar logotipo' : 'Adicionar logotipo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadLogoMutation.isPending || removeLogoMutation.isPending} />
            </label>
            {company?.logo && (
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={uploadLogoMutation.isPending || removeLogoMutation.isPending}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-950 bg-red-950/20 hover:bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover logotipo
              </button>
            )}
            <p className="text-xs text-muted-foreground/80">Formatos suportados: PNG, JPG (Máx. 2MB)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card/40 p-6 space-y-6">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-blue-500" />
              Informações Cadastrais
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Fantasia / Razão Social</label>
                <input type="text" {...register('name')} className={inputStyle} />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Comercial (Opcional)</label>
                <input type="text" {...register('trade_name')} className={inputStyle} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">CNPJ (Opcional)</label>
                <input type="text" {...register('document')} className={inputStyle} placeholder="00.000.000/0000-00" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone (Opcional)</label>
                <input type="text" {...register('phone')} className={inputStyle} />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail para Orçamentos (Opcional)</label>
                <input type="email" {...register('email')} className={inputStyle} />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Endereço Completo (Opcional)</label>
                <textarea rows={2} {...register('address')} className={inputStyle} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/40 p-6 space-y-6">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-blue-500" />
              Configurações Padrão de Propostas
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Forma de Pagamento</label>
                <input type="text" {...register('default_payment_method')} className={inputStyle} placeholder="Ex: 50% entrada, 50% entrega" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Prazo de Entrega</label>
                <input type="text" {...register('default_delivery_term')} className={inputStyle} placeholder="Ex: 25 dias úteis" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Prazo de Garantia</label>
                <input type="text" {...register('default_warranty_term')} className={inputStyle} placeholder="Ex: 1 ano contra defeitos" />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações / Termos Padrão</label>
                <textarea rows={3} {...register('default_notes')} className={inputStyle} placeholder="Observações que aparecerão ao final de todos os orçamentos (termos de aceitação, validade de preços, etc)." />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4.5 w-4.5" />
              {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Remover logotipo"
        description="Tem certeza que deseja remover o logotipo da sua empresa? Essa imagem não será mais exibida nas suas propostas comerciais."
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        onConfirm={() => removeLogoMutation.mutate()}
        onCancel={() => setIsConfirmOpen(false)}
        isDangerous={true}
        isLoading={removeLogoMutation.isPending}
      />
    </div>
  );
}
