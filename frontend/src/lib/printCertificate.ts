export interface CertificatePrintData {
  patientNome: string;
  patientDocumento?: string | null;
  doctorNome: string;
  dias: number;
  cid?: string | null;
  emitidoEm?: string | null;
  clinicLabel?: string | null;
}

/** Abre diálogo de impressão do navegador com o texto do atestado. */
export function printCertificate(data: CertificatePrintData) {
  const date = data.emitidoEm
    ? new Date(data.emitidoEm)
    : new Date();
  const dateLabel = Number.isNaN(date.getTime())
    ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const diaWord = data.dias === 1 ? 'dia' : 'dias';
  const cidLine = data.cid?.trim()
    ? `<p>CID: <strong>${escapeHtml(data.cid.trim())}</strong></p>`
    : '';
  const docLine = data.patientDocumento
    ? `, portador(a) do documento <strong>${escapeHtml(data.patientDocumento)}</strong>`
    : '';
  const clinic = data.clinicLabel ? escapeHtml(data.clinicLabel) : 'Clinical Vest';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Atestado médico</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #14201c;
      line-height: 1.6;
      max-width: 700px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    h1 {
      font-size: 1.35rem;
      text-align: center;
      letter-spacing: 0.04em;
      margin: 0 0 8px;
      text-transform: uppercase;
    }
    .clinic {
      text-align: center;
      font-size: 0.9rem;
      color: #5b6b65;
      margin-bottom: 40px;
    }
    .body { font-size: 1.05rem; text-align: justify; margin: 32px 0; }
    .meta { font-size: 0.95rem; margin-top: 24px; }
    .sign {
      margin-top: 72px;
      text-align: center;
    }
    .sign .line {
      border-top: 1px solid #14201c;
      width: 280px;
      margin: 0 auto 8px;
    }
    .date { margin-top: 40px; text-align: right; font-size: 0.95rem; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>Atestado médico</h1>
  <p class="clinic">${clinic}</p>
  <div class="body">
    <p>
      Atesto para os devidos fins que o(a) paciente
      <strong>${escapeHtml(data.patientNome)}</strong>${docLine}
      esteve sob meus cuidados médicos e necessita de afastamento de suas atividades
      por <strong>${data.dias} ${diaWord}</strong>, a contar desta data.
    </p>
  </div>
  <div class="meta">${cidLine}</div>
  <p class="date">${dateLabel}</p>
  <div class="sign">
    <div class="line"></div>
    <p><strong>${escapeHtml(data.doctorNome)}</strong></p>
    <p>Médico(a) responsável</p>
  </div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
  if (!win) {
    throw new Error('Permita pop-ups para imprimir o atestado.');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
