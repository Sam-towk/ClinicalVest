-- Redesign: patient FKs, Consultation/Prescription/ExamRequest, drop plantao/prioridade/medical_records
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ConsultationStatus" AS ENUM ('rascunho', 'em_atendimento', 'pausada', 'finalizada');
CREATE TYPE "QueueStatus" AS ENUM ('aguardando', 'em_atendimento', 'pausado', 'atendido', 'faltou');
CREATE TYPE "ExamStatus" AS ENUM ('solicitado', 'em_andamento', 'disponivel', 'entregue');

-- Patient columns
ALTER TABLE "patients" ADD COLUMN "dataNasc" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN "alergias" TEXT;
ALTER TABLE "patients" ADD COLUMN "observacoes" TEXT;

CREATE INDEX "patients_tenantId_nome_idx" ON "patients"("tenantId", "nome");
CREATE INDEX "patients_tenantId_documento_idx" ON "patients"("tenantId", "documento");

-- Doctor: drop plantao
ALTER TABLE "doctors" DROP COLUMN "plantao";

-- Consultations
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "queixa" TEXT,
    "conduta" TEXT,
    "cid" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'em_atendimento',
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultations_tenantId_idx" ON "consultations"("tenantId");
CREATE INDEX "consultations_doctorId_idx" ON "consultations"("doctorId");
CREATE INDEX "consultations_patientId_idx" ON "consultations"("patientId");
CREATE INDEX "consultations_tenantId_doctorId_status_idx" ON "consultations"("tenantId", "doctorId", "status");

ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prescriptions
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "consultationId" UUID,
    "medicamento" TEXT NOT NULL,
    "dose" TEXT,
    "posologia" TEXT,
    "duracao" TEXT,
    "usoContinuo" BOOLEAN NOT NULL DEFAULT false,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prescriptions_tenantId_idx" ON "prescriptions"("tenantId");
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");
CREATE INDEX "prescriptions_consultationId_idx" ON "prescriptions"("consultationId");

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Exam requests
CREATE TABLE "exam_requests" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "consultationId" UUID,
    "tipo" TEXT NOT NULL,
    "justificativa" TEXT,
    "status" "ExamStatus" NOT NULL DEFAULT 'solicitado',
    "resultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "exam_requests_tenantId_idx" ON "exam_requests"("tenantId");
CREATE INDEX "exam_requests_patientId_idx" ON "exam_requests"("patientId");
CREATE INDEX "exam_requests_consultationId_idx" ON "exam_requests"("consultationId");

ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Certificates
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "consultationId" UUID,
    "doctorId" UUID NOT NULL,
    "dias" INTEGER NOT NULL,
    "cid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "certificates_tenantId_idx" ON "certificates"("tenantId");
CREATE INDEX "certificates_patientId_idx" ON "certificates"("patientId");

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Referrals (consulta → destino)
CREATE TABLE "referrals" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "consultationId" UUID,
    "doctorId" UUID NOT NULL,
    "destino" TEXT NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "referrals_tenantId_idx" ON "referrals"("tenantId");
CREATE INDEX "referrals_patientId_idx" ON "referrals"("patientId");

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Helper: ensure a patient exists for a free-text name within a tenant
CREATE OR REPLACE FUNCTION _cv_ensure_patient(p_tenant TEXT, p_nome TEXT)
RETURNS UUID AS $$
DECLARE
  pid UUID;
BEGIN
  SELECT id INTO pid FROM patients
  WHERE "tenantId" = p_tenant AND lower(trim(nome)) = lower(trim(p_nome))
  ORDER BY "createdAt" ASC
  LIMIT 1;

  IF pid IS NULL THEN
    pid := gen_random_uuid();
    INSERT INTO patients (id, "tenantId", nome, especie, "createdAt", "updatedAt")
    VALUES (pid, p_tenant, trim(p_nome), 'Humano', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;

  RETURN pid;
END;
$$ LANGUAGE plpgsql;

-- Appointments: paciente String → patientId + data_hora DateTime
ALTER TABLE "appointments" ADD COLUMN "patientId" UUID;
ALTER TABLE "appointments" ADD COLUMN "data_hora_dt" TIMESTAMP(3);

UPDATE "appointments" a
SET "patientId" = _cv_ensure_patient(a."tenantId", a."paciente"),
    "data_hora_dt" = CASE
      WHEN a."data_hora" ~ '^\d{4}-\d{2}-\d{2}' THEN a."data_hora"::timestamp
      ELSE NULL
    END;

ALTER TABLE "appointments" ALTER COLUMN "patientId" SET NOT NULL;
ALTER TABLE "appointments" DROP COLUMN "paciente";
ALTER TABLE "appointments" DROP COLUMN "data_hora";
ALTER TABLE "appointments" RENAME COLUMN "data_hora_dt" TO "data_hora";

CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");
CREATE INDEX "appointments_tenantId_data_hora_idx" ON "appointments"("tenantId", "data_hora");
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Queue tickets
ALTER TABLE "queue_tickets" ADD COLUMN "patientId" UUID;
ALTER TABLE "queue_tickets" ADD COLUMN "doctorId" UUID;
ALTER TABLE "queue_tickets" ADD COLUMN "consultationId" UUID;
ALTER TABLE "queue_tickets" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "queue_tickets" ADD COLUMN "status_new" "QueueStatus";

UPDATE "queue_tickets" q
SET "patientId" = _cv_ensure_patient(q."tenantId", q."paciente"),
    "status_new" = CASE
      WHEN lower(coalesce(q.status, '')) IN ('atendido', 'concluido', 'concluído') THEN 'atendido'::"QueueStatus"
      WHEN lower(coalesce(q.status, '')) IN ('chamado', 'em atendimento', 'em_atendimento') THEN 'em_atendimento'::"QueueStatus"
      WHEN lower(coalesce(q.status, '')) IN ('faltou', 'falta') THEN 'faltou'::"QueueStatus"
      WHEN lower(coalesce(q.status, '')) IN ('pausado', 'pausada') THEN 'pausado'::"QueueStatus"
      ELSE 'aguardando'::"QueueStatus"
    END;

-- position by createdAt within tenant among active-ish tickets
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt" ASC) - 1 AS pos
  FROM "queue_tickets"
)
UPDATE "queue_tickets" q SET "position" = ordered.pos FROM ordered WHERE q.id = ordered.id;

ALTER TABLE "queue_tickets" ALTER COLUMN "patientId" SET NOT NULL;
ALTER TABLE "queue_tickets" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "queue_tickets" DROP COLUMN "paciente";
ALTER TABLE "queue_tickets" DROP COLUMN "prioridade";
ALTER TABLE "queue_tickets" DROP COLUMN "status";
ALTER TABLE "queue_tickets" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "queue_tickets" ALTER COLUMN "status" SET DEFAULT 'aguardando'::"QueueStatus";

CREATE INDEX "queue_tickets_patientId_idx" ON "queue_tickets"("patientId");
CREATE INDEX "queue_tickets_tenantId_status_position_idx" ON "queue_tickets"("tenantId", "status", "position");

ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate medical_records → patient.alergias + consultation stubs
UPDATE patients p
SET alergias = COALESCE(p.alergias, sub.alergias)
FROM (
  SELECT DISTINCT ON (mr."tenantId", lower(trim(mr.paciente)))
    mr."tenantId",
    lower(trim(mr.paciente)) AS nome_key,
    mr.alergias
  FROM medical_records mr
  WHERE mr.alergias IS NOT NULL AND trim(mr.alergias) <> ''
  ORDER BY mr."tenantId", lower(trim(mr.paciente)), mr."createdAt" DESC
) sub
WHERE p."tenantId" = sub."tenantId" AND lower(trim(p.nome)) = sub.nome_key;

INSERT INTO consultations (
  id, "tenantId", "patientId", "doctorId", queixa, conduta, cid, status, "iniciadaEm", "finalizadaEm", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  mr."tenantId",
  _cv_ensure_patient(mr."tenantId", mr.paciente),
  mr."doctorId",
  NULLIF(trim(COALESCE(mr.exames_solicitados, '') || E'\n' || COALESCE(mr.itens_prescritos, '')), ''),
  NULL,
  mr.classificacao_doenca,
  'finalizada'::"ConsultationStatus",
  mr."createdAt",
  mr."updatedAt",
  mr."createdAt",
  mr."updatedAt"
FROM medical_records mr;

DROP TABLE "medical_records";

DROP FUNCTION _cv_ensure_patient(TEXT, TEXT);
