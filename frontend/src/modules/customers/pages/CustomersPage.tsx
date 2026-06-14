import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customersApi } from '@/services/customers';
import { customerSchema, type CustomerFormData } from '../schemas/customer';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${name}?`)) {
      await deleteMutation.mutateAsync(id);
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
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-6 text-center text-red-400">
        Ocorreu um erro ao carregar os clientes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Clientes</h2>
          <p className="mt-1 text-sm text-gray-400">Gerencie o cadastro de clientes e parceiros da sua serralheria.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
        >
          <span>➕</span> Novo Cliente
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 p-4 text-sm text-green-400 transition-all">
          ✓ {successMsg}
        </div>
      )}

      {/* Filter and Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-800 p-4">
          <div className="max-w-md">
            <label className="sr-only">Buscar cliente</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, e-mail ou documento..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-gray-400">
              Carregando clientes...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-gray-400">
              <p className="text-lg font-medium">Nenhum cliente cadastrado</p>
              <p className="text-sm text-gray-500">Clique em "Novo Cliente" para começar.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-gray-300">
              <thead className="bg-gray-950 text-xs font-semibold uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Endereço</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-850 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{customer.name}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {customer.phone && <p className="text-white">{customer.phone}</p>}
                        {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                        {!customer.phone && !customer.email && <span className="text-xs text-gray-500">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{customer.document || '-'}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{customer.address || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Modal/Drawer Component */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Preencha os campos abaixo com os dados cadastrais do cliente.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Nome ou Razão Social *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Gabriel Seffrin"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">Telefone</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">CPF / CNPJ</label>
                  <input
                    type="text"
                    {...register('document')}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: 000.000.000-00"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">E-mail</label>
                <input
                  type="text"
                  {...register('email')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Endereço Completo</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Anotações Internas</label>
                <textarea
                  rows={3}
                  {...register('notes')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Horários preferenciais de contato, observações de faturamento..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg bg-gray-800 hover:bg-gray-750 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
