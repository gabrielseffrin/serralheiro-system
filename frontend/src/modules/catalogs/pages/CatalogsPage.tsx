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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { inputStyle } from '@/lib/utils';

type TabType = 'lines' | 'colors' | 'glass';

export default function CatalogsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('lines');
  const { message: successMsg, variant, showToast } = useToast();

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductLine | null>(null);

  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ProductColor | null>(null);

  const [glassModalOpen, setGlassModalOpen] = useState(false);
  const [editingGlass, setEditingGlass] = useState<GlassType | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: 'line' | 'color' | 'glass' } | null>(null);

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

  const lineForm = useForm<ProductLineFormData>({
    resolver: zodResolver(productLineSchema),
    defaultValues: { name: '', active: true },
  });

  const colorForm = useForm<ProductColorFormData>({
    resolver: zodResolver(productColorSchema),
  });

  const glassForm = useForm<GlassTypeFormData>({
    resolver: zodResolver(glassTypeSchema),
  });

  const createLineMutation = useMutation({
    mutationFn: (payload: ProductLineFormData) => productsApi.createLine(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines'] });
      showToast('Linha cadastrada com sucesso!');
      setLineModalOpen(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao criar linha.');
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
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao atualizar linha.');
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines'] });
      showToast('Linha removida com sucesso!');
      setDeletingItem(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao remover linha.');
    },
  });

  const createColorMutation = useMutation({
    mutationFn: (payload: ProductColorFormData) => productsApi.createColor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-colors'] });
      showToast('Cor cadastrada com sucesso!');
      setColorModalOpen(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao criar cor.');
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
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao atualizar cor.');
    },
  });

  const deleteColorMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteColor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-colors'] });
      showToast('Cor removida com sucesso!');
      setDeletingItem(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao remover cor.');
    },
  });

  const createGlassMutation = useMutation({
    mutationFn: (payload: GlassTypeFormData) => productsApi.createGlassType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glass-types'] });
      showToast('Tipo de vidro cadastrado com sucesso!');
      setGlassModalOpen(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao criar vidro.');
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
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao atualizar vidro.');
    },
  });

  const deleteGlassMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteGlassType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glass-types'] });
      showToast('Tipo de vidro removido com sucesso!');
      setDeletingItem(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Erro ao remover vidro.');
    },
  });

  const onLineSubmit: SubmitHandler<ProductLineFormData> = async (data) => {
    setErrorMsg(null);
    if (editingLine) {
      await updateLineMutation.mutateAsync({ id: editingLine.id, payload: data });
    } else {
      await createLineMutation.mutateAsync(data);
    }
  };

  const onColorSubmit: SubmitHandler<ProductColorFormData> = async (data) => {
    setErrorMsg(null);
    const payload = { ...data, hex: data.hex || null };
    if (editingColor) {
      await updateColorMutation.mutateAsync({ id: editingColor.id, payload });
    } else {
      await createColorMutation.mutateAsync(payload);
    }
  };

  const onGlassSubmit: SubmitHandler<GlassTypeFormData> = async (data) => {
    setErrorMsg(null);
    if (editingGlass) {
      await updateGlassMutation.mutateAsync({ id: editingGlass.id, payload: data });
    } else {
      await createGlassMutation.mutateAsync(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      if (deletingItem.type === 'line') await deleteLineMutation.mutateAsync(deletingItem.id);
      else if (deletingItem.type === 'color') await deleteColorMutation.mutateAsync(deletingItem.id);
      else if (deletingItem.type === 'glass') await deleteGlassMutation.mutateAsync(deletingItem.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Catálogos Auxiliares</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Configure as linhas, cores de alumínio e tipos de vidro disponíveis.</p>
        </div>
        <div>
          {activeTab === 'lines' && (
            <button
              onClick={() => {
                setEditingLine(null);
                lineForm.reset({ name: '', active: true });
                setLineModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Nova Linha
            </button>
          )}
          {activeTab === 'colors' && (
            <button
              onClick={() => {
                setEditingColor(null);
                colorForm.reset({ name: '', hex: '', type: 'profile' });
                setColorModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Nova Cor
            </button>
          )}
          {activeTab === 'glass' && (
            <button
              onClick={() => {
                setEditingGlass(null);
                glassForm.reset({ name: '', description: '' });
                setGlassModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Novo Vidro
            </button>
          )}
        </div>
      </div>

      <Toast message={successMsg} variant={variant} />
      {errorMsg && <Toast message={errorMsg} variant="error" />}

      <div className="flex border-b border-border/60">
        {(['lines', 'colors', 'glass'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground/80'
            }`}
          >
            {tab === 'lines' ? 'Linhas de Produto' : tab === 'colors' ? 'Cores (Alumínio / Acessórios)' : 'Tipos de Vidro'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/30 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'lines' && (
            loadingLines ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" /> Carregando linhas...
              </div>
            ) : lines.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground text-center p-6">
                <p className="text-lg font-bold text-foreground">Nenhuma linha de produto cadastrada</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-xs tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {lines.map((line) => (
                    <CatalogsRow
                      key={line.id}
                      name={line.name}
                      active={line.active}
                      actions={
                        <>
                          <ActionButton icon={Pencil} label="Editar" onClick={() => {
                            setEditingLine(line);
                            lineForm.reset({ name: line.name, active: line.active });
                            setLineModalOpen(true);
                          }} />
                          <ActionButton icon={Trash2} label="Excluir" variant="danger" onClick={() =>
                            setDeletingItem({ id: line.id, name: line.name, type: 'line' })
                          } />
                        </>
                      }
                    />
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'colors' && (
            loadingColors ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" /> Carregando cores...
              </div>
            ) : colors.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground text-center p-6">
                <p className="text-lg font-bold text-foreground">Nenhuma cor cadastrada</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-xs tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Amostra</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {colors.map((color) => (
                    <tr key={color.id} className="hover:bg-muted/25 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{color.name}</td>
                      <td className="px-6 py-4">
                        {color.hex ? (
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full border border-input shadow-sm" style={{ backgroundColor: color.hex }} />
                            <span className="text-xs font-mono text-muted-foreground uppercase">{color.hex}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground/50">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                          color.type === 'profile' ? 'border-blue-900/50 bg-blue-950/40 text-blue-400' : 'border-purple-900/50 bg-purple-950/40 text-purple-400'
                        }`}>
                          {color.type === 'profile' ? 'Perfil' : 'Acessório'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <ActionButton icon={Pencil} label="Editar" onClick={() => {
                            setEditingColor(color);
                            colorForm.reset({ name: color.name, hex: color.hex || '', type: color.type });
                            setColorModalOpen(true);
                          }} />
                          <ActionButton icon={Trash2} label="Excluir" variant="danger" onClick={() =>
                            setDeletingItem({ id: color.id, name: color.name, type: 'color' })
                          } />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'glass' && (
            loadingGlass ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" /> Carregando vidros...
              </div>
            ) : glassTypes.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground text-center p-6">
                <p className="text-lg font-bold text-foreground">Nenhum tipo de vidro cadastrado</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-xs tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {glassTypes.map((glass) => (
                    <tr key={glass.id} className="hover:bg-muted/25 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{glass.name}</td>
                      <td className="px-6 py-4 max-w-md truncate text-muted-foreground">{glass.description || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <ActionButton icon={Pencil} label="Editar" onClick={() => {
                            setEditingGlass(glass);
                            glassForm.reset({ name: glass.name, description: glass.description || '' });
                            setGlassModalOpen(true);
                          }} />
                          <ActionButton icon={Trash2} label="Excluir" variant="danger" onClick={() =>
                            setDeletingItem({ id: glass.id, name: glass.name, type: 'glass' })
                          } />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      <Modal
        isOpen={lineModalOpen}
        onClose={() => setLineModalOpen(false)}
        title={editingLine ? 'Editar Linha de Produto' : 'Nova Linha de Produto'}
        maxWidth="max-w-md"
      >
        <form onSubmit={lineForm.handleSubmit(onLineSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da Linha *</label>
            <input type="text" {...lineForm.register('name')} className={inputStyle} placeholder="Ex: Suprema, Gold, Versatik" />
            {lineForm.formState.errors.name && <p className="mt-1 text-xs text-red-400">{lineForm.formState.errors.name.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="line-active" {...lineForm.register('active')} className="rounded border-border bg-card text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer" />
            <label htmlFor="line-active" className="text-xs font-bold uppercase tracking-wider text-foreground cursor-pointer">Linha ativa para novos orçamentos e produtos</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setLineModalOpen(false)} className="rounded-xl border border-border bg-card/50 hover:bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:text-foreground transition-all cursor-pointer">Cancelar</button>
            <button type="submit" disabled={lineForm.formState.isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-950/20 disabled:opacity-50">{lineForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        title={editingColor ? 'Editar Cor' : 'Nova Cor'}
        maxWidth="max-w-md"
      >
        <form onSubmit={colorForm.handleSubmit(onColorSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da Cor *</label>
            <input type="text" {...colorForm.register('name')} className={inputStyle} placeholder="Ex: Branco Brilhante, Preto Fosco, Bronze 1003" />
            {colorForm.formState.errors.name && <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Código Hexadecimal (Opcional)</label>
            <div className="flex gap-2">
              <input type="text" {...colorForm.register('hex')} className={`${inputStyle} font-mono`} placeholder="#FFFFFF" />
              <input type="color" value={colorForm.watch('hex') || '#000000'} onChange={(e) => colorForm.setValue('hex', e.target.value)} className="h-10 w-10 rounded-xl border border-border bg-card p-1 cursor-pointer" />
            </div>
            {colorForm.formState.errors.hex && <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.hex.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Aplicação *</label>
            <select {...colorForm.register('type')} className={`${inputStyle} cursor-pointer`}>
              <option value="profile" className="bg-card">Perfil de Alumínio</option>
              <option value="accessory" className="bg-card">Componente / Acessório</option>
            </select>
            {colorForm.formState.errors.type && <p className="mt-1 text-xs text-red-400">{colorForm.formState.errors.type.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setColorModalOpen(false)} className="rounded-xl border border-border bg-card/50 hover:bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:text-foreground transition-all cursor-pointer">Cancelar</button>
            <button type="submit" disabled={colorForm.formState.isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-950/20 disabled:opacity-50">{colorForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={glassModalOpen}
        onClose={() => setGlassModalOpen(false)}
        title={editingGlass ? 'Editar Tipo de Vidro' : 'Novo Tipo de Vidro'}
        maxWidth="max-w-md"
      >
        <form onSubmit={glassForm.handleSubmit(onGlassSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Especificação do Vidro *</label>
            <input type="text" {...glassForm.register('name')} className={inputStyle} placeholder="Ex: Incolor 6mm Temperado, Refletivo Bronze 4mm" />
            {glassForm.formState.errors.name && <p className="mt-1 text-xs text-red-400">{glassForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição / Observações (Opcional)</label>
            <textarea rows={3} {...glassForm.register('description')} className={inputStyle} placeholder="Ex: Utilização geral em boxes e janelas de correr..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setGlassModalOpen(false)} className="rounded-xl border border-border bg-card/50 hover:bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:text-foreground transition-all cursor-pointer">Cancelar</button>
            <button type="submit" disabled={glassForm.formState.isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-950/20 disabled:opacity-50">{glassForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        title={`Excluir ${deletingItem?.type === 'line' ? 'Linha de Produto' : deletingItem?.type === 'color' ? 'Cor de Alumínio' : 'Tipo de Vidro'}`}
        description={`Tem certeza que deseja excluir "${deletingItem?.name}" do catálogo auxiliar? Esta alteração pode afetar produtos ou orçamentos associados a este item.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
        isDangerous={true}
        isLoading={deleteLineMutation.isPending || deleteColorMutation.isPending || deleteGlassMutation.isPending}
      />
    </div>
  );
}

function CatalogsRow({ name, active, actions }: { name: string; active: boolean; actions: React.ReactNode }) {
  return (
    <tr className="hover:bg-muted/25 transition-colors">
      <td className="px-6 py-4 font-bold text-foreground">{name}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
          active ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-muted/40 text-muted-foreground/80 border-border/30'
        }`}>
          {active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1.5">{actions}</div>
      </td>
    </tr>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default' }: { icon: typeof Pencil; label: string; onClick: () => void; variant?: 'default' | 'danger' }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors cursor-pointer ${
        variant === 'danger'
          ? 'text-muted-foreground hover:bg-muted hover:text-red-400'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
