export function FormGrid({ children, onSubmit }) {
  return <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">{children}</form>;
}

export function Field({ label, children, wide }) {
  return (
    <label className={`grid gap-1 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Actions({ onCancel, submitLabel = 'Save' }) {
  return (
    <div className="mt-4 flex justify-end gap-2 sm:col-span-2">
      <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn-primary">{submitLabel}</button>
    </div>
  );
}
