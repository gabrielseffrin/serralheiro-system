import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { budgetsApi } from '@/services/budgets';
import { customersApi } from '@/services/customers';
import { productsApi } from '@/services/products';
import { budgetSchema, type BudgetFormData } from '../schemas/budget';
import { 
  User, 
  Ruler, 
  CreditCard, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  FileCheck2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

type TabType = 'general' | 'items' | 'terms';

export default function BudgetFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Queries for catalog data
  const { data: customersData } = useQuery({
    queryKey: ['customers-form-list'],
    queryFn: () => customersApi.list(1),
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

  const isReadOnly = isEditMode && budget && budget.status !== 'draft';

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviado',
    viewed: 'Visualizado',
    negotiating: 'Em Negociação',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    expired: 'Expirado',
  };

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
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
        Carregando detalhes do orçamento...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/budgets" className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-2.5xl font-black text-white tracking-tight">
            {isEditMode ? `Editar Orçamento ${budget?.number_formatted}` : 'Novo Orçamento'}
          </h2>
          <p className="text-sm text-slate-450">
            {isEditMode
              ? `Editando a versão ${budget?.version} do orçamento comercial.`
              : 'Preencha as informações do cliente, monte o catálogo de esquadrias e crie a proposta.'}
          </p>
        </div>
      </div>

      {isReadOnly && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/20 p-4 text-sm text-amber-400 flex items-start gap-3 shadow-md animate-scale-up">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <strong className="font-bold block text-white mb-0.5">Orçamento Não Editável</strong>
            Este orçamento está com status <span className="font-semibold uppercase text-amber-300">"{STATUS_LABELS[budget?.status || ''] || budget?.status}"</span> e não pode ser modificado. Para fazer alterações, retorne à lista de orçamentos e crie uma <strong>"Nova Versão"</strong> para obter um rascunho atualizado.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-800 bg-red-950/20 p-4 text-sm text-red-400 animate-scale-up">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Tabs bar */}
      <div className="border-b border-slate-800/80 flex gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" /> 1. Cliente & Validade
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'items'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ruler className="h-4 w-4" /> 2. Esquadrias (Itens)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="h-4 w-4" /> 3. Prazos & Condições
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Step View Form Panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: IDENTIFICATION */}
          {activeTab === 'general' && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-6 space-y-6 animate-fade-in">
              <h3 className="text-md font-bold text-white border-b border-slate-800/60 pb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" /> Identificação do Cliente
              </h3>
              
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Cliente Comercial *</label>
                <select
                  {...register('customer_id')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Selecione um cliente cadastrado</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.document && `(${c.document})`}
                    </option>
                  ))}
                </select>
                {errors.customer_id && <p className="mt-1.5 text-xs text-red-400">{errors.customer_id.message}</p>}
              </div>

              <div className="pt-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Validade da Proposta</label>
                <input
                  type="date"
                  {...register('expiration_date')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  Ir para Itens <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ITEMS LIST EDITOR */}
          {activeTab === 'items' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-blue-500" /> Itens Inclusos
                  </h3>
                  <p className="text-xs text-slate-500">Configure dimensões e acabamentos das peças</p>
                </div>
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
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-500 flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-blue-500/10"
                >
                  <Plus className="h-4 w-4" /> Adicionar Item
                </button>
              </div>

              {errors.items && <p className="text-xs text-red-400">{errors.items.message}</p>}

              {fields.map((field, index) => {
                const itemWatch = watchedItems[index] || {};
                const selectedProduct = products.find((p) => p.id === itemWatch.product_id);
                const calculations = calculatedItems[index] || { unit_price: 0, total: 0, area: 0 };
                const requiresDims = selectedProduct?.requires_dimensions || selectedProduct?.pricing_type === 'per_m2' || selectedProduct?.pricing_type === 'per_meter';

                // Color Hex previews
                const pColor = profileColors.find(c => c.id === itemWatch.profile_color_id);
                const aColor = accessoryColors.find(c => c.id === itemWatch.accessory_color_id);

                return (
                  <div
                    key={field.id}
                    className="rounded-2xl border border-slate-850 bg-slate-900/30 p-5 space-y-4 relative hover:border-slate-800 transition-colors animate-scale-up"
                  >
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Remover Item"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>

                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Item #{index + 1}</span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Product Selection */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-slate-400">Esquadria / Modelo *</label>
                        <select
                          {...register(`items.${index}.product_id`)}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Selecione um produto do catálogo</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.pricing_type === 'fixed' ? 'Preço Fixo' : p.pricing_type === 'per_m2' ? 'Por m²' : 'Por Metro Lineal'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-400">Quantidade *</label>
                        <input
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Dimensions conditional inputs */}
                    {requiresDims && (
                      <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-400">Largura (mm) *</label>
                          <input
                            type="number"
                            {...register(`items.${index}.width`, { valueAsNumber: true })}
                            placeholder="Ex: 1200"
                            className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                          />
                          {selectedProduct?.min_width && (
                            <span className="text-[10px] text-slate-550 block mt-1">Largura Mínima: {selectedProduct.min_width}mm</span>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-400">Altura (mm) *</label>
                          <input
                            type="number"
                            {...register(`items.${index}.height`, { valueAsNumber: true })}
                            placeholder="Ex: 1500"
                            className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                          />
                          {selectedProduct?.min_height && (
                            <span className="text-[10px] text-slate-550 block mt-1">Altura Mínima: {selectedProduct.min_height}mm</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tag and Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-400">Sigla / Tag</label>
                        <input
                          type="text"
                          {...register(`items.${index}.tag`)}
                          placeholder="Ex: P01, J03"
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-400">Ambiente de Instalação</label>
                        <input
                          type="text"
                          {...register(`items.${index}.location`)}
                          placeholder="Ex: Suíte, Sala de Estar"
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Advanced Item Catalogs (Line, Colors, Glass) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/10 p-3.5 rounded-xl border border-slate-850/60">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold text-slate-450">Linha</label>
                        <select
                          {...register(`items.${index}.line_id`)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhuma</option>
                          {lines.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-semibold text-slate-455">Cor Perfil</label>
                          {pColor?.hex && (
                            <span className="h-3 w-3 rounded-full border border-slate-700" style={{ backgroundColor: pColor.hex }} />
                          )}
                        </div>
                        <select
                          {...register(`items.${index}.profile_color_id`)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhuma</option>
                          {profileColors.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold text-slate-450">Vidro</label>
                        <select
                          {...register(`items.${index}.glass_type_id`)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhum</option>
                          {glassTypes.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-semibold text-slate-455">Cor Acessório</label>
                          {aColor?.hex && (
                            <span className="h-3 w-3 rounded-full border border-slate-700" style={{ backgroundColor: aColor.hex }} />
                          )}
                        </div>
                        <select
                          {...register(`items.${index}.accessory_color_id`)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-850 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhuma</option>
                          {accessoryColors.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Calculations and Price Overrides */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-slate-800/80">
                      <div className="flex gap-4 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        {calculations.area > 0 && (
                          <p>Área: <span className="text-white font-mono">{calculations.area.toFixed(4)} m²</span></p>
                        )}
                        <p>Unitário Base: <span className="text-white font-mono">{formatCurrency(calculations.unit_price)}</span></p>
                      </div>

                      <div className="flex items-center gap-3 justify-end flex-1">
                        {selectedProduct?.pricing_type === 'fixed' && (
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-slate-450 uppercase font-bold whitespace-nowrap">Preço de Ajuste (R$):</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white w-24 text-right focus:border-blue-500 focus:outline-none font-mono"
                            />
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Item: </span>
                          <strong className="text-sm font-bold text-white font-mono">{formatCurrency(calculations.total)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  Prazos & Condições <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COMMERCIAL CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-6 space-y-4 animate-fade-in">
              <h3 className="text-md font-bold text-white border-b border-slate-800/60 pb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" /> Condições Comerciais
              </h3>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Forma de Pagamento</label>
                <input
                  type="text"
                  {...register('payment_method')}
                  placeholder="Ex: 50% de entrada, 50% na conclusão da instalação"
                  className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Prazo de Entrega</label>
                <input
                  type="text"
                  {...register('delivery_term')}
                  placeholder="Ex: 30 dias úteis a partir da medição final"
                  className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Termo de Garantia</label>
                <input
                  type="text"
                  {...register('warranty_term')}
                  placeholder="Ex: 1 ano para acessórios, 5 anos para perfis"
                  className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Notas de Proposta (PDF)</label>
                <textarea
                  rows={4}
                  {...register('notes')}
                  placeholder="Observações que constarão no final do documento comercial PDF..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Sticky Pricing Summary & Actions panel */}
        <div className="lg:sticky lg:top-20 space-y-6">
          
          {/* Card 3: Financial Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6 shadow-xl">
            <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" /> Resumo Financeiro
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span className="font-sans font-medium">Subtotal dos Itens:</span>
                <span className="text-white font-bold">{formatCurrency(subtotal)}</span>
              </div>

              <div>
                <label className="mb-1 block font-sans text-xs font-semibold text-slate-400">Desconto Comercial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('discount', { valueAsNumber: true })}
                  className="w-full font-mono rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none text-right"
                  placeholder="0,00"
                />
                {errors.discount && <p className="mt-1 text-xs text-red-400 font-sans">{errors.discount.message}</p>}
              </div>

              <div className="border-t border-slate-850 pt-4 flex justify-between text-sm font-bold">
                <span className="font-sans text-slate-350">Total Líquido:</span>
                <span className="text-emerald-400 font-black text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex gap-4">
            <Link
              to="/budgets"
              className="flex-1 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 px-4 py-3 text-xs font-bold text-slate-300 hover:text-white transition-all text-center cursor-pointer"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isReadOnly}
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
            >
              <FileCheck2 className="h-4 w-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Proposta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
