import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { getModuleBySlug } from '@/config/modules';
import { useModuleMutations, useModuleRecords } from '@/hooks/useModuleRecords';
import type { ModuleRecord } from '@/lib/api';
import { ApiError } from '@/lib/api';
import type { ModuleFormValues } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RecordFormModal } from '@/components/RecordFormModal';
import { RecordsTable } from '@/components/RecordsTable';

export default function ModulePage() {
  const { moduleSlug } = useParams();
  const moduleConfig = getModuleBySlug(moduleSlug);

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ModuleRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ModuleRecord | null>(null);

  const { data, isLoading, isError, refetch } = useModuleRecords(moduleConfig?.resource ?? '');
  const { create, update, remove } = useModuleMutations(moduleConfig?.resource ?? '');

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((record) =>
      moduleConfig?.fields.some((field) => (record[field.key] ?? '').toLowerCase().includes(query))
    );
  }, [data, search, moduleConfig]);

  if (!moduleConfig) {
    return <Navigate to="/404" replace />;
  }

  function handleCreateClick() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function handleEditClick(record: ModuleRecord) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleSubmit(values: ModuleFormValues) {
    try {
      if (editingRecord) {
        await update.mutateAsync({ id: editingRecord.id, data: values });
        toast.success(`${moduleConfig!.singular} atualizado com sucesso.`);
      } else {
        await create.mutateAsync(values);
        toast.success(`${moduleConfig!.singular} adicionado com sucesso.`);
      }
      setFormOpen(false);
      setEditingRecord(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Ocorreu um erro ao salvar. Tente novamente.');
    }
  }

  async function handleConfirmDelete() {
    if (!deletingRecord) return;
    try {
      await remove.mutateAsync(deletingRecord.id);
      toast.success('Registro excluido.');
      setDeletingRecord(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Nao foi possivel excluir. Tente novamente.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={moduleConfig.searchPlaceholder}
            aria-label="Buscar registros"
            className="w-full rounded-[var(--radius)] border border-border bg-surface py-2.5 pl-9 pr-9 text-sm text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-text-faint hover:bg-surface-alt hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Button onClick={handleCreateClick} className="shrink-0">
          <Plus className="size-4" />
          Novo
        </Button>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-danger">Erro ao carregar {moduleConfig.title.toLowerCase()}.</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <RecordsTable
            module={moduleConfig}
            records={filteredRecords}
            isLoading={isLoading}
            hasFilters={!!search.trim()}
            onEdit={handleEditClick}
            onDelete={setDeletingRecord}
          />
        )}
      </div>

      <RecordFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRecord(null);
        }}
        module={moduleConfig}
        defaultValues={editingRecord ? (editingRecord as unknown as ModuleFormValues) : undefined}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />

      <ConfirmDialog
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
        title={`Excluir ${moduleConfig.singular}?`}
        description="Esta acao nao pode ser desfeita. O registro sera removido permanentemente."
        loading={remove.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
