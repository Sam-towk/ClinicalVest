import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Printer } from 'lucide-react';
import { patientsApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { printCertificate } from '@/lib/printCertificate';

type Tab = 'resumo' | 'consultas' | 'prescricoes' | 'exames' | 'documentos';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function PatientProfilePage() {
  const { id } = useParams();
  const user = getUser();
  const role = user?.role;
  const isAssistente = role === 'assistente';
  const canPrintCert = role === 'medico' || role === 'admin';
  const [tab, setTab] = useState<Tab>('resumo');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients', id, 'summary'],
    queryFn: () => patientsApi.summary(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-sm text-text-muted">Carregando paciente…</p>;
  if (isError || !data) {
    return <p className="text-sm text-danger">Paciente não encontrado.</p>;
  }

  const tabs: { id: Tab; label: string; hide?: boolean }[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'consultas', label: 'Consultas' },
    { id: 'prescricoes', label: 'Prescrições', hide: isAssistente },
    { id: 'exames', label: 'Exames' },
    { id: 'documentos', label: 'Documentos' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/patients" className="mb-2 inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary">
            <ArrowLeft className="size-3.5" /> Pacientes
          </Link>
          <h2 className="font-heading text-2xl font-bold text-text">{data.patient.nome}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {[data.patient.documentoMascarado, data.patient.contato, formatDate(data.patient.dataNasc)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs
          .filter((t) => !t.hide)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'resumo' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Dados pessoais">
            <Row label="Nome" value={data.patient.nome} />
            <Row label="Documento" value={data.patient.documentoMascarado ?? '—'} />
            <Row label="Contato" value={data.patient.contato ?? '—'} />
            <Row label="Nascimento" value={formatDate(data.patient.dataNasc)} />
            {data.patient.observacoes && <Row label="Observações" value={data.patient.observacoes} />}
          </Card>
          {!isAssistente && (
            <Card title="Clínico">
              <Row label="Alergias" value={data.patient.alergias || 'Nenhuma registrada'} danger={!!data.patient.alergias} />
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-text-faint">Uso contínuo</p>
                {data.continuousPrescriptions.length === 0 ? (
                  <p className="mt-1 text-sm text-text-muted">—</p>
                ) : (
                  <ul className="mt-1 text-sm">
                    {data.continuousPrescriptions.map((p) => (
                      <li key={p.id} className={p.encerradaEm ? 'text-text-faint line-through' : ''}>
                        {p.medicamento}
                        {p.dose ? ` · ${p.dose}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-text-faint">Condições</p>
                {data.conditions.length === 0 ? (
                  <p className="mt-1 text-sm text-text-muted">—</p>
                ) : (
                  <ul className="mt-1 text-sm">
                    {data.conditions.map((c, i) => (
                      <li key={`${c.cid}-${i}`}>
                        {c.cid} · desde {formatDate(c.desde)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'consultas' && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-text-faint">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Data</th>
                <th className="px-4 py-2.5 font-semibold">Médico</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.consultations.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {isAssistente ? (
                      formatDate(c.finalizadaEm || c.iniciadaEm)
                    ) : (
                      <button
                        type="button"
                        className="text-left text-primary hover:underline"
                        onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      >
                        {formatDate(c.finalizadaEm || c.iniciadaEm)}
                      </button>
                    )}
                    {!isAssistente && expanded === c.id && (
                      <div className="mt-2 space-y-1 text-xs text-text-muted">
                        <p>
                          <span className="font-medium text-text">Queixa:</span> {c.queixa || '—'}
                        </p>
                        <p>
                          <span className="font-medium text-text">Conduta:</span> {c.conduta || '—'}
                        </p>
                        <p>
                          <span className="font-medium text-text">CID:</span> {c.cid || '—'}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.doctorNome}</td>
                  <td className="px-4 py-3 capitalize">{c.status.replace('_', ' ')}</td>
                </tr>
              ))}
              {data.consultations.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                    Nenhuma consulta
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'prescricoes' && !isAssistente && (
        <ul className="flex flex-col gap-2">
          {(data.prescriptions ?? []).map((p) => (
            <li
              key={p.id}
              className={`rounded-[var(--radius)] border border-border bg-surface px-4 py-3 text-sm ${
                p.encerradaEm ? 'opacity-50' : ''
              }`}
            >
              <p className="font-medium text-text">{p.medicamento}</p>
              <p className="text-text-muted">
                {[p.dose, p.posologia, p.usoContinuo ? 'uso contínuo' : null].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 text-xs text-text-faint">Desde {formatDate(p.iniciadaEm)}</p>
            </li>
          ))}
          {(data.prescriptions ?? []).length === 0 && (
            <p className="text-sm text-text-muted">Nenhuma prescrição</p>
          )}
        </ul>
      )}

      {tab === 'exames' && (
        <ul className="flex flex-col gap-2">
          {data.exams.map((e) => (
            <li key={e.id} className="rounded-[var(--radius)] border border-border bg-surface px-4 py-3 text-sm">
              <p className="font-medium text-text">{e.tipo}</p>
              <p className="text-text-muted">
                {formatDate(e.createdAt)} · {e.status}
              </p>
              {!isAssistente && e.resultado && (
                <p className="mt-1 text-xs text-text-muted">Resultado: {e.resultado}</p>
              )}
            </li>
          ))}
          {data.exams.length === 0 && <p className="text-sm text-text-muted">Nenhum exame</p>}
        </ul>
      )}

      {tab === 'documentos' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Atestados">
            {data.documents.certificates.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum</p>
            ) : (
              <ul className="text-sm">
                {data.documents.certificates.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                  >
                    <span>
                      {c.dias} dia(s) · {c.doctorNome} · {formatDate(c.createdAt)}
                    </span>
                    {canPrintCert && (
                      <button
                        type="button"
                        aria-label="Imprimir atestado"
                        className="text-text-faint hover:text-primary"
                        onClick={() => {
                          try {
                            printCertificate({
                              patientNome: data.patient.nome,
                              patientDocumento: data.patient.documentoMascarado,
                              doctorNome: c.doctorNome,
                              dias: c.dias,
                              cid: c.cid,
                              emitidoEm: c.createdAt,
                              clinicLabel: user?.tenantId,
                            });
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Não foi possível imprimir');
                          }
                        }}
                      >
                        <Printer className="size-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Encaminhamentos">
            {data.documents.referrals.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum</p>
            ) : (
              <ul className="text-sm">
                {data.documents.referrals.map((r) => (
                  <li key={r.id} className="border-b border-border py-2 last:border-0">
                    {r.destino} · {r.doctorNome} · {formatDate(r.createdAt)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-faint">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="mb-2">
      <p className="text-xs text-text-faint">{label}</p>
      <p className={`text-sm ${danger ? 'font-medium text-danger' : 'text-text'}`}>{value}</p>
    </div>
  );
}
