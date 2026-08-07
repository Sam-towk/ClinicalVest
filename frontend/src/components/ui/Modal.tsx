import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className="dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-lg focus:outline-none max-h-[85vh] overflow-y-auto scrollbar-thin"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-text-muted">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Fechar">
                <X className="size-4" />
              </IconButton>
            </Dialog.Close>
          </div>

          {children}

          {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
