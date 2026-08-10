import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ModuleConfig, ModuleField } from '@/types/module';
import { buildModuleSchema, type ModuleFormValues } from '@/lib/validation';
import { getUser } from '@/lib/auth';
import { useModuleRecords } from '@/hooks/useModuleRecords';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';

interface RecordFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleConfig;
  defaultValues?: ModuleFormValues;
  onSubmit: (values: ModuleFormValues) => Promise<void> | void;
  loading?: boolean;
}

export function RecordFormModal({ open, onOpenChange, module, defaultValues, onSubmit, loading }: RecordFormModalProps) {
  const isEditing = !!defaultValues;
  const role = getUser()?.role;

  const { data: doctorOptions } = useModuleRecords('doctors');

  const visibleFields = useMemo(() => {
    return module.fields
      .filter((field) => !field.hideInForm)
      .filter((field) => !(isEditing && field.createOnly))
      .filter((field) => !(role && field.hideForRoles?.includes(role)))
      .map((field): ModuleField => {
        if (!field.optionsSource) return field;
        const options = (doctorOptions ?? []).map((record) => ({
          value: record.id,
          label: record[field.optionsSource!.labelKey] ?? record.id,
        }));
        return { ...field, options };
      });
  }, [module.fields, role, doctorOptions, isEditing]);

  const schema = buildModuleSchema(visibleFields);

  const createDefaults = useMemo(() => {
    const defaults: ModuleFormValues = {};
    for (const field of visibleFields) {
      if (field.defaultValue !== undefined) defaults[field.key] = field.defaultValue;
    }
    return defaults;
  }, [visibleFields]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? createDefaults,
  });

  useEffect(() => {
    if (!open) return;
    const values = { ...(defaultValues ?? createDefaults) };
    for (const field of visibleFields) {
      const raw = values[field.key];
      if (!raw) continue;
      if (field.type === 'date') {
        // API manda ISO; <input type="date"> espera YYYY-MM-DD
        values[field.key] = raw.slice(0, 10);
      } else if (field.type === 'datetime-local') {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, '0');
          values[field.key] = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
      }
    }
    reset(values);
  }, [open, defaultValues, createDefaults, reset, visibleFields]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Editar ${module.singular}` : `Novo ${module.singular}`}
      description={isEditing ? 'Atualize os campos e salve para aplicar as mudancas.' : `Preencha os dados para cadastrar um novo ${module.singular}.`}
    >
      <form
        id="record-form"
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        {visibleFields.map((field) => (
          <FormField key={field.key} field={field} register={register(field.key)} error={errors[field.key]?.message as string | undefined} />
        ))}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? 'Salvar alteracoes' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
