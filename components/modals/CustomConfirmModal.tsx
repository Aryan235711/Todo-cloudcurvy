import React, { useEffect, useRef } from 'react';

interface CustomConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management and keyboard shortcuts
  useEffect(() => {
    // Focus the confirm button on mount
    confirmButtonRef.current?.focus();

    // Escape key to cancel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-500"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="liquid-glass-dark w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative border-2 border-white">
        <div 
          id="confirm-modal-title"
          className="text-center mb-6 text-lg font-bold text-slate-900"
        >
          {message}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            aria-label="Confirm delete action"
            className="bg-rose-500 text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:bg-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            aria-label="Cancel and close dialog"
            className="bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:bg-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
        
        {/* Screen reader instruction */}
        <div className="sr-only">
          Press Escape to cancel, or use Tab to navigate between buttons
        </div>
      </div>
    </div>
  );
};
