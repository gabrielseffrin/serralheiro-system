import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productsApi } from '@/services/products';
import {
  productLineSchema,
  productColorSchema,
  glassTypeSchema,
  type ProductLineFormData,
  type ProductColorFormData,
  type GlassTypeFormData,
} from '../schemas/catalog';
import type { ProductLine, ProductColor, GlassType } from '@/types';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  X
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

type TabType = 'lines' | 'colors' | 'glass';

export default function CatalogsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('lines');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductLine | null>(null);

  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ProductColor | null>(null);

  const [glassModalOpen, setGlassModalOpen] = useState(false);
  const [editingGlass, setEditingGlass] = useState<GlassType | null>(null);

  // Deletion confirm state
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: 'line' | 'color' | 'glass' } | null>(null);

  // Queries
  const { data: linesData, isLoading: loadingLines } = useQuery({
    queryKey: ['product-lines'],
    queryFn: () => productsApi.listLines(),
    enabled: activeTab === 'lines',
  });

  const { data: colorsData, isLoading: loadingColors } = useQuery({
    queryKey: ['product-colors'],
    queryFn: () => productsApi.listColors(),
    enabled: activeTab === 'colors',
  });

  const { data: glassData, isLoading: loadingGlass } = useQuery({
    queryKey: ['glass-types'],
    queryFn: () => productsApi.listGlassTypes(),
    enabled: activeTab === 'glass',
  });

  const lines = linesData?.data || [];
  const colors = colorsData?.data || [];
  const glassTypes = glassData?.data || [];

  // Toast utility
  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Forms
  const lineForm = useForm<ProductLineFormData>({
    resolver: zodResolver(productLineSchema),
    defaultValues: {
      name: '',
      active: true,
    },
  });

  const colorForm = useForm<ProductColorFormData>({
    resolver: zodResolver(productColorSchema),
  });

  const glassForm = useForm<GlassTypeFormData>({
    resolver: zodResolver(glassTypeSchema),
  });

  // MUTATIONS - Lines
  const createLineMutation = useMutation({
    mutationFn: (payload: ProductLineFormData) => productsApi.createLine(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines'] });
      showToast('Linha cadastrada com sucesso!');
      setLineModalOpen(false);
    },
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductLineFormData }) =>
      productsApi.updateLine(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines'] });
      showToast('Linha atualizada com sucesso!');
      setLineModalOpen(false);
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines'] });
      showToast('Linha removida com sucesso!');
      setDeletingItem(null);
    },
  });

  // MUTATIONS - Colors
  const createColorMutation = useMutation({
    mutationFn: (payload: ProductColorFormData) => productsApi.createColor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-colors'] });
      showToast('Cor cadastrada com sucesso!');
      setColorModalOpen(false);
    },
  });

  const updateColorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductColorFormData }) =>
      productsApi.updateColor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-colors'] });
      showToast('Cor atualizada com sucesso!');
      setColorModalOpen(false);
    },
  });

  const deleteColorMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteColor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-colors'] });
      showToast('Cor removida com sucesso!');
      setDeletingItem(null);
    },
  });

  // MUTATIONS - Glass
  const createGlassMutation = useMutation({
    mutationFn: (payload: GlassTypeFormData) => productsApi.createGlassType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glass-types'] });
      showToast('Tipo de vidro cadastrado com sucesso!');
      setGlassModalOpen(false);
    },
  });

  const updateGlassMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GlassTypeFormData }) =>
      productsApi.updateGlassType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glass-types'] });
      showToast('Tipo de vidro atualizado com sucesso!');
      setGlassModalOpen(false);
    },
  });

  const deleteGlassMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteGlassType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glass-types'] });
      showToast('Tipo de vidro removido com sucesso!');
      setDeletingItem(null);
    },
  });

  // Action handlers
  const onLineSubmit: SubmitHandler<ProductLineFormData> = async (data) => {
    if (editingLine) {
      await updateLineMutation.mutateAsync({ id: editingLine.id, payload: data });
    } else {
      await createLineMutation.mutateAsync(data);
    }
  };

  const onColorSubmit: SubmitHandler<ProductColorFormData> = async (data) => {
    const payload = { ...data, hex: data.hex || null };
    if (editingColor) {
      await updateColorMutation.mutateAsync({ id: editingColor.id, payload });
    } else {
      await createColorMutation.mutateAsync(payload);
    }
  };

  const onGlassSubmit: SubmitHandler<GlassTypeFormData> = async (data) => {
    if (editingGlass) {
      await updateGlassMutation.mutateAsync({ id: editingGlass.id, payload: data });
    } else {
      await createGlassMutation.mutateAsync(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      if (deletingItem.type === 'line') {
        await deleteLineMutation.mutateAsync(deletingItem.id);
      } else if (deletingItem.type === 'color') {
        await deleteColorMutation.mutateAsync(deletingItem.id);
      } else if (deletingItem.type === 'glass') {
        await deleteGlassMutation.mutateAsync(deletingItem.id);
      }
    }
  };

  const inputStyle = "w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Catálogos Auxiliares</h2>
          <p className="mt-1.5 text-sm text-slate-450">Configure as linhas, cores de alumínio e tipos de vidro disponíveis.</p>
        </div>
        <div>
          {activeTab === 'lines' && (
            <button
              onClick={() => {
                setEditingLine(null);
                lineForm.reset({ name: '', active: true });
                setLineModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" /> Nova Linha
            </button>
          )}
          {activeTab === 'colors' && (
            <button
              onClick={() => {
                setEditingColor(null);
                colorForm.reset({ name: '', hex: '', type: 'profile' });
                setColorModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" /> Nova Cor
            </button>
          )}
          {activeTab === 'glass' && (
            <button
              onClick={() => {
                setEditingGlass(null);
                glassForm.reset({ name: '', description: '' });
                setGlassModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" /> Novo Vidro
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-xl border border-green-800 bg-green-950/20 p-4 text-sm text-green-400 transition-all flex items-center gap-2.5 shadow-lg animate-scale-up">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60">
        <button
          onClick={() => setActiveTab('lines')}
          className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'lines'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Linhas de Produto
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'colors'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Cores (Alumínio / Acessórios)
        </button>
        <button
          onClick={() => setActiveTab('glass')}
          className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'glass'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tipos de Vidro
        </button>
      </div>

      {/* Content Area */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
        {activeTab === 'lines' && (
          <div className="overflow-x-auto">
            {loadingLines ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-455">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                Carregando linhas...
              </div>
            ) : lines.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400 text-center p-6">
                <p className="text-lg font-bold text-white">Nenhuma linha de produto cadastrada</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-350">
                <thead className="bg-slate-950/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {lines.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-800/25 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{line.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            line.active 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                              : 'bg-slate-800/40 text-slate-500 border-slate-750/30'
                          }`}
                        >
                          {line.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingLine(line);
                              lineForm.reset({ name: line.name, active: line.active });
                              setLineModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ id: line.id, name: line.name, type: 'line' })}
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
        )}

        {activeTab === 'colors' && (
          <div className="overflow-x-auto">
            {loadingColors ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-455">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                Carregando cores...
              </div>
            ) : colors.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400 text-center p-6">
                <p className="text-lg font-bold text-white">Nenhuma cor cadastrada</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-350">
                <thead className="bg-slate-950/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Amostra</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {colors.map((color) => (
                    <tr key={color.id} className="hover:bg-slate-800/25 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{color.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {color.hex ? (
                            <>
                              <span
                                className="h-5 w-5 rounded-full border border-slate-750 shadow-sm"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-xs font-mono text-slate-450 uppercase">{color.hex}</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            color.type === 'profile'
                              ? 'border-blue-900/50 bg-blue-950/40 text-blue-400'
                              : 'border-purple-900/50 bg-purple-950/40 text-purple-400'
                          }`}
                        >
                          {color.type === 'profile' ? 'Perfil' : 'Acessório'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingColor(color);
                              colorForm.reset({ name: color.name, hex: color.hex || '', type: color.type });
                              setColorModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ id: color.id, name: color.name, type: 'color' })}
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
        )}

        {activeTab === 'glass' && (
          <div className="overflow-x-auto">
            {loadingGlass ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-455">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                Carregando vidros...
              </div>
            ) : glassTypes.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400 text-center p-6">
                <p className="text-lg font-bold text-white">Nenhum tipo de vidro cadastrado</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-350">
                <thead className="bg-slate-950/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {glassTypes.map((glass) => (
                    <tr key={glass.id} className="hover:bg-slate-800/25 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{glass.name}</td>
                      <td className="px-6 py-4 max-w-md truncate text-slate-450">{glass.description || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingGlass(glass);
                              glassForm.reset({ name: glass.name, description: glass.description || '' });
                              setGlassModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ id: glass.id, name: glass.name, type: 'glass' })}
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
        )}
      </div>

      {/* LINE MODAL */}
      {lineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl relative text-slate-105 animate-scale-up">
            <button
              onClick={() => setLineModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingLine ? 'Editar Linha de Produto' : 'Nova Linha de Produto'}
            </h3>
            <form onSubmit={lineForm.handleSubmit(onLineSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Nome da Linha *</label>
                <input
                  type="text"
                  {...lineForm.register('name')}
                  className={inputStyle}
                  placeholder="Ex: Suprema, Gold, Versatik"
                />
                {lineForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{lineForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="line-active"
                  {...lineForm.register('active')}
                  className="rounded border-slate-850 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
                />
                <label htmlFor="line-active" className="text-xs font-bold uppercase tracking-wider text-slate-350 cursor-pointer">
                  Linha ativa para novos orçamentos e produtos
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setLineModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={lineForm.formState.isSubmitting}
                  className="rounded-xl bg-blue-650 hover:bg-blue-550 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-950/20 disabled:opacity-50"
                >
                  {lineForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLOR MODAL */}
      {colorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl relative text-slate-100 animate-scale-up">
            <button
              onClick={() => setColorModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingColor ? 'Editar Cor' : 'Nova Cor'}
            </h3>
            <form onSubmit={colorForm.handleSubmit(onColorSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Nome da Cor *</label>
                <input
                  type="text"
                  {...colorForm.register('name')}
                  className={inputStyle}
                  placeholder="Ex: Branco Brilhante, Preto Fosco, Bronze 1003"
                />
                {colorForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Código Hexadecimal (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...colorForm.register('hex')}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="#FFFFFF"
                  />
                  <input
                    type="color"
                    value={colorForm.watch('hex') || '#000000'}
                    onChange={(e) => colorForm.setValue('hex', e.target.value)}
                    className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900 p-1 cursor-pointer"
                  />
                </div>
                {colorForm.formState.errors.hex && (
                  <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.hex.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Tipo de Aplicação *</label>
                <select
                  {...colorForm.register('type')}
                  className={`${inputStyle} cursor-pointer`}
                >
                  <option value="profile" className="bg-slate-900">Perfil de Alumínio</option>
                  <option value="accessory" className="bg-slate-900">Componente / Acessório</option>
                </select>
                {colorForm.formState.errors.type && (
                  <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.type.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setColorModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={colorForm.formState.isSubmitting}
                  className="rounded-xl bg-blue-650 hover:bg-blue-550 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-950/20 disabled:opacity-50"
                >
                  {colorForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLASS MODAL */}
      {glassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl relative text-slate-100 animate-scale-up">
            <button
              onClick={() => setGlassModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingGlass ? 'Editar Tipo de Vidro' : 'Novo Tipo de Vidro'}
            </h3>
            <form onSubmit={glassForm.handleSubmit(onGlassSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Especificação do Vidro *</label>
                <input
                  type="text"
                  {...glassForm.register('name')}
                  className={inputStyle}
                  placeholder="Ex: Incolor 6mm Temperado, Refletivo Bronze 4mm"
                />
                {glassForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{glassForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Descrição / Observações (Opcional)</label>
                <textarea
                  rows={3}
                  {...glassForm.register('description')}
                  className={inputStyle}
                  placeholder="Ex: Utilização geral em boxes e janelas de correr..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setGlassModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={glassForm.formState.isSubmitting}
                  className="rounded-xl bg-blue-650 hover:bg-blue-550 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-950/20 disabled:opacity-50"
                >
                  {glassForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title={`Excluir ${
          deletingItem?.type === 'line' 
            ? 'Linha de Produto' 
            : deletingItem?.type === 'color' 
            ? 'Cor de Alumínio' 
            : 'Tipo de Vidro'
        }`}
        description={`Tem certeza que deseja excluir "${deletingItem?.name}" do catálogo auxiliar? Esta alteração pode afetar produtos ou orçamentos associados a este item.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
        isDangerous={true}
        isLoading={
          deleteLineMutation.isPending || 
          deleteColorMutation.isPending || 
          deleteGlassMutation.isPending
        }
      />
    </div>
  );
}
