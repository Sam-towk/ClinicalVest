import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2, Inbox, SearchX } from 'lucide-react';
import type { ModuleConfig } from '@/types/module';
import type { ModuleRecord } from '@/lib/api';
import { Badge } from './ui/Badge';
import { IconButton } from './ui/IconButton';
import { Skeleton } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';

interface RecordsTableProps {
  module: ModuleConfig;
  records: ModuleRecord[];
  isLoading: boolean;
  hasFilters: boolean;
  onEdit: (record: ModuleRecord) => void;
  onDelete: (record: ModuleRecord) => void;
}

const columnFields = (module: ModuleConfig) => module.fields.filter((f) => !f.hideInTable);

export function RecordsTable({ module, records, isLoading, hasFilters, onEdit, onDelete }: RecordsTableProps) {
  const fields = columnFields(module);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return hasFilters ? (
      <EmptyState
        icon={SearchX}
        title="Nenhum resultado encontrado"
        description="Ajuste os termos da busca ou limpe o filtro para ver todos os registros."
      />
    ) : (
      <EmptyState
        icon={Inbox}
        title="Nenhum registro ainda"
        description={`Cadastre o primeiro ${module.singular} usando o botao "Novo" acima.`}
      />
    );
  }

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
            {fields.map((field) => (
              <th key={field.key} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
                {field.label}
              </th>
            ))}
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
              Criado em
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              <span className="sr-only">Acoes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-border last:border-0 hover:bg-surface-alt/60 transition-colors duration-150">
              {fields.map((field) => (
                <td key={field.key} className="max-w-[280px] truncate px-4 py-3 align-middle text-text">
                  {field.key === module.badgeField ? (
                    <Badge value={record[field.key]} />
                  ) : (
                    record[field.key] || <span className="text-text-faint">—</span>
                  )}
                </td>
              ))}
              <td className="whitespace-nowrap px-4 py-3 align-middle text-text-muted">
                {record.createdAt ? format(new Date(record.createdAt), "d 'de' MMM, yyyy", { locale: ptBR }) : '—'}
              </td>
              <td className="px-4 py-3 align-middle">
                <div className="flex justify-end gap-1">
                  <IconButton label={`Editar ${module.singular}`} onClick={() => onEdit(record)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label={`Excluir ${module.singular}`} variant="danger" onClick={() => onDelete(record)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
