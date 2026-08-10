import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { api, schedulingApi, ApiError, type AppointmentRecord } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

/** Faixa de horario exibida na grade. */
const START_HOUR = 7;
const END_HOUR = 19;

const STATUS_OPTIONS = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'na_fila', label: 'Check-in (fila do dia)' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
];

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const CONTROL_CLASSES =
  'w-full rounded-[var(--radius)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary';

/** Segunda-feira da semana da data informada, à meia-noite local. */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // domingo (0) vira 6
  d.setDate(d.getDate() - diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function formatHour(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDayLabel(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatRangeLabel(inicio: Date, fim: Date): string {
  const mesmoMes = inicio.getMonth() === fim.getMonth();
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: mesmoMes ? undefined : 'short' });
  return `${fmt(inicio)} – ${fim.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
}

export default function SchedulingWeekPage() {
  const role = getUser()?.role;
  const canManage = role === 'admin' || role === 'assistente';

  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [doctorFilter, setDoctorFilter] = useState('');

  // slot clicado para criar um novo agendamento
  const [newSlot, setNewSlot] = useState<Date | null>(null);
  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');

  // agendamento aberto no painel de detalhe
  const [selected, setSelected] = useState<AppointmentRecord | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const rangeQuery = useQuery({
    queryKey: ['scheduling-range', weekStart.toISOString(), doctorFilter],
    queryFn: () => schedulingApi.range(weekStart.toISOString(), weekEnd.toISOString(), doctorFilter || undefined),
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
    enabled: canManage && newSlot !== null,
  });

  const slotMinutes = rangeQuery.data?.slotMinutes ?? 30;

  const slots = useMemo(() => {
    const result: number[] = [];
    for (let m = START_HOUR * 60; m < END_HOUR * 60; m += slotMinutes) result.push(m);
    return result;
  }, [slotMinutes]);

  /** Agendamentos indexados por `diaIndex-minutoDoSlot`. */
  const byCell = useMemo(() => {
    const map = new Map<string, AppointmentRecord[]>();
    for (const item of rangeQuery.data?.items ?? []) {
      if (!item.data_hora) continue;
      const d = new Date(item.data_hora);
      const dayIndex = days.findIndex((day) => sameDay(day, d));
      if (dayIndex < 0) continue;
      const minutes = d.getHours() * 60 + d.getMinutes();
      const slotStart = Math.floor(minutes / slotMinutes) * slotMinutes;
      const key = `${dayIndex}-${slotStart}`;
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [rangeQuery.data, days, slotMinutes]);

  const foraDaFaixa = useMemo(
    () =>
      (rangeQuery.data?.items ?? []).filter((item) => {
        if (!item.data_hora) return true;
        const h = new Date(item.data_hora).getHours();
        return h < START_HOUR || h >= END_HOUR;
      }),
    [rangeQuery.data]
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['scheduling-range'] });
    qc.invalidateQueries({ queryKey: ['queue'] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      api.create('scheduling', {
        patientId: formPatientId,
        doctorId: formDoctorId,
        data_hora: newSlot!.toISOString(),
        status: 'agendado',
      }),
    onSuccess: () => {
      toast.success('Agendamento criado');
      closeCreate();
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao agendar'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.update('scheduling', id, { status }),
    onSuccess: (_data, variables) => {
      toast.success(variables.status === 'na_fila' ? 'Check-in feito — paciente na fila' : 'Status atualizado');
      setSelected(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao atualizar'),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => api.remove('scheduling', id),
    onSuccess: () => {
      toast.success('Agendamento removido');
      setSelected(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao remover'),
  });

  function openCreate(day: Date, minutes: number) {
    const slot = new Date(day);
    slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    setNewSlot(slot);
    setFormPatientId('');
    setFormDoctorId(doctorFilter || '');
  }

  function closeCreate() {
    setNewSlot(null);
    setFormPatientId('');
    setFormDoctorId('');
  }

  if (!canManage) return <Navigate to="/" replace />;

  const hoje = new Date();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Agenda</h1>
          <p className="mt-1 text-sm text-text-muted">
            Semana de {formatRangeLabel(weekStart, addDays(weekStart, 6))} · blocos de {slotMinutes} min.
            Clique em um horário livre para agendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filtrar por profissional"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className={`${CONTROL_CLASSES} h-11 w-full cursor-pointer py-0 sm:w-56`}
          >
            <option value="">Todos os profissionais</option>
            {(doctorsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Semana anterior"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Hoje
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Próxima semana"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface scrollbar-thin">
        <div className="min-w-[860px]">
          {/* cabecalho dos dias */}
          <div className="grid grid-cols-[68px_repeat(7,1fr)] border-b border-border bg-surface-alt">
            <div className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-text-faint">Hora</div>
            {days.map((day, i) => {
              const isHoje = sameDay(day, hoje);
              return (
                <div
                  key={day.toISOString()}
                  className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    isHoje ? 'text-primary' : 'text-text-muted'
                  }`}
                >
                  {WEEKDAYS[i]}{' '}
                  <span className={isHoje ? 'font-bold' : 'font-normal'}>{formatDayLabel(day)}</span>
                </div>
              );
            })}
          </div>

          {/* linhas de horario */}
          {slots.map((minutes) => (
            <div
              key={minutes}
              className="grid grid-cols-[68px_repeat(7,1fr)] border-b border-border/60 last:border-b-0"
            >
              <div className="px-2 py-2 text-xs tabular-nums text-text-faint">{formatHour(minutes)}</div>

              {days.map((day, dayIndex) => {
                const items = byCell.get(`${dayIndex}-${minutes}`) ?? [];
                const isHoje = sameDay(day, hoje);

                if (items.length === 0) {
                  return (
                    <button
                      key={`${dayIndex}-${minutes}`}
                      type="button"
                      onClick={() => openCreate(day, minutes)}
                      aria-label={`Agendar ${formatDayLabel(day)} às ${formatHour(minutes)}`}
                      className={`group flex min-h-[46px] items-center justify-center border-l border-border/60 transition-colors hover:bg-primary/5 ${
                        isHoje ? 'bg-primary/[0.03]' : ''
                      }`}
                    >
                      <Plus className="size-4 text-transparent transition-colors group-hover:text-primary" />
                    </button>
                  );
                }

                return (
                  <div
                    key={`${dayIndex}-${minutes}`}
                    className={`flex min-h-[46px] flex-col gap-1 border-l border-border/60 p-1 ${
                      isHoje ? 'bg-primary/[0.03]' : ''
                    }`}
                  >
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelected(item)}
                        className="w-full rounded-[var(--radius)] border border-border bg-surface-alt px-2 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <p className="truncate text-xs font-semibold text-text">{item.paciente || '—'}</p>
                        <p className="truncate text-[11px] text-text-muted">{item.doctorNome}</p>
                        {item.status && (
                          <span className="mt-1 inline-block">
                            <Badge value={item.status} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {rangeQuery.isError && (
        <p className="text-sm text-danger">Não foi possível carregar a agenda desta semana.</p>
      )}

      {foraDaFaixa.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text">
            Fora do horário exibido ({formatHour(START_HOUR * 60)}–{formatHour(END_HOUR * 60)})
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {foraDaFaixa.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex w-full items-center justify-between gap-3 rounded-[var(--radius)] border border-border px-3 py-2 text-left text-sm hover:bg-surface-alt"
                >
                  <span className="font-medium text-text">{item.paciente || '—'}</span>
                  <span className="text-text-muted">
                    {item.data_hora ? new Date(item.data_hora).toLocaleString('pt-BR') : 'Sem data'}
                  </span>
                  <Badge value={item.status ?? undefined} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!rangeQuery.isLoading && (rangeQuery.data?.items.length ?? 0) === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="Nenhum agendamento nesta semana"
          description="Clique em um horário livre na grade para marcar a primeira consulta."
        />
      )}

      {/* criar agendamento */}
      <Modal
        open={newSlot !== null}
        onOpenChange={(open) => !open && closeCreate()}
        title="Novo agendamento"
        description={
          newSlot
            ? newSlot.toLocaleString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeCreate}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              loading={createMut.isPending}
              disabled={!formPatientId || !formDoctorId}
            >
              Agendar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="agenda-paciente" className="text-sm font-medium text-text">
              Paciente<span className="ml-0.5 text-danger">*</span>
            </label>
            <select
              id="agenda-paciente"
              value={formPatientId}
              onChange={(e) => setFormPatientId(e.target.value)}
              className={`${CONTROL_CLASSES} cursor-pointer`}
            >
              <option value="">Selecione</option>
              {(patientsQuery.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="agenda-medico" className="text-sm font-medium text-text">
              Profissional<span className="ml-0.5 text-danger">*</span>
            </label>
            <select
              id="agenda-medico"
              value={formDoctorId}
              onChange={(e) => setFormDoctorId(e.target.value)}
              className={`${CONTROL_CLASSES} cursor-pointer`}
            >
              <option value="">Selecione</option>
              {(doctorsQuery.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">
              O horário é bloqueado se o profissional já tiver consulta neste bloco.
            </p>
          </div>
        </div>
      </Modal>

      {/* detalhe do agendamento */}
      <Modal
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.paciente || 'Agendamento'}
        description={
          selected?.data_hora
            ? `${new Date(selected.data_hora).toLocaleString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })} · ${selected.doctorNome}`
            : undefined
        }
        footer={
          <Button
            variant="danger"
            size="sm"
            onClick={() => selected && removeMut.mutate(selected.id)}
            loading={removeMut.isPending}
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            Status atual: <Badge value={selected?.status ?? undefined} />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">Alterar status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.filter((opt) => opt.value !== selected?.status).map((opt) => (
                <Button
                  key={opt.value}
                  variant={opt.value === 'na_fila' ? 'primary' : 'secondary'}
                  size="sm"
                  loading={statusMut.isPending && statusMut.variables?.status === opt.value}
                  onClick={() => selected && statusMut.mutate({ id: selected.id, status: opt.value })}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              O check-in move o paciente para a fila do dia, na ordem de chegada.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
