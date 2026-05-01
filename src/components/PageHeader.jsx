import { Plus } from 'lucide-react';

export default function PageHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-bold text-navy">{title}</h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {actionLabel && <button className="btn-primary" onClick={onAction}><Plus size={18} /> {actionLabel}</button>}
    </div>
  );
}
