import React from 'react';

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-900"
          >
            Закрыть
          </button>
        </div>
        <div className="px-6 py-5 text-slate-100">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
