import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { api, queueApi, ApiError, type ModuleRecord } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function QueueDayPage() {
  const user = getUser();
  const role = user?.role;
  const canManage = role === 'admin' || role === 'assistente';
  const qc = useQueryClient();
  const [encaminharId, setEncaminharId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newPatientId, setNewPatientId] = useState('');

  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: () => api.list('queue'),
    enabled: canManage,
  });
  const doctorsQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.list('doctors'),
    enabled: canManage,
  });
  const patientsQuery = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.list('patients'),
    enabled: canManage && createOpen,
  });

  const active = useMemo(() => {
    const items = queueQuery.data ?? [];
    return items
      .filter((t) => ['aguardando', 'em_atendimento', 'pausado'].includes(t.status ?? ''))
      .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
  }, [queueQuery.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['queue'] });

  const encaminharMut = useMutation({
    mutationFn: () => queueApi.encaminhar(encaminharId!, doctorId),
    onSuccess: () => {
      toast.success('Paciente encaminhado ao médico');
      setEncaminharId(null);
      setDoctorId('');
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao encaminhar'),
  });

  const createMut = useMutation({
    mutationFn: () => api.create('queue', { patientId: newPatientId, status: 'aguardando' }),
    onSuccess: () => {
      toast.success('Adicionado à fila');
      setCreateOpen(false);
      setNewPatientId('');
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao criar'),
  });

  async function move(ticket: ModuleRecord, dir: -1 | 1) {
    const ids = active.map((t) => t.id);
    const idx = ids.indexOf(ticket.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ids.length) return;
    const next = [...ids];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    try {
      await queueApi.reorder(next);
      invalidate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao reordenar');
    }
  }

  async function markFaltou(id: string) {
    try {
      await api.update('queue', id, { status: 'faltou' });
      invalidate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro');
    }
  }

  if (!canManage) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-text">Fila do dia</h2>
          <p className="mt-1 text-sm text-text-muted">
            Ordem de chegada. Encaminhe o paciente ao médico quando for a vez dele.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      {queueQuery.isLoading ? (
        <p className="text-sm text-text-muted">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-text-faint">
              <tr>
                <th className="px-4 py-2.5 font-semibold">#</th>
                <th className="px-4 py-2.5 font-semibold">Paciente</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Espera</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {active.map((t, i) => {
                const waitMin = Math.max(
                  0,
                  Math.round((Date.now() - new Date(t.createdAt).getTime()) / 60_000)
                );
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link to={`/patients/${t.patientId}`} className="font-medium text-primary hover:underline">
                        {t.paciente || t.patientNome || 'Paciente'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={t.status} />
                    </td>
                    <td className="px-4 py-3 text-text-muted">{waitMin} min</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => move(t, -1)} disabled={i === 0}>
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => move(t, 1)}
                          disabled={i === active.length - 1}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        {t.status !== 'em_atendimento' && (
                          <Button size="sm" onClick={() => setEncaminharId(t.id)}>
                            Encaminhar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => markFaltou(t.id)}>
                          Faltou
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                    Fila vazia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!encaminharId}
        onOpenChange={(open) => !open && setEncaminharId(null)}
        title="Encaminhar ao médico"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEncaminharId(null)}>
              Cancelar
            </Button>
            <Button
              loading={encaminharMut.isPending}
              disabled={!doctorId}
              onClick={() => encaminharMut.mutate()}
            >
              Encaminhar
            </Button>
          </>
        }
      >
        <label className="text-sm font-medium text-text">
          Médico
          <select
            className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">Selecione</option>
            {(doctorsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </label>
      </Modal>

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Adicionar à fila"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              loading={createMut.isPending}
              disabled={!newPatientId}
              onClick={() => createMut.mutate()}
            >
              Adicionar
            </Button>
          </>
        }
      >
        <label className="text-sm font-medium text-text">
          Paciente
          <select
            className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
            value={newPatientId}
            onChange={(e) => setNewPatientId(e.target.value)}
          >
            <option value="">Selecione</option>
            {(patientsQuery.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
      </Modal>
    </div>
  );
}
