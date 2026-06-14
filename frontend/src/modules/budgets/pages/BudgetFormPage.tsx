import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { budgetsApi } from '@/services/budgets';
import { customersApi } from '@/services/customers';
import { productsApi } from '@/services/products';
import { budgetSchema, type BudgetFormData } from '../schemas/budget';

export default function BudgetFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries for catalog data
  const { data: customersData } = useQuery({
    queryKey: ['customers-form-list'],
    queryFn: () => customersApi.list(1), // Fetch page 1 (up to 15 items for simplicity)
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-form-list'],
    queryFn: () => productsApi.listProducts(1),
  });

  const { data: linesData } = useQuery({
    queryKey: ['lines-form-list'],
    queryFn: () => productsApi.listLines(),
  });

  const { data: colorsData } = useQuery({
    queryKey: ['colors-form-list'],
    queryFn: () => productsApi.listColors(),
  });

  const { data: glassData } = useQuery({
    queryKey: ['glass-form-list'],
    queryFn: () => productsApi.listGlassTypes(),
  });

  const customers = customersData?.data || [];
  const products = productsData?.data || [];
  const lines = linesData?.data || [];
  const colors = colorsData?.data || [];
  const glassTypes = glassData?.data || [];

  const profileColors = colors.filter((c) => c.type === 'profile');
  const accessoryColors = colors.filter((c) => c.type === 'accessory');

  // Query for edit budget details
  const { data: budgetData, isLoading: loadingBudget } = useQuery({
    queryKey: ['budget-edit', id],
    queryFn: () => budgetsApi.get(id!),
    enabled: isEditMode,
  });

  const budget = budgetData?.data;

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch: formWatch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      customer_id: '',
      discount: 0,
      expiration_date: '',
      payment_method: '',
      delivery_term: '',
      warranty_term: '',
      notes: '',
      items: [
        {
          product_id: '',
          tag: '',
          location: '',
          quantity: 1,
          width: null,
          height: null,
          line_id: '',
          profile_color_id: '',
          glass_type_id: '',
          accessory_color_id: '',
          unit_price: null,
          notes: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch form fields for real-time total calculations
  const watchedItems = formWatch('items') || [];
  const watchedDiscount = formWatch('discount') || 0;

  // Load editing budget details into form
  useEffect(() => {
    if (isEditMode && budget) {
      reset({
        customer_id: budget.customer_id,
        discount: parseFloat(budget.discount) || 0,
        expiration_date: budget.expiration_date || '',
        payment_method: budget.payment_method || '',
        delivery_term: budget.delivery_term || '',
        warranty_term: budget.warranty_term || '',
        notes: budget.notes || '',
        items: budget.items ? budget.items.map((item) => ({
          product_id: item.product_id || '',
          tag: item.tag || '',
          location: item.location || '',
          quantity: item.quantity,
          width: item.width,
          height: item.height,
          line_id: item.line_id || '',
          profile_color_id: item.profile_color_id || '',
          glass_type_id: item.glass_type_id || '',
          accessory_color_id: item.accessory_color_id || '',
          unit_price: parseFloat(item.unit_price) || null,
          notes: item.notes || '',
        })) : [],
      });
    }
  }, [isEditMode, budget, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => budgetsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/budgets');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Erro ao criar orçamento.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => budgetsApi.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/budgets');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Erro ao salvar alterações.');
    },
  });

  // Real-time calculation helper
  const calculateItemValues = (item: any) => {
    if (!item.product_id) return { unit_price: 0, total: 0, area: 0 };
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return { unit_price: 0, total: 0, area: 0 };

    const qty = parseInt(item.quantity) || 1;
    const w = parseFloat(item.width) || 0;
    const h = parseFloat(item.height) || 0;
    const base = parseFloat(product.base_price) || 0;

    let unit = 0;
    let area = 0;

    if (product.pricing_type === 'per_m2') {
      area = (w * h) / 1000000;
      unit = base * area;
    } else if (product.pricing_type === 'per_meter') {
      const perimeter = (2 * (w + h)) / 1000;
      unit = base * perimeter;
    } else {
      unit = item.unit_price !== null && item.unit_price !== undefined ? parseFloat(item.unit_price) : base;
    }

    unit = Math.round(unit * 100) / 100;
    const total = Math.round(unit * qty * 100) / 100;

    return { unit_price: unit, total, area };
  };

  // Compute subtotal and grand totals dynamically
  const calculatedItems = watchedItems.map((item) => calculateItemValues(item));
  const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
  const grandTotal = Math.max(0, subtotal - watchedDiscount);

  // Auto populate values when product changes
  const handleProductChange = (index: number, productId: string) => {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.line_id`, product.default_line_id || '');
      setValue(`items.${index}.unit_price`, parseFloat(product.base_price));
      setValue(`items.${index}.width`, product.requires_dimensions ? 1000 : null);
      setValue(`items.${index}.height`, product.requires_dimensions ? 1000 : null);
    }
  };

  const onSubmit: SubmitHandler<BudgetFormData> = async (formData) => {
    setErrorMessage(null);

    // Sanitize and structure the items array for submission
    const sanitizedItems = formData.items.map((item, idx) => {
      const calc = calculatedItems[idx];
      
      return {
        product_id: item.product_id,
        tag: item.tag || null,
        location: item.location || null,
        quantity: item.quantity,
        width: item.width || null,
        height: item.height || null,
        line_id: item.line_id || null,
        profile_color_id: item.profile_color_id || null,
        glass_type_id: item.glass_type_id || null,
        accessory_color_id: item.accessory_color_id || null,
        // Send unit_price override if product is fixed pricing, otherwise backend recalculates,
        // but we send the calculated unit price anyway to ensure consistency.
        unit_price: calc.unit_price,
        notes: item.notes || null,
      };
    });

    const payload = {
      customer_id: formData.customer_id,
      discount: formData.discount.toString(),
      expiration_date: formData.expiration_date || null,
      payment_method: formData.payment_method || null,
      delivery_term: formData.delivery_term || null,
      warranty_term: formData.warranty_term || null,
      notes: formData.notes || null,
      items: sanitizedItems,
    };

    if (isEditMode) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isEditMode && loadingBudget) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-400">
        Carregando detalhes do orçamento...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/budgets" className="text-gray-400 hover:text-white transition-colors text-lg">
          ←
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isEditMode ? `Editar Orçamento ${budget?.number_formatted}` : 'Novo Orçamento'}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {isEditMode
              ? `Editando a versão ${budget?.version} do orçamento comercial.`
              : 'Preencha as informações do cliente, adicione produtos e crie a proposta.'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle: Client & Items Card list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Client Selection */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-6">
            <h3 className="text-md font-bold text-white border-b border-gray-800 pb-2">Identificação do Cliente</h3>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">Cliente Comercial *</label>
              <select
                {...register('customer_id')}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Selecione um cliente cadastrado</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.document && `(${c.document})`}
                  </option>
                ))}
              </select>
              {errors.customer_id && <p className="mt-1 text-xs text-red-400">{errors.customer_id.message}</p>}
            </div>
          </div>

          {/* Card 2: Items List Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-bold text-white">Itens do Orçamento</h3>
              <button
                type="button"
                onClick={() =>
                  append({
                    product_id: '',
                    tag: '',
                    location: '',
                    quantity: 1,
                    width: null,
                    height: null,
                    line_id: '',
                    profile_color_id: '',
                    glass_type_id: '',
                    accessory_color_id: '',
                    unit_price: null,
                    notes: '',
                  })
                }
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
              >
                ➕ Adicionar Item
              </button>
            </div>

            {errors.items && <p className="text-xs text-red-400">{errors.items.message}</p>}

            {fields.map((field, index) => {
              const itemWatch = watchedItems[index] || {};
              const selectedProduct = products.find((p) => p.id === itemWatch.product_id);
              const calculations = calculatedItems[index] || { unit_price: 0, total: 0, area: 0 };
              const requiresDims = selectedProduct?.requires_dimensions || selectedProduct?.pricing_type === 'per_m2' || selectedProduct?.pricing_type === 'per_meter';

              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4 relative hover:border-gray-700/60 transition-colors animate-fade-in"
                >
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Remover Item"
                  >
                    🗑️
                  </button>

                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">Item #{index + 1}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Product Selection */}
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Esquadria / Produto *</label>
                      <select
                        {...register(`items.${index}.product_id`)}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Selecione um produto do catálogo</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.pricing_type === 'fixed' ? 'Fixo' : p.pricing_type === 'per_m2' ? 'm²' : 'Metro'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Quantidade *</label>
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Dimensions conditional inputs */}
                  {requiresDims && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-950 p-3 rounded-lg border border-gray-850">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-400">Largura (mm) *</label>
                        <input
                          type="number"
                          {...register(`items.${index}.width`, { valueAsNumber: true })}
                          placeholder="Ex: 1200"
                          className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                        {selectedProduct?.min_width && (
                          <span className="text-[10px] text-gray-500">Mínimo: {selectedProduct.min_width}mm</span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-400">Altura (mm) *</label>
                        <input
                          type="number"
                          {...register(`items.${index}.height`, { valueAsNumber: true })}
                          placeholder="Ex: 1500"
                          className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                        {selectedProduct?.min_height && (
                          <span className="text-[10px] text-gray-500">Mínimo: {selectedProduct.min_height}mm</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tag and Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Sigla / Referência (Tag)</label>
                      <input
                        type="text"
                        {...register(`items.${index}.tag`)}
                        placeholder="Ex: P01, J3"
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Local de Instalação</label>
                      <input
                        type="text"
                        {...register(`items.${index}.location`)}
                        placeholder="Ex: Sala, Sacada, Suíte"
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Advanced Item Catalogs (Line, Colors, Glass) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Linha de Perfil</label>
                      <select
                        {...register(`items.${index}.line_id`)}
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Nenhuma</option>
                        {lines.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Cor do Perfil</label>
                      <select
                        {...register(`items.${index}.profile_color_id`)}
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Nenhuma</option>
                        {profileColors.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Tipo do Vidro</label>
                      <select
                        {...register(`items.${index}.glass_type_id`)}
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Nenhum</option>
                        {glassTypes.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-400">Cor do Acessório</label>
                      <select
                        {...register(`items.${index}.accessory_color_id`)}
                        className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Nenhuma</option>
                        {accessoryColors.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Calculations and Price Overrides */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-gray-850">
                    <div className="flex gap-4 text-[11px] text-gray-400">
                      {calculations.area > 0 && (
                        <p>Área: <strong className="text-white font-mono">{calculations.area.toFixed(4)} m²</strong></p>
                      )}
                      <p>Preço Unitário: <strong className="text-white font-mono">{formatCurrency(calculations.unit_price)}</strong></p>
                    </div>

                    <div className="flex items-center gap-3 justify-end flex-1">
                      {/* Manual Override Input for Fixed/PerKg pricing */}
                      {selectedProduct?.pricing_type === 'fixed' && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-gray-500 whitespace-nowrap">Alterar Preço (R$):</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                            className="rounded border border-gray-700 bg-gray-950 px-2 py-0.5 text-xs text-white w-24 text-right focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-[11px] text-gray-400">Total do Item: </span>
                        <strong className="text-sm font-bold text-white font-mono">{formatCurrency(calculations.total)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Proposal Settings, Discounts and Totals */}
        <div className="space-y-6">
          {/* Card 3: Financial Summary */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-6">
            <h3 className="text-md font-bold text-white border-b border-gray-800 pb-2">Resumo Financeiro</h3>

            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal:</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>

              <div>
                <label className="mb-1 block font-sans text-xs font-semibold text-gray-300">Desconto Comercial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('discount', { valueAsNumber: true })}
                  className="w-full font-mono rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
                {errors.discount && <p className="mt-1 text-xs text-red-400 font-sans">{errors.discount.message}</p>}
              </div>

              <div className="border-t border-gray-800 pt-4 flex justify-between text-base font-bold">
                <span className="font-sans text-gray-300">Total Geral:</span>
                <span className="text-green-400 font-black text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Commercial Conditions */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
            <h3 className="text-md font-bold text-white border-b border-gray-800 pb-2">Condições Comerciais</h3>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Validade da Proposta</label>
              <input
                type="date"
                {...register('expiration_date')}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Forma de Pagamento</label>
              <input
                type="text"
                {...register('payment_method')}
                placeholder="Ex: 50% entrada, 50% entrega"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Prazo de Entrega</label>
              <input
                type="text"
                {...register('delivery_term')}
                placeholder="Ex: 25 dias úteis"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Termo de Garantia</label>
              <input
                type="text"
                {...register('warranty_term')}
                placeholder="Ex: 1 ano contra defeitos"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Observações de Proposta</label>
              <textarea
                rows={3}
                {...register('notes')}
                placeholder="Observações que constarão no final do documento PDF..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Link
              to="/budgets"
              className="flex-1 rounded-lg bg-gray-800 hover:bg-gray-750 px-4 py-2.5 text-sm font-semibold text-white transition-colors text-center cursor-pointer"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Proposta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
