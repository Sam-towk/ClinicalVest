import { z } from 'zod';
import type { ModuleField } from '@/types/module';

export function buildModuleSchema(fields: ModuleField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny = z.string().trim();

    if (field.type === 'email') {
      schema = field.required
        ? z.string().trim().min(1, 'Campo obrigatorio').email('Informe um email valido')
        : z.string().trim().email('Informe um email valido').or(z.literal(''));
    } else if (field.type === 'password') {
      schema = z.string().min(8, 'Minimo de 8 caracteres');
    } else if (field.required) {
      schema = z.string().trim().min(1, 'Campo obrigatorio');
    } else {
      schema = z.string().trim().optional().or(z.literal(''));
    }

    shape[field.key] = schema;
  }

  return z.object(shape);
}

export type ModuleFormValues = Record<string, string>;
