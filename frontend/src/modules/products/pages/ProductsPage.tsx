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
  AlertCircle
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { formatPrice, inputStyle } from '@/lib/utils';
import { TableSkeleton } from '@/components/TableSkeleton';

const PRICING_TYPES: Record<Product['pricing_type'], string> = {
  fixed: 'Valor Fixo',
  per_m2: 'Por Metro Quadrado (m²)',
  per_meter: 'Por Metro Linear (m)',
  per_kg: 'Por Quilo (kg)',
};

const UNIT_LABELS: Record<string, string> = {
  piece: 'Peça',
  m2: 'Metro Quadrado (m²)',
  linear_meter: 'Metro Linear (m)',
  kg: 'Quilograma (kg)',
  pair: 'Par',
  set: 'Jogo',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { message: successMsg, variant, showToast } = useToast();

  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ['products', currentPage],
    queryFn: () => productsApi.listProducts(currentPage),
  });

  const { data: linesData } = useQuery({
    queryKey: ['product-lines-list'],
    queryFn: () => productsApi.listLines(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories-list'],
    queryFn: () => productsApi.listCategories(),
  });

  const { data: colorsData } = useQuery({
    queryKey: ['product-colors-list'],
    queryFn: () => productsApi.listColors(),
  });

  const { data: glassData } = useQuery({
    queryKey: ['product-glass-list'],
    queryFn: () => productsApi.listGlassTypes(),
  });

  const products = productsData?.data || [];
  const meta = productsData?.meta;
  const lines = linesData?.data || [];
  const categories = categoriesData?.data || [];
  const colors = colorsData?.data || [];
  const glassTypes = glassData?.data || [];
  const profileColors = colors.filter((c) => c.type === 'profile');
  const accessoryColors = colors.filter((c) => c.type === 'accessory');

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
      code: '',
      description: '',
      category_id: '',
      image_path: '',
      default_line_id: '',
      pricing_type: 'fixed',
      unit: 'piece',
      base_price: 0,
      cost_price: null,
      requires_dimensions: false,
      min_width: null,
      min_height: null,
      max_width: null,
      max_height: null,
      default_weight: null,
      default_profile_color_id: '',
      default_accessory_color_id: '',
      default_glass_type_id: '',
      active: true,
    },
  });

  const watchPricingType = watch('pricing_type');
  const watchRequiresDimensions = watch('requires_dimensions');

  const showDimensions = watchPricingType === 'per_m2' || watchPricingType === 'per_meter' || watchPricingType === 'per_kg' || watchRequiresDimensions;

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      code: '',
      description: '',
      category_id: '',
      image_path: '',
      default_line_id: '',
      pricing_type: 'fixed',
      unit: 'piece',
      base_price: 0,
      cost_price: null,
      requires_dimensions: false,
      min_width: null,
      min_height: null,
      max_width: null,
      max_height: null,
      default_weight: null,
      default_profile_color_id: '',
      default_accessory_color_id: '',
      default_glass_type_id: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      code: product.code || '',
      description: product.description || '',
      category_id: product.category_id || '',
      image_path: product.image_path || '',
      default_line_id: product.default_line_id || '',
      pricing_type: product.pricing_type,
      unit: product.unit || 'piece',
      base_price: parseFloat(product.base_price) || 0,
      cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
      requires_dimensions: product.requires_dimensions,
      min_width: product.min_width,
      min_height: product.min_height,
      max_width: product.max_width,
      max_height: product.max_height,
      default_weight: product.default_weight ? parseFloat(product.default_weight) : null,
      default_profile_color_id: product.default_profile_color_id || '',
      default_accessory_color_id: product.default_accessory_color_id || '',
      default_glass_type_id: product.default_glass_type_id || '',
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
      code: formData.code || null,
      description: formData.description || null,
      category_id: formData.category_id || null,
      image_path: formData.image_path || null,
      default_line_id: formData.default_line_id || null,
      pricing_type: formData.pricing_type,
      unit: formData.unit,
      base_price: formData.base_price.toString(),
      cost_price: formData.cost_price != null ? formData.cost_price.toString() : null,
      requires_dimensions: formData.requires_dimensions,
      min_width: showDimensions ? formData.min_width : null,
      min_height: showDimensions ? formData.min_height : null,
      max_width: showDimensions ? formData.max_width : null,
      max_height: showDimensions ? formData.max_height : null,
      default_weight: formData.default_weight != null ? formData.default_weight.toString() : null,
      default_profile_color_id: formData.default_profile_color_id || null,
      default_accessory_color_id: formData.default_accessory_color_id || null,
      default_glass_type_id: formData.default_glass_type_id || null,
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

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.code && product.code.toLowerCase().includes(searchLower)) ||
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Produtos e Modelos</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Gerencie a tabela de esquadrias e serviços disponíveis para orçar.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Novo Produto
        </button>
      </div>

      <Toast message={successMsg} variant={variant} />

      <div className="rounded-2xl border border-border/80 bg-card/30 overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, código, descrição ou linha..."
          />
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground text-center p-6">
              <p className="text-lg font-bold text-foreground">Nenhum produto cadastrado</p>
              <p className="text-sm text-muted-foreground/80 mt-1">Clique em "Novo Produto" para começar.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-foreground/80">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-xs tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Linha Padrão</th>
                  <th className="px-6 py-4">Precificação</th>
                  <th className="px-6 py-4">Preço Base</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/25 transition-colors">
                    <td className="px-6 py-4">
                      {product.code ? (
                        <span className="rounded-lg bg-muted border border-input px-2 py-0.5 text-xs font-mono font-bold text-foreground">
                          {product.code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-foreground">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {product.category ? (
                        <span className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-violet-350">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      {product.default_line ? (
                        <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-blue-450">
                          {product.default_line.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <span>{PRICING_TYPES[product.pricing_type]}</span>
                      <span className="text-muted-foreground/50 ml-1">({UNIT_LABELS[product.unit] || product.unit})</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                      {formatPrice(product.base_price)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                          product.active 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                            : 'bg-muted/40 text-muted-foreground/80 border-border/30'
                        }`}
                      >
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-red-400 transition-colors cursor-pointer"
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        description="Cadastre as especificações, preços e dimensões padrão da esquadria."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Produto *</label>
              <input
                type="text"
                {...register('name')}
                className={inputStyle}
                placeholder="Ex: Portão Basculante, Janela de Correr 2 Fg"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Código / SKU</label>
              <input
                type="text"
                {...register('code')}
                className={inputStyle}
                placeholder="Ex: PT-001, JC-2F-BCO"
              />
              {errors.code && <p className="mt-1 text-xs text-red-400">{errors.code.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</label>
              <select
                {...register('category_id')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-card">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Linha de Alumínio Padrão</label>
              <select
                {...register('default_line_id')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="">Sem linha associada</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id} className="bg-card">
                    {line.name} {!line.active && '(Inativa)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Precificação *</label>
              <select
                {...register('pricing_type')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="fixed" className="bg-card">Preço Fixo</option>
                <option value="per_m2" className="bg-card">Por Metro Quadrado (m²)</option>
                <option value="per_meter" className="bg-card">Por Metro Linear (m)</option>
                <option value="per_kg" className="bg-card">Por Peso (kg)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Unidade *</label>
              <select
                {...register('unit')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="piece" className="bg-card">Peça</option>
                <option value="m2" className="bg-card">Metro Quadrado (m²)</option>
                <option value="linear_meter" className="bg-card">Metro Linear (m)</option>
                <option value="kg" className="bg-card">Quilograma (kg)</option>
                <option value="pair" className="bg-card">Par</option>
                <option value="set" className="bg-card">Jogo</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Preço Base (R$) *</label>
              <input
                type="number"
                step="0.0001"
                {...register('base_price', { valueAsNumber: true })}
                className={inputStyle}
                placeholder="0.0000"
              />
              {errors.base_price && <p className="mt-1 text-xs text-red-400">{errors.base_price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Preço de Custo (R$)</label>
              <input
                type="number"
                step="0.0001"
                {...register('cost_price', { valueAsNumber: true })}
                className={inputStyle}
                placeholder="Opcional"
              />
              {errors.cost_price && <p className="mt-1 text-xs text-red-400">{errors.cost_price.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Peso Padrão (kg)</label>
              <input
                type="number"
                step="0.001"
                {...register('default_weight', { valueAsNumber: true })}
                className={inputStyle}
                placeholder="Ex: 25.5"
              />
              {errors.default_weight && <p className="mt-1 text-xs text-red-400">{errors.default_weight.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição Comercial</label>
            <textarea
              rows={2}
              {...register('description')}
              className={inputStyle}
              placeholder="Ex: Modelo padrão, inclui trincos e guarnições..."
            />
          </div>

          {/* Cores e Vidro Padrão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor Perfil Padrão</label>
              <select
                {...register('default_profile_color_id')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="">Nenhuma</option>
                {profileColors.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor Acessório Padrão</label>
              <select
                {...register('default_accessory_color_id')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="">Nenhuma</option>
                {accessoryColors.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Vidro Padrão</label>
              <select
                {...register('default_glass_type_id')}
                className={`${inputStyle} cursor-pointer`}
              >
                <option value="">Nenhum</option>
                {glassTypes.map((g) => (
                  <option key={g.id} value={g.id} className="bg-card">{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-b border-border py-4 my-2 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="req-dimensions"
                {...register('requires_dimensions')}
                className="rounded border-border bg-card text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
              />
              <label htmlFor="req-dimensions" className="text-xs font-bold uppercase tracking-wider text-foreground/80 cursor-pointer">
                Exige dimensões personalizadas no orçamento (Largura/Altura)
              </label>
            </div>

            {showDimensions && (
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border/80 animate-fade-in">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Largura Mínima (mm)</label>
                  <input
                    type="number"
                    {...register('min_width', { valueAsNumber: true })}
                    className={`${inputStyle} py-1.5 px-3`}
                    placeholder="Ex: 500"
                  />
                  {errors.min_width && <p className="mt-1 text-xs text-red-400">{errors.min_width.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Altura Mínima (mm)</label>
                  <input
                    type="number"
                    {...register('min_height', { valueAsNumber: true })}
                    className={`${inputStyle} py-1.5 px-3`}
                    placeholder="Ex: 600"
                  />
                  {errors.min_height && <p className="mt-1 text-xs text-red-400">{errors.min_height.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Largura Máxima (mm)</label>
                  <input
                    type="number"
                    {...register('max_width', { valueAsNumber: true })}
                    className={`${inputStyle} py-1.5 px-3`}
                    placeholder="Ex: 3000"
                  />
                  {errors.max_width && <p className="mt-1 text-xs text-red-400">{errors.max_width.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Altura Máxima (mm)</label>
                  <input
                    type="number"
                    {...register('max_height', { valueAsNumber: true })}
                    className={`${inputStyle} py-1.5 px-3`}
                    placeholder="Ex: 2500"
                  />
                  {errors.max_height && <p className="mt-1 text-xs text-red-400">{errors.max_height.message}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="prod-active"
              {...register('active')}
              className="rounded border-border bg-card text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
            />
            <label htmlFor="prod-active" className="text-xs font-bold uppercase tracking-wider text-foreground/80 cursor-pointer">
              Produto ativo para novos orçamentos
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-border bg-card/50 hover:bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:text-foreground transition-all cursor-pointer"
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
