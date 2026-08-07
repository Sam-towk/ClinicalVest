import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Compass className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-heading text-2xl font-bold text-text">Pagina nao encontrada</h2>
        <p className="mt-1 text-sm text-text-muted">O modulo que voce procura nao existe ou foi movido.</p>
      </div>
      <Link
        to="/"
        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[var(--radius)] bg-primary px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-dark"
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
}
