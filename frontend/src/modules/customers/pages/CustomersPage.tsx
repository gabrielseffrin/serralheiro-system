import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customersApi } from '@/services/customers';
import { customerSchema, type CustomerFormData } from '../schemas/customer';
import type { Customer } from '@/types';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { inputStyle } from '@/lib/utils';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { message: successMsg, showToast } = useToast();

  // Fetch customers
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', currentPage],
    queryFn: () => customersApi.list(currentPage),
  });

  const customers = data?.data || [];
  const meta = data?.meta;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CustomerFormData) => customersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente cadastrado com sucesso!');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerFormData }) =>
      customersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente atualizado com sucesso!');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente removido com sucesso!');
      setDeletingCustomer(null);
    },
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });



  const openCreateModal = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      phone: '',
      email: '',
      document: '',
      address: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      document: customer.document || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const onSubmit: SubmitHandler<CustomerFormData> = async (formData) => {
    if (editingCustomer) {
      await updateMutation.mutateAsync({ id: editingCustomer.id, payload: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = (customer: Customer) => {
    setDeletingCustomer(customer);
  };

  const handleConfirmDelete = async () => {
    if (deletingCustomer) {
      await deleteMutation.mutateAsync(deletingCustomer.id);
    }
  };

  // Local filtering for quick UI searching
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.document && customer.document.includes(searchLower))
    );
  });

  if (isError) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-6 text-center text-red-400 flex items-center justify-center gap-2">
        <AlertCircle className="h-5 w-5" />
        Ocorreu um erro ao carregar os clientes.
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Clientes</h2>
          <p className="mt-1.5 text-sm text-slate-450">Gerencie o cadastro de clientes e parceiros da sua serralheria.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Novo Cliente
        </button>
      </div>

      {/* Success Notification */}
      <Toast message={successMsg} />

      {/* Filter and Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-slate-800/60 p-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, e-mail ou documento..."
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-455">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              Carregando clientes...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400 text-center p-6">
              <p className="text-lg font-bold text-white">Nenhum cliente cadastrado</p>
              <p className="text-sm text-slate-500 mt-1">Clique em "Novo Cliente" para começar.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-slate-350">
              <thead className="bg-slate-950/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Endereço</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{customer.name}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {customer.phone && <p className="text-white font-mono text-xs">{customer.phone}</p>}
                        {customer.email && <p className="text-xs text-slate-450">{customer.email}</p>}
                        {!customer.phone && !customer.email && <span className="text-xs text-slate-600">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{customer.document || '-'}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-400">{customer.address || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Modal/Drawer Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        description="Preencha os campos abaixo com os dados cadastrais do cliente."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Nome ou Razão Social *</label>
            <input
              type="text"
              {...register('name')}
              className={inputStyle}
              placeholder="Ex: Gabriel Seffrin"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Telefone</label>
              <input
                type="text"
                {...register('phone')}
                className={inputStyle}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">CPF / CNPJ</label>
              <input
                type="text"
                {...register('document')}
                className={inputStyle}
                placeholder="Ex: 000.000.000-00"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">E-mail</label>
            <input
              type="text"
              {...register('email')}
              className={inputStyle}
              placeholder="email@exemplo.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Endereço Completo</label>
            <input
              type="text"
              {...register('address')}
              className={inputStyle}
              placeholder="Rua, Número, Bairro, Cidade - UF"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Anotações Internas</label>
            <textarea
              rows={3}
              {...register('notes')}
              className={inputStyle}
              placeholder="Ex: Horários preferenciais de contato, observações de faturamento..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-650 hover:bg-blue-550 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-950/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingCustomer}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente "${deletingCustomer?.name}"? Esta ação não pode ser desfeita e removerá permanentemente todos os seus dados cadastrais.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCustomer(null)}
        isDangerous={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
