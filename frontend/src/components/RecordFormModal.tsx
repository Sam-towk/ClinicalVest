import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ModuleConfig } from '@/types/module';
import { buildModuleSchema, type ModuleFormValues } from '@/lib/validation';
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
  const schema = buildModuleSchema(module.fields);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues ?? {});
    }
  }, [open, defaultValues, reset]);

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
        {module.fields.map((field) => (
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
