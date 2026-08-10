import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Clock, Pill, FilePlus2, Printer, ScrollText, Share2, X } from 'lucide-react';
import { consultationsApi, ApiError, type ConsultationCurrent } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { printCertificate } from '@/lib/printCertificate';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type ModalKind = 'exam' | 'prescription' | 'certificate' | 'referral' | null;

function ageFrom(dataNasc: string | null | undefined) {
  if (!dataNasc) return null;
  const birth = new Date(dataNasc);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function AtendimentoPage() {
  const user = getUser();
  const qc = useQueryClient();
  const [queixa, setQueixa] = useState('');
  const [conduta, setConduta] = useState('');
  const [cid, setCid] = useState('');
  const [modal, setModal] = useState<ModalKind>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFinishedId = useRef<string | null>(null);
  const isMedico = user?.role === 'medico';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['consultations', 'current'],
    queryFn: consultationsApi.current,
    refetchInterval: 15_000,
    enabled: isMedico,
  });

  const consultation = data?.consultation;
  const context = data?.context;
  const miniQueue = data?.miniQueue ?? context?.miniQueue ?? { next: [], waitingCount: 0 };

  useEffect(() => {
    if (!consultation) {
      setQueixa('');
      setConduta('');
      setCid('');
      return;
    }
    setQueixa(consultation.queixa ?? '');
    setConduta(consultation.conduta ?? '');
    setCid(consultation.cid ?? '');
  }, [consultation?.id]);

  function scheduleSave(next: { queixa?: string; conduta?: string; cid?: string }) {
    if (!consultation) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await consultationsApi.patch(consultation.id, next);
      } catch {
        /* rascunho — silencioso */
      }
    }, 600);
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['consultations', 'current'] });

  const finishMut = useMutation({
    mutationFn: () => consultationsApi.finish(consultation!.id),
    onSuccess: (result) => {
      lastFinishedId.current = consultation!.id;
      qc.setQueryData(['consultations', 'current'], result.current);
      toast.success('Consulta finalizada', {
        action: {
          label: 'Desfazer',
          onClick: async () => {
            if (!lastFinishedId.current) return;
            try {
              const restored = await consultationsApi.undoFinish(lastFinishedId.current);
              qc.setQueryData(['consultations', 'current'], restored);
              toast.message('Atendimento restaurado');
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'Não foi possível desfazer');
            }
          },
        },
        duration: 10_000,
      });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao finalizar'),
  });

  const pauseMut = useMutation({
    mutationFn: () => consultationsApi.pause(consultation!.id),
    onSuccess: () => {
      toast.message('Atendimento pausado — paciente voltou à fila');
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao pausar'),
  });

  const callNextMut = useMutation({
    mutationFn: consultationsApi.callNext,
    onSuccess: (result) => {
      qc.setQueryData(['consultations', 'current'], result);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Fila vazia'),
  });

  async function submitModal() {
    if (!consultation || !modal) return;
    try {
      if (modal === 'exam') {
        await consultationsApi.addExam(consultation.id, {
          tipo: form.tipo,
          justificativa: form.justificativa,
        });
      } else if (modal === 'prescription') {
        await consultationsApi.addPrescription(consultation.id, {
          medicamento: form.medicamento,
          dose: form.dose,
          posologia: form.posologia,
          duracao: form.duracao,
          usoContinuo: Boolean(form.usoContinuo),
        });
      } else if (modal === 'certificate') {
        const cert = await consultationsApi.addCertificate(consultation.id, {
          dias: Number(form.dias),
          cid: form.cid,
        });
        try {
          printCertificate({
            patientNome: context?.patient?.nome ?? 'Paciente',
            patientDocumento: context?.patient?.documentoMascarado,
            doctorNome: user?.nome ?? 'Médico',
            dias: cert.dias,
            cid: cert.cid,
            emitidoEm: cert.createdAt,
            clinicLabel: user?.tenantId,
          });
        } catch (printErr) {
          toast.error(printErr instanceof Error ? printErr.message : 'Não foi possível abrir a impressão');
        }
      } else if (modal === 'referral') {
        await consultationsApi.addReferral(consultation.id, {
          destino: form.destino,
          motivo: form.motivo,
        });
      }
      setModal(null);
      setForm({});
      invalidate();
      toast.success(modal === 'certificate' ? 'Atestado salvo — use a janela de impressão' : 'Adicionado à consulta');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar');
    }
  }

  function handlePrintCertificate(cert: { dias: number; cid: string | null }) {
    if (!context?.patient) return;
    try {
      printCertificate({
        patientNome: context.patient.nome,
        patientDocumento: context.patient.documentoMascarado,
        doctorNome: user?.nome ?? 'Médico',
        dias: cert.dias,
        cid: cert.cid,
        clinicLabel: user?.tenantId,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir a impressão');
    }
  }

  async function removeItem(kind: string, itemId: string) {
    if (!consultation) return;
    try {
      await consultationsApi.removeAttached(consultation.id, kind, itemId);
      invalidate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao remover');
    }
  }

  if (!isMedico) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <p className="text-sm text-text-muted">Carregando atendimento…</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-danger">Não foi possível carregar a consulta.</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const patient = context?.patient;
  const age = ageFrom(patient?.dataNasc);

  return (
    <div className="flex flex-col gap-4">
      {miniQueue.waitingCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-border bg-surface-alt px-4 py-2 text-sm text-text-muted">
          <Clock className="size-4 shrink-0" aria-hidden />
          <span>Próximos:</span>
          {miniQueue.next.map((name) => (
            <span key={name} className="rounded bg-surface px-2 py-0.5 text-text">
              {name}
            </span>
          ))}
          {miniQueue.waitingCount > 2 && (
            <span className="text-text-faint">+{miniQueue.waitingCount - 2} aguardando</span>
          )}
        </div>
      )}

      {!consultation || !patient ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h2 className="font-heading text-xl font-semibold text-text">Nenhum paciente encaminhado</h2>
          <p className="max-w-md text-sm text-text-muted">
            A recepção encaminha o paciente para você. Se houver fila, você pode chamar o próximo.
          </p>
          {miniQueue.waitingCount > 0 && (
            <Button loading={callNextMut.isPending} onClick={() => callNextMut.mutate()}>
              Chamar próximo
            </Button>
          )}
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-2xl font-bold text-text">{patient.nome}</h2>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                  Em atendimento · {formatTime(consultation.iniciadaEm)}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {[age != null ? `${age} anos` : null, patient.documentoMascarado, patient.contato]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="mt-0.5 text-xs text-text-faint">
                Última consulta: {formatDate(patient.ultimaConsulta)}
                {' · '}
                <Link to={`/patients/${patient.id}`} className="text-primary hover:underline">
                  Ver perfil
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={pauseMut.isPending} onClick={() => pauseMut.mutate()}>
                Pausar atendimento
              </Button>
              <Button loading={finishMut.isPending} onClick={() => finishMut.mutate()}>
                Finalizar e chamar próximo
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <div>
                <label className="text-sm font-medium text-text">Queixa e conduta</label>
                <textarea
                  className="mt-2 min-h-[180px] w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  placeholder="Texto livre — salvo automaticamente"
                  value={queixa}
                  onChange={(e) => {
                    setQueixa(e.target.value);
                    scheduleSave({ queixa: e.target.value, conduta, cid });
                  }}
                />
                <textarea
                  className="mt-2 min-h-[100px] w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  placeholder="Conduta / plano"
                  value={conduta}
                  onChange={(e) => {
                    setConduta(e.target.value);
                    scheduleSave({ queixa, conduta: e.target.value, cid });
                  }}
                />
                <input
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  placeholder="CID (opcional)"
                  value={cid}
                  onChange={(e) => {
                    setCid(e.target.value);
                    scheduleSave({ queixa, conduta, cid: e.target.value });
                  }}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-text">Adicionar a esta consulta</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setForm({});
                      setModal('exam');
                    }}
                  >
                    <FilePlus2 className="size-4" /> Pedir exame
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setForm({});
                      setModal('prescription');
                    }}
                  >
                    <Pill className="size-4" /> Prescrever
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setForm({});
                      setModal('certificate');
                    }}
                  >
                    <ScrollText className="size-4" /> Atestado
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setForm({});
                      setModal('referral');
                    }}
                  >
                    <Share2 className="size-4" /> Encaminhar
                  </Button>
                </div>
              </div>

              <AttachedList
                attached={context.attached}
                onRemove={removeItem}
                onPrintCertificate={handlePrintCertificate}
              />
            </section>

            <aside className="flex flex-col gap-3">
              {patient.alergias && (
                <div className="rounded-[var(--radius-lg)] border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="size-4" /> Alergias
                  </div>
                  {patient.alergias}
                </div>
              )}

              <SideCard title="Em uso contínuo">
                {context.continuousPrescriptions.length === 0 ? (
                  <p className="text-xs text-text-faint">Nenhuma</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {context.continuousPrescriptions.map((p) => (
                      <li
                        key={p.id}
                        className={`text-sm ${p.encerradaEm ? 'text-text-faint line-through' : 'text-text'}`}
                      >
                        <span className="font-medium">{p.medicamento}</span>
                        {p.dose ? ` · ${p.dose}` : ''}
                        <button
                          type="button"
                          className="ml-2 text-xs text-primary hover:underline"
                          onClick={async () => {
                            await consultationsApi.renewPrescription(consultation.id, p.id);
                            invalidate();
                            toast.success('Receita renovada nesta consulta');
                          }}
                        >
                          Renovar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </SideCard>

              <SideCard title="Condições ativas">
                {context.conditions.length === 0 ? (
                  <p className="text-xs text-text-faint">Nenhuma</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm">
                    {context.conditions.map((c, i) => (
                      <li key={`${c.cid}-${i}`}>
                        <span className="font-medium">{c.cid}</span>
                        <span className="text-text-muted"> · desde {formatDate(c.desde)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SideCard>

              <SideCard title="Consultas anteriores">
                {context.recentConsultations.length === 0 ? (
                  <p className="text-xs text-text-faint">Nenhuma</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {context.recentConsultations.map((c) => (
                      <li key={c.id}>
                        <p className="font-medium text-text">
                          {formatDate(c.data)} · {c.doctorNome}
                        </p>
                        <p className="text-xs text-text-muted">{c.resumo || '—'}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to={`/patients/${patient.id}`}
                  className="mt-2 inline-block text-xs text-primary hover:underline"
                >
                  Histórico completo
                </Link>
              </SideCard>
            </aside>
          </div>
        </>
      )}

      <Modal
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
        title={
          modal === 'exam'
            ? 'Pedir exame'
            : modal === 'prescription'
              ? 'Prescrever'
              : modal === 'certificate'
                ? 'Atestado'
                : 'Encaminhar'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button onClick={submitModal}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {modal === 'exam' && (
            <>
              <Field label="Tipo" value={String(form.tipo ?? '')} onChange={(v) => setForm({ ...form, tipo: v })} />
              <Field
                label="Justificativa"
                value={String(form.justificativa ?? '')}
                onChange={(v) => setForm({ ...form, justificativa: v })}
                textarea
              />
            </>
          )}
          {modal === 'prescription' && (
            <>
              <Field
                label="Medicamento"
                value={String(form.medicamento ?? '')}
                onChange={(v) => setForm({ ...form, medicamento: v })}
              />
              <Field label="Dose" value={String(form.dose ?? '')} onChange={(v) => setForm({ ...form, dose: v })} />
              <Field
                label="Posologia"
                value={String(form.posologia ?? '')}
                onChange={(v) => setForm({ ...form, posologia: v })}
              />
              <Field
                label="Duração"
                value={String(form.duracao ?? '')}
                onChange={(v) => setForm({ ...form, duracao: v })}
              />
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={Boolean(form.usoContinuo)}
                  onChange={(e) => setForm({ ...form, usoContinuo: e.target.checked })}
                />
                Uso contínuo
              </label>
            </>
          )}
          {modal === 'certificate' && (
            <>
              <Field
                label="Dias de afastamento"
                value={String(form.dias ?? '')}
                onChange={(v) => setForm({ ...form, dias: v })}
              />
              <Field label="CID (opcional)" value={String(form.cid ?? '')} onChange={(v) => setForm({ ...form, cid: v })} />
            </>
          )}
          {modal === 'referral' && (
            <>
              <Field
                label="Destino"
                value={String(form.destino ?? '')}
                onChange={(v) => setForm({ ...form, destino: v })}
              />
              <Field
                label="Motivo"
                value={String(form.motivo ?? '')}
                onChange={(v) => setForm({ ...form, motivo: v })}
                textarea
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">{title}</p>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  const cls =
    'mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary';
  return (
    <label className="text-sm font-medium text-text">
      {label}
      {textarea ? (
        <textarea className={`${cls} min-h-[80px]`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function AttachedList({
  attached,
  onRemove,
  onPrintCertificate,
}: {
  attached: NonNullable<ConsultationCurrent['context']>['attached'];
  onRemove: (kind: string, id: string) => void;
  onPrintCertificate: (cert: { dias: number; cid: string | null }) => void;
}) {
  const items = [
    ...attached.prescriptions.map((p) => ({
      kind: 'prescriptions' as const,
      id: p.id,
      label: `Receita: ${p.medicamento}${p.usoContinuo ? ' (contínuo)' : ''}`,
      cert: null as null | { dias: number; cid: string | null },
    })),
    ...attached.exams.map((e) => ({
      kind: 'exams' as const,
      id: e.id,
      label: `Exame: ${e.tipo}`,
      cert: null as null | { dias: number; cid: string | null },
    })),
    ...attached.certificates.map((c) => ({
      kind: 'certificates' as const,
      id: c.id,
      label: `Atestado: ${c.dias} dia(s)`,
      cert: { dias: c.dias, cid: c.cid },
    })),
    ...attached.referrals.map((r) => ({
      kind: 'referrals' as const,
      id: r.id,
      label: `Encaminhamento: ${r.destino}`,
      cert: null as null | { dias: number; cid: string | null },
    })),
  ];

  if (items.length === 0) {
    return <p className="text-xs text-text-faint">Nada anexado nesta consulta ainda.</p>;
  }

  return (
    <div>
      <p className="text-sm font-medium text-text">Anexado nesta consulta</p>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={`${item.kind}-${item.id}`}
            className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
          >
            <span>{item.label}</span>
            <div className="flex items-center gap-1">
              {item.kind === 'certificates' && item.cert && (
                <button
                  type="button"
                  aria-label="Imprimir atestado"
                  className="text-text-faint hover:text-primary"
                  onClick={() => onPrintCertificate(item.cert!)}
                >
                  <Printer className="size-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Remover"
                className="text-text-faint hover:text-danger"
                onClick={() => onRemove(item.kind, item.id)}
              >
                <X className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
