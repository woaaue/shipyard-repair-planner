import { createPortal } from 'react-dom';
import { X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  closeOnOverlay?: boolean;
  bodyClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full'
};

export default function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  bodyClassName = 'p-6'
}: ModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      
      <div className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden rounded-[10px] border border-[var(--line)] bg-white shadow-[var(--shadow)]`}>
        {title && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--line)] bg-[var(--soft)]">
            {Icon && <Icon className="h-5 w-5 text-[var(--muted)]" />}
            <h2 className="text-base font-semibold text-[var(--ink)] flex-1">{title}</h2>
            {showClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[var(--line)]"
              >
                <X className="h-5 w-5 text-[var(--muted)]" />
              </button>
            )}
          </div>
        )}
        
        <div className={`${bodyClassName} overflow-y-auto max-h-[calc(90vh-80px)]`}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
