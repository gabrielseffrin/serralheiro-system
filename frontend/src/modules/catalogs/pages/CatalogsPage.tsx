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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Catálogos Auxiliares</h2>
          <p className="mt-1 text-sm text-gray-400">Configure as linhas, cores de alumínio e tipos de vidro disponíveis.</p>
        </div>
        <div>
          {activeTab === 'lines' && (
            <button
              onClick={() => {
                setEditingLine(null);
                lineForm.reset({ name: '', active: true });
                setLineModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
            >
              ➕ Nova Linha
            </button>
          )}
          {activeTab === 'colors' && (
            <button
              onClick={() => {
                setEditingColor(null);
                colorForm.reset({ name: '', hex: '', type: 'profile' });
                setColorModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
            >
              ➕ Nova Cor
            </button>
          )}
          {activeTab === 'glass' && (
            <button
              onClick={() => {
                setEditingGlass(null);
                glassForm.reset({ name: '', description: '' });
                setGlassModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
            >
              ➕ Novo Vidro
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {successMsg && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 p-4 text-sm text-green-400 transition-all">
          ✓ {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('lines')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'lines'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Linhas de Produto
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'colors'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Cores (Alumínio / Acessórios)
        </button>
        <button
          onClick={() => setActiveTab('glass')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'glass'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Tipos de Vidro
        </button>
      </div>

      {/* Content Area */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        {activeTab === 'lines' && (
          <div className="overflow-x-auto">
            {loadingLines ? (
              <div className="flex h-48 items-center justify-center text-gray-400">Carregando linhas...</div>
            ) : lines.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <p className="text-lg font-medium">Nenhuma linha de produto cadastrada</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-950 text-xs font-semibold uppercase text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {lines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-850 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{line.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            line.active ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {line.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingLine(line);
                              lineForm.reset({ name: line.name, active: line.active });
                              setLineModalOpen(true);
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir a linha ${line.name}?`)) {
                                deleteLineMutation.mutate(line.id);
                              }
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer"
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
        )}

        {activeTab === 'colors' && (
          <div className="overflow-x-auto">
            {loadingColors ? (
              <div className="flex h-48 items-center justify-center text-gray-400">Carregando cores...</div>
            ) : colors.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <p className="text-lg font-medium">Nenhuma cor cadastrada</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-950 text-xs font-semibold uppercase text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Amostra</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {colors.map((color) => (
                    <tr key={color.id} className="hover:bg-gray-850 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{color.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {color.hex ? (
                            <>
                              <span
                                className="h-5 w-5 rounded-full border border-gray-700 shadow-sm"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-xs font-mono text-gray-400 uppercase">{color.hex}</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            color.type === 'profile'
                              ? 'border-blue-900 bg-blue-950 text-blue-400'
                              : 'border-purple-900 bg-purple-950 text-purple-400'
                          }`}
                        >
                          {color.type === 'profile' ? 'Perfil' : 'Acessório'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingColor(color);
                              colorForm.reset({ name: color.name, hex: color.hex || '', type: color.type });
                              setColorModalOpen(true);
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir a cor ${color.name}?`)) {
                                deleteColorMutation.mutate(color.id);
                              }
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer"
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
        )}

        {activeTab === 'glass' && (
          <div className="overflow-x-auto">
            {loadingGlass ? (
              <div className="flex h-48 items-center justify-center text-gray-400">Carregando vidros...</div>
            ) : glassTypes.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <p className="text-lg font-medium">Nenhum tipo de vidro cadastrado</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-950 text-xs font-semibold uppercase text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {glassTypes.map((glass) => (
                    <tr key={glass.id} className="hover:bg-gray-850 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{glass.name}</td>
                      <td className="px-6 py-4 max-w-md truncate text-gray-400">{glass.description || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingGlass(glass);
                              glassForm.reset({ name: glass.name, description: glass.description || '' });
                              setGlassModalOpen(true);
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o vidro ${glass.name}?`)) {
                                deleteGlassMutation.mutate(glass.id);
                              }
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer"
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
        )}
      </div>

      {/* LINE MODAL */}
      {lineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setLineModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingLine ? 'Editar Linha de Produto' : 'Nova Linha de Produto'}
            </h3>
            <form onSubmit={lineForm.handleSubmit(onLineSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Nome da Linha *</label>
                <input
                  type="text"
                  {...lineForm.register('name')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="line-active" className="text-sm text-gray-300 cursor-pointer">
                  Linha ativa para novos orçamentos e produtos
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setLineModalOpen(false)}
                  className="rounded-lg bg-gray-800 hover:bg-gray-750 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={lineForm.formState.isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setColorModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingColor ? 'Editar Cor' : 'Nova Cor'}
            </h3>
            <form onSubmit={colorForm.handleSubmit(onColorSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Nome da Cor *</label>
                <input
                  type="text"
                  {...colorForm.register('name')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Branco Brilhante, Preto Fosco, Bronze 1003"
                />
                {colorForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Código Hexadecimal (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...colorForm.register('hex')}
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="#FFFFFF"
                  />
                  <input
                    type="color"
                    value={colorForm.watch('hex') || '#000000'}
                    onChange={(e) => colorForm.setValue('hex', e.target.value)}
                    className="h-9 w-9 rounded-lg border border-gray-750 bg-gray-800 p-1 cursor-pointer"
                  />
                </div>
                {colorForm.formState.errors.hex && (
                  <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.hex.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Tipo de Aplicação *</label>
                <select
                  {...colorForm.register('type')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="profile">Perfil de Alumínio</option>
                  <option value="accessory">Componente / Acessório</option>
                </select>
                {colorForm.formState.errors.type && (
                  <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.type.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setColorModalOpen(false)}
                  className="rounded-lg bg-gray-800 hover:bg-gray-750 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={colorForm.formState.isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setGlassModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingGlass ? 'Editar Tipo de Vidro' : 'Novo Tipo de Vidro'}
            </h3>
            <form onSubmit={glassForm.handleSubmit(onGlassSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Especificação do Vidro *</label>
                <input
                  type="text"
                  {...glassForm.register('name')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Incolor 6mm Temperado, Refletivo Bronze 4mm"
                />
                {glassForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{glassForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Descrição / Observações (Opcional)</label>
                <textarea
                  rows={3}
                  {...glassForm.register('description')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Utilização geral em boxes e janelas de correr..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setGlassModalOpen(false)}
                  className="rounded-lg bg-gray-800 hover:bg-gray-750 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={glassForm.formState.isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {glassForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
