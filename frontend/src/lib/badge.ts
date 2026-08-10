export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_KEYWORDS: Record<Exclude<Tone, 'neutral'>, string[]> = {
  danger: ['alta', 'urgente', 'cancelad', 'critic', 'emergenc', 'faltou'],
  warning: ['media', 'pendente', 'aguardando', 'pausado'],
  info: ['chamado', 'agendado', 'andamento', 'baixa', 'em_atendimento', 'na_fila'],
  success: ['atendido', 'concluid', 'confirmado', 'ativo', 'liberad', 'finalizada'],
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function getTone(value?: string): Tone {
  if (!value) return 'neutral';
  const normalized = normalize(value);
  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS) as [Exclude<Tone, 'neutral'>, string[]][]) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return tone;
  }
  return 'neutral';
}

export const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-info-soft text-info border-info/20',
  neutral: 'bg-surface-alt text-text-muted border-border',
};
