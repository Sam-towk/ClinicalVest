import { getTone, TONE_CLASSES } from '@/lib/badge';

export function Badge({ value }: { value?: string }) {
  if (!value) return <span className="text-text-faint text-sm">—</span>;

  const tone = getTone(value);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${TONE_CLASSES[tone]}`}
    >
      {value}
    </span>
  );
}
