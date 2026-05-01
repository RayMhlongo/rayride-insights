export default function KpiCard({ title, value, tone = 'slate', icon: Icon }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-50 text-success',
    red: 'bg-red-50 text-danger',
    amber: 'bg-amber-50 text-warning',
  };
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
        </div>
        {Icon && <div className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}><Icon size={20} /></div>}
      </div>
    </div>
  );
}
