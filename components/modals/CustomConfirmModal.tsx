import React from 'react';

interface CustomConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="liquid-glass-dark w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative border-2 border-white">
        <div className="text-center mb-6 text-lg font-bold text-slate-900">{message}</div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onConfirm}
            className="bg-rose-500 text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:bg-rose-600 transition-all"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:bg-slate-300 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
