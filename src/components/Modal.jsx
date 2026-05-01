import { X } from 'lucide-react';

export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 sm:place-items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-auto rounded-t-lg bg-white shadow-soft dark:bg-nightPanel sm:max-w-2xl sm:rounded-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-4 py-3 dark:border-slate-800 dark:bg-nightPanel">
          <h2 className="font-bold text-navy dark:text-slate-50">{title}</h2>
          <button className="btn-secondary px-2" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
