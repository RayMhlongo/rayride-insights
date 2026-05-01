import { Plus } from 'lucide-react';

export default function PageHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-navy dark:text-slate-50 sm:text-3xl">{title}</h1>
        {description && <p className="muted text-sm">{description}</p>}
      </div>
      {actionLabel && <button className="btn-primary" onClick={onAction}><Plus size={18} /> {actionLabel}</button>}
    </div>
  );
}
