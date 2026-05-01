import { useEffect, useState } from 'react';

export default function KpiCard({ title, value, amount, format, tone = 'slate', icon: Icon, emphasis = false }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    green: 'bg-green-50 text-success dark:bg-green-950 dark:text-green-200',
    red: 'bg-red-50 text-danger dark:bg-red-950 dark:text-red-200',
    amber: 'bg-amber-50 text-warning dark:bg-amber-950 dark:text-amber-200',
  };
  const displayAmount = useCountUp(amount);
  const displayValue = amount !== undefined ? (format ? format(displayAmount) : Math.round(displayAmount)) : value;

  return (
    <div className={`panel animate-in p-4 transition hover:-translate-y-0.5 hover:shadow-glow ${emphasis ? 'ring-1 ring-cyan/30' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold text-navy dark:text-slate-50">{displayValue}</p>
        </div>
        {Icon && <div className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}><Icon size={20} /></div>}
      </div>
    </div>
  );
}

function useCountUp(value) {
  const [display, setDisplay] = useState(value || 0);

  useEffect(() => {
    if (value === undefined) return;
    const target = Number(value || 0);
    const start = display;
    const started = performance.now();
    const duration = 650;
    let frame;

    const tick = (time) => {
      const progress = Math.min((time - started) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(start + (target - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return display;
}
