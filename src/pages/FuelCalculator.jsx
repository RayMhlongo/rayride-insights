import { Calculator, CalendarDays, Fuel, Gauge, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import KpiCard from '../components/KpiCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { currency, safeNumber } from '../lib/utils';

const periodDays = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

export default function FuelCalculator() {
  const [distance, setDistance] = useState('120');
  const [distancePeriod, setDistancePeriod] = useState('daily');
  const [fuelPrice, setFuelPrice] = useState('24.50');
  const [consumptionMode, setConsumptionMode] = useState('kmPerLiter');
  const [consumption, setConsumption] = useState('10');
  const [viewPeriod, setViewPeriod] = useState('daily');

  const result = useMemo(() => {
    const totalDistance = safeNumber(distance);
    const dailyDistance = totalDistance / periodDays[distancePeriod];
    const price = safeNumber(fuelPrice);
    const usage = safeNumber(consumption);
    const litersPerKm = consumptionMode === 'kmPerLiter'
      ? usage > 0 ? 1 / usage : 0
      : usage / 100;
    const dailyFuel = dailyDistance * litersPerKm;
    const selectedDays = periodDays[viewPeriod];
    const selectedDistance = dailyDistance * selectedDays;
    const selectedFuel = dailyFuel * selectedDays;
    return {
      dailyDistance,
      selectedDistance,
      selectedFuel,
      selectedCost: selectedFuel * price,
      breakdown: Object.entries(periodDays).map(([period, days]) => ({
        period,
        distance: dailyDistance * days,
        fuel: dailyFuel * days,
        cost: dailyFuel * days * price,
      })),
    };
  }, [consumption, consumptionMode, distance, distancePeriod, fuelPrice, viewPeriod]);

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-5xl">
      <PageHeader title="Fuel Calculator" description="Estimate daily, weekly, monthly, and yearly operating fuel costs." />

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="panel p-4">
          <h3 className="font-bold text-navy dark:text-slate-50">Trip Inputs</h3>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="label">Total kilometers driven</span>
              <input className="field" type="number" min="0" inputMode="decimal" value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="Example: 120" />
            </label>

            <label className="grid gap-1">
              <span className="label">Distance period</span>
              <select className="field" value={distancePeriod} onChange={(event) => setDistancePeriod(event.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="label">Fuel price per liter</span>
              <input className="field" type="number" min="0" inputMode="decimal" step="0.01" value={fuelPrice} onChange={(event) => setFuelPrice(event.target.value)} placeholder="Example: 24.50" />
            </label>

            <div className="grid gap-2">
              <span className="label">Consumption mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button className={consumptionMode === 'kmPerLiter' ? 'btn-primary' : 'btn-secondary'} onClick={() => setConsumptionMode('kmPerLiter')}>km/L</button>
                <button className={consumptionMode === 'litersPer100km' ? 'btn-primary' : 'btn-secondary'} onClick={() => setConsumptionMode('litersPer100km')}>L/100km</button>
              </div>
            </div>

            <label className="grid gap-1">
              <span className="label">{consumptionMode === 'kmPerLiter' ? 'Kilometers per liter' : 'Liters per 100km'}</span>
              <input className="field" type="number" min="0" inputMode="decimal" step="0.1" value={consumption} onChange={(event) => setConsumption(event.target.value)} placeholder={consumptionMode === 'kmPerLiter' ? 'Example: 10' : 'Example: 9.5'} />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="panel animate-in overflow-hidden p-5">
            <p className="label">Estimated {viewPeriod} fuel cost</p>
            <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-4xl font-black leading-none text-navy dark:text-cyan">{currency(result.selectedCost)}</p>
                <p className="muted mt-2 text-sm">{result.selectedFuel.toFixed(1)} liters across {result.selectedDistance.toFixed(1)} km</p>
              </div>
              <select className="field sm:w-40" value={viewPeriod} onChange={(event) => setViewPeriod(event.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard title="Total distance" value={`${result.selectedDistance.toFixed(1)} km`} icon={Gauge} />
            <KpiCard title="Fuel used" value={`${result.selectedFuel.toFixed(1)} L`} icon={Fuel} tone="amber" />
            <KpiCard title="Fuel cost" value={currency(result.selectedCost)} icon={Calculator} tone="green" />
          </div>

          <div className="panel p-4">
            <h3 className="font-bold text-navy dark:text-slate-50">Time Breakdown</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {result.breakdown.map((row) => (
                <button key={row.period} className={`rounded-lg border p-3 text-left transition ${viewPeriod === row.period ? 'border-cyan bg-cyan/10' : 'border-line bg-slate-50 dark:border-slate-700 dark:bg-slate-950'}`} onClick={() => setViewPeriod(row.period)}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-bold capitalize text-navy dark:text-slate-50">{row.period}</p>
                    {row.period === 'yearly' ? <TrendingUp size={18} /> : <CalendarDays size={18} />}
                  </div>
                  <p className="muted text-sm">{row.distance.toFixed(1)} km</p>
                  <p className="muted text-sm">{row.fuel.toFixed(1)} L</p>
                  <p className="mt-2 text-lg font-bold text-navy dark:text-cyan">{currency(row.cost)}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
