import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { companyApi } from '@/services/company';
import { companySchema, type CompanyFormData } from '../schemas/company';

export default function CompanyPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.get(),
  });

  const company = companyData?.data;

  const updateMutation = useMutation({
    mutationFn: (data: CompanyFormData) => companyApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => companyApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setSuccessMsg('Logotipo atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
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
      const file = e.target.files[0];
      uploadLogoMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-400">
        Carregando dados da empresa...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Dados da Empresa</h2>
        <p className="mt-2 text-gray-400">Gerencie as informações cadastrais e as definições padrão da sua serralheria.</p>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 p-4 text-sm text-green-400 transition-all">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left: Logo Upload */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4 text-center">
          <h3 className="text-sm font-semibold text-gray-300">Logotipo</h3>
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-950 overflow-hidden">
            {company?.logo ? (
              <img src={company.logo} alt="Logo da Empresa" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-2xl">🏭</span>
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-block w-full cursor-pointer rounded-lg bg-gray-800 hover:bg-gray-750 px-3 py-2 text-xs font-semibold text-white transition-colors">
              Alterar logotipo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadLogoMutation.isPending} />
            </label>
            <p className="text-[10px] text-gray-500">Formatos suportados: PNG, JPG (Máx. 2MB)</p>
          </div>
        </div>

        {/* Right: Core Fields Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-6">
            <h3 className="text-md font-semibold text-white border-b border-gray-800 pb-2">Informações Cadastrais</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Nome Fantasia / Razão Social</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Nome Comercial (Opcional)</label>
                <input
                  type="text"
                  {...register('trade_name')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">CNPJ (Opcional)</label>
                <input
                  type="text"
                  {...register('document')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Telefone (Opcional)</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-300">E-mail para Orçamentos (Opcional)</label>
                <input
                  type="text"
                  {...register('email')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Endereço Completo (Opcional)</label>
                <textarea
                  rows={2}
                  {...register('address')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Budget Defaults Card */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-6">
            <h3 className="text-md font-semibold text-white border-b border-gray-800 pb-2">Configurações Padrão de Propostas</h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Forma de Pagamento</label>
                <input
                  type="text"
                  {...register('default_payment_method')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: 50% entrada, 50% entrega"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Prazo de Entrega</label>
                <input
                  type="text"
                  {...register('default_delivery_term')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: 25 dias úteis"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Prazo de Garantia</label>
                <input
                  type="text"
                  {...register('default_warranty_term')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: 1 ano contra defeitos"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Observações / Termos Padrão</label>
                <textarea
                  rows={3}
                  {...register('default_notes')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Observações que aparecerão ao final de todos os orçamentos (termos de aceitação, validade de preços, etc)."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
