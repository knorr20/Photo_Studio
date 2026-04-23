import React, { useEffect } from 'react';
import { X, AlertTriangle, Check, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  type?: 'confirm' | 'decline' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  type = 'warning'
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'confirm':
        return {
          headerBg: 'from-green-600 to-green-700',
          icon: <Check className="h-8 w-8 text-white" />,
          confirmBg: 'bg-green-600 hover:bg-green-700'
        };
      case 'decline':
        return {
          headerBg: 'from-red-600 to-red-700',
          icon: <XCircle className="h-8 w-8 text-white" />,
          confirmBg: 'bg-red-600 hover:bg-red-700'
        };
      default:
        return {
          headerBg: 'from-yellow-600 to-yellow-700',
          icon: <AlertTriangle className="h-8 w-8 text-white" />,
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-win95-gray/80 flex items-center justify-center p-4 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="win95-window max-w-md w-full">
        {/* Header */}
        <div className="win95-window-header">
          <div className="flex items-center gap-2">
            {styles.icon}
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="win95-button p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-win95-black font-win95 text-center mb-8 text-lg">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="win95-button flex-1 px-6 py-3"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="win95-button flex-1 px-6 py-3"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;