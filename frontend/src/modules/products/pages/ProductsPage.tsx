import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productsApi } from '@/services/products';
import { productSchema, type ProductFormData } from '../schemas/product';
import type { Product } from '@/types';

const PRICING_TYPES: Record<Product['pricing_type'], string> = {
  fixed: 'Valor Fixo',
  per_m2: 'Por Metro Quadrado (m²)',
  per_meter: 'Por Metro Linear (m)',
  per_kg: 'Por Quilo (kg)',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ['products', currentPage],
    queryFn: () => productsApi.listProducts(currentPage),
  });

  const { data: linesData } = useQuery({
    queryKey: ['product-lines-list'],
    queryFn: () => productsApi.listLines(),
  });

  const products = productsData?.data || [];
  const meta = productsData?.meta;
  const lines = linesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Partial<Product>) => productsApi.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Produto cadastrado com sucesso!');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) =>
      productsApi.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Produto atualizado com sucesso!');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Produto removido com sucesso!');
    },
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      default_line_id: '',
      pricing_type: 'fixed',
      base_price: 0,
      requires_dimensions: false,
      min_width: null,
      min_height: null,
      active: true,
    },
  });

  const watchPricingType = watch('pricing_type');
  const watchRequiresDimensions = watch('requires_dimensions');

  // Show dimension constraints if pricing is area-based (per_m2) or user checked requires_dimensions
  const showDimensions = watchPricingType === 'per_m2' || watchRequiresDimensions;

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      description: '',
      default_line_id: '',
      pricing_type: 'fixed',
      base_price: 0,
      requires_dimensions: false,
      min_width: null,
      min_height: null,
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      description: product.description || '',
      default_line_id: product.default_line_id || '',
      pricing_type: product.pricing_type,
      base_price: parseFloat(product.base_price) || 0,
      requires_dimensions: product.requires_dimensions,
      min_width: product.min_width,
      min_height: product.min_height,
      active: product.active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const onSubmit: SubmitHandler<ProductFormData> = async (formData) => {
    // If we're not showing dimensions, make sure they are sent as null
    const payload: Partial<Product> = {
      name: formData.name,
      description: formData.description || null,
      default_line_id: formData.default_line_id || null,
      pricing_type: formData.pricing_type,
      base_price: formData.base_price.toString(),
      requires_dimensions: formData.requires_dimensions,
      min_width: showDimensions ? formData.min_width : null,
      min_height: showDimensions ? formData.min_height : null,
      active: formData.active,
    };

    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto ${name}?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatPrice = (price: string | number) => {
    const numeric = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric || 0);
  };

  // Local filtering
  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.default_line?.name && product.default_line.name.toLowerCase().includes(searchLower))
    );
  });

  if (isError) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-6 text-center text-red-400">
        Ocorreu um erro ao carregar os produtos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Produtos e Modelos</h2>
          <p className="mt-1 text-sm text-gray-400">Gerencie a tabela de esquadrias e serviços disponíveis para orçar.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
        >
          <span>➕</span> Novo Produto
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 p-4 text-sm text-green-400 transition-all">
          ✓ {successMsg}
        </div>
      )}

      {/* Filters and Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-800 p-4">
          <div className="max-w-md">
            <label className="sr-only">Buscar produto</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, descrição ou linha..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-gray-400">
              Carregando produtos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-gray-400">
              <p className="text-lg font-medium">Nenhum produto cadastrado</p>
              <p className="text-sm text-gray-500">Clique em "Novo Produto" para começar.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-gray-300">
              <thead className="bg-gray-950 text-xs font-semibold uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Linha Padrão</th>
                  <th className="px-6 py-4">Precificação</th>
                  <th className="px-6 py-4">Preço Base</th>
                  <th className="px-6 py-4">Dimensões</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-850 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {product.default_line ? (
                        <span className="rounded bg-blue-950 border border-blue-900 px-2 py-0.5 text-blue-400">
                          {product.default_line.name}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">{PRICING_TYPES[product.pricing_type]}</td>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-white">
                      {formatPrice(product.base_price)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {product.requires_dimensions || product.pricing_type === 'per_m2' ? (
                        <span className="text-gray-300">
                          {product.min_width ? `Largura min: ${product.min_width}mm` : 'L: Livre'}
                          <br />
                          {product.min_height ? `Altura min: ${product.min_height}mm` : 'A: Livre'}
                        </span>
                      ) : (
                        <span className="text-gray-500">Não exige</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          product.active ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
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
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Cadastre as especificações, preços e dimensões padrão da esquadria.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Nome do Produto *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Portão Basculante, Janela de Correr 2 Fg"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Linha de Alumínio Padrão</label>
                <select
                  {...register('default_line_id')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Sem linha associada</option>
                  {lines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name} {!line.active && '(Inativa)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">Precificação *</label>
                  <select
                    {...register('pricing_type')}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="fixed">Preço Fixo</option>
                    <option value="per_m2">Por Metro Quadrado (m²)</option>
                    <option value="per_meter">Por Metro Linear (m)</option>
                    <option value="per_kg">Por Peso (kg)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('base_price', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {errors.base_price && <p className="mt-1 text-xs text-red-400">{errors.base_price.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Descrição Comercial</label>
                <textarea
                  rows={2}
                  {...register('description')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Modelo padrão, inclui trincos e guarnições..."
                />
              </div>

              <div className="border-t border-b border-gray-850 py-3 my-2 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="req-dimensions"
                    {...register('requires_dimensions')}
                    className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="req-dimensions" className="text-xs font-semibold text-gray-300 cursor-pointer">
                    Exige dimensões personalizadas no orçamento (Largura/Altura)
                  </label>
                </div>

                {showDimensions && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-950 p-3 rounded-lg border border-gray-850 animate-fade-in">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Largura Mínima (mm)</label>
                      <input
                        type="number"
                        {...register('min_width', { valueAsNumber: true })}
                        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ex: 500"
                      />
                      {errors.min_width && <p className="mt-1 text-[10px] text-red-400">{errors.min_width.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Altura Mínima (mm)</label>
                      <input
                        type="number"
                        {...register('min_height', { valueAsNumber: true })}
                        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ex: 600"
                      />
                      {errors.min_height && <p className="mt-1 text-[10px] text-red-400">{errors.min_height.message}</p>}
                    </div>
                    <p className="col-span-2 text-[10px] text-gray-500 leading-normal">
                      * Restrições ativadas: Os orçamentos bloquearão dimensões menores que o mínimo estipulado.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prod-active"
                  {...register('active')}
                  className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="prod-active" className="text-xs font-semibold text-gray-300 cursor-pointer">
                  Produto ativo para novos orçamentos
                </label>
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
