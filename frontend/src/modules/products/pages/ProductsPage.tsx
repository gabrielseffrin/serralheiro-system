import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productsApi } from '@/services/products';
import { productSchema, type ProductFormData } from '../schemas/product';
import type { Product } from '@/types';
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
import { formatPrice, inputStyle } from '@/lib/utils';

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
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { message: successMsg, showToast } = useToast();

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
      setDeletingProduct(null);
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

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (deletingProduct) {
      await deleteMutation.mutateAsync(deletingProduct.id);
    }
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
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-6 text-center text-red-400 flex items-center justify-center gap-2">
        <AlertCircle className="h-5 w-5" />
        Ocorreu um erro ao carregar os produtos.
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Produtos e Modelos</h2>
          <p className="mt-1.5 text-sm text-slate-450">Gerencie a tabela de esquadrias e serviços disponíveis para orçar.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Novo Produto
        </button>
      </div>

      {/* Success Notification */}
      <Toast message={successMsg} />

      {/* Filters and Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-slate-800/60 p-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, descrição ou linha..."
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-455">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              Carregando produtos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400 text-center p-6">
              <p className="text-lg font-bold text-white">Nenhum produto cadastrado</p>
              <p className="text-sm text-slate-500 mt-1">Clique em "Novo Produto" para começar.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-slate-350">
              <thead className="bg-slate-950/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-slate-450 line-clamp-1 mt-0.5">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      {product.default_line ? (
                        <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-blue-450">
                          {product.default_line.name}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{PRICING_TYPES[product.pricing_type]}</td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-white">
                      {formatPrice(product.base_price)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 leading-normal">
                      {product.requires_dimensions || product.pricing_type === 'per_m2' ? (
                        <span>
                          {product.min_width ? `Largura min: ${product.min_width}mm` : 'L: Livre'}
                          <br />
                          {product.min_height ? `Altura min: ${product.min_height}mm` : 'A: Livre'}
                        </span>
                      ) : (
                        <span className="text-slate-600">Não exige</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          product.active 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                            : 'bg-slate-800/40 text-slate-500 border-slate-750/30'
                        }`}
                      >
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
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
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        description="Cadastre as especificações, preços e dimensões padrão da esquadria."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Nome do Produto *</label>
            <input
              type="text"
              {...register('name')}
              className={inputStyle}
              placeholder="Ex: Portão Basculante, Janela de Correr 2 Fg"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Linha de Alumínio Padrão</label>
            <select
              {...register('default_line_id')}
              className={`${inputStyle} cursor-pointer`}
            >
              <option value="">Sem linha associada</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id} className="bg-slate-900">
                  {line.name} {!line.active && '(Inativa)'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Precificação *</label>
              <select
                {...register('pricing_type')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="fixed" className="bg-slate-900">Preço Fixo</option>
                <option value="per_m2" className="bg-slate-900">Por Metro Quadrado (m²)</option>
                <option value="per_meter" className="bg-slate-900">Por Metro Linear (m)</option>
                <option value="per_kg" className="bg-slate-900">Por Peso (kg)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Preço Base (R$) *</label>
              <input
                type="number"
                step="0.01"
                {...register('base_price', { valueAsNumber: true })}
                className={inputStyle}
                placeholder="0.00"
              />
              {errors.base_price && <p className="mt-1 text-xs text-red-400">{errors.base_price.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Descrição Comercial</label>
            <textarea
              rows={2}
              {...register('description')}
              className={inputStyle}
              placeholder="Ex: Modelo padrão, inclui trincos e guarnições..."
            />
          </div>

          <div className="border-t border-b border-slate-850 py-4 my-2 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="req-dimensions"
                {...register('requires_dimensions')}
                className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
              />
              <label htmlFor="req-dimensions" className="text-xs font-bold uppercase tracking-wider text-slate-350 cursor-pointer">
                Exige dimensões personalizadas no orçamento (Largura/Altura)
              </label>
            </div>

            {showDimensions && (
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850/80 animate-fade-in">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-455">Largura Mínima (mm)</label>
                  <input
                    type="number"
                    {...register('min_width', { valueAsNumber: true })}
                    className={`${inputStyle} py-1.5 px-3`}
                    placeholder="Ex: 500"
                  />
                  {errors.min_width && <p className="mt-1 text-[10px] text-red-400">{errors.min_width.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-455">Altura Mínima (mm)</label>
                  <input
                    type="number"
                    {...register('min_height', { valueAsNumber: true })}
                    className={`${inputStyle} py-1.5 px-3`}
                    placeholder="Ex: 600"
                  />
                  {errors.min_height && <p className="mt-1 text-[10px] text-red-400">{errors.min_height.message}</p>}
                </div>
                <p className="col-span-2 text-[10px] text-slate-500 leading-normal">
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
              className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
            />
            <label htmlFor="prod-active" className="text-xs font-bold uppercase tracking-wider text-slate-350 cursor-pointer">
              Produto ativo para novos orçamentos
            </label>
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
        isOpen={!!deletingProduct}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir o produto "${deletingProduct?.name}"? Esta ação removerá permanentemente o produto e ele não estará mais disponível para seleção em novos orçamentos.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProduct(null)}
        isDangerous={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
