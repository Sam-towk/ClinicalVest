import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ModuleRecord } from '@/lib/api';

export function recordsQueryKey(resource: string) {
  return ['records', resource] as const;
}

export function useModuleRecords(resource: string, enabled = true) {
  return useQuery({
    queryKey: recordsQueryKey(resource),
    queryFn: () => api.list(resource),
    enabled: enabled && !!resource,
  });
}

export function useModuleMutations(resource: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: recordsQueryKey(resource) });

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.create(resource, data),
    onSuccess: () => {
      invalidate();
      // Cadastro de paciente pode criar ticket de fila no backend.
      if (resource === 'patients') {
        queryClient.invalidateQueries({ queryKey: recordsQueryKey('queue') });
      }
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.update(resource, id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.remove(resource, id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export type { ModuleRecord };
