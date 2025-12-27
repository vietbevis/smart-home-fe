'use client';

import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deviceName: string;
  action: 'on' | 'off';
  isEmergency?: boolean;
}

/**
 * Vietnamese confirmation modal for device control
 * Requires explicit user confirmation before any action
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  deviceName,
  action,
  isEmergency = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key
  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actionText = action === 'on' ? 'BẬT' : 'TẮT';
  const actionColor = action === 'on' ? 'text-success' : 'text-danger';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        className={cn(
          'w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl',
          'animate-in zoom-in-95 duration-200',
          isEmergency && 'ring-2 ring-danger'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl',
                isEmergency ? 'bg-danger/10' : action === 'on' ? 'bg-success/10' : 'bg-muted'
              )}
            >
              {isEmergency ? (
                <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              ) : (
                <Power 
                  className={cn(
                    'h-5 w-5',
                    action === 'on' ? 'text-success' : 'text-muted-foreground'
                  )} 
                  aria-hidden="true"
                />
              )}
            </div>
            <h2 id="confirm-title" className="text-lg font-semibold">
              Xác nhận thao tác
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-foreground">
            Bạn có chắc chắn muốn{' '}
            <span className={cn('font-bold', actionColor)}>{actionText}</span>{' '}
            <span className="font-semibold">{deviceName}</span> không?
          </p>
          {isEmergency && (
            <p className="mt-2 text-sm text-muted-foreground">
              ⚠️ Đây là thiết bị khẩn cấp. Hãy cân nhắc kỹ trước khi thao tác.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              'flex-1 rounded-xl px-4 py-3 font-medium',
              'bg-muted hover:bg-muted/80 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
          >
            Hủy bỏ
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              'flex-1 rounded-xl px-4 py-3 font-medium text-white transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              action === 'on'
                ? 'bg-success hover:bg-success/90 focus:ring-success'
                : 'bg-danger hover:bg-danger/90 focus:ring-danger'
            )}
          >
            Xác nhận {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
