import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { AlertTriangle, Bus, CircleDollarSign, Fuel, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from '../components/KpiCard.jsx';
import TripCapture from '../components/TripCapture.jsx';
import { currency, inMonth, inWeek, studentBalance, sum, todayKey } from '../lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function Dashboard({ app }) {
  const { data } = app;
  const today = todayKey();
  const dailyIncome = sum(data.trips.filter((trip) => trip.date === today), (trip) => trip.income) + sum(data.incomes.filter((income) => income.date === today), (income) => income.amount);
  const weeklyIncome = sum(data.trips.filter((trip) => inWeek(trip.date)), (trip) => trip.income) + sum(data.incomes.filter((income) => inWeek(income.date)), (income) => income.amount);
  const monthlyIncome = sum(data.trips.filter((trip) => inMonth(trip.date)), (trip) => trip.income) + sum(data.incomes.filter((income) => inMonth(income.date)), (income) => income.amount);
  const expenses = sum(data.expenses.filter((expense) => inMonth(expense.date)), (expense) => expense.amount);
  const todaysTrips = data.trips.filter((trip) => trip.date === today);
  const fuel = sum(todaysTrips, (trip) => trip.fuelCost);
  const unpaid = data.students.filter((student) => studentBalance(student, data.payments) > 0);
  const missingTrip = todaysTrips.length === 0;
  const highFuel = fuel > dailyIncome * 0.45 && fuel > 0;

  const days = useMemo(() => [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  }), []);

  const incomeChart = useMemo(() => ({
    labels: days.map((day) => day.slice(5)),
    datasets: [{ label: 'Income', data: days.map((day) => sum(data.trips.filter((trip) => trip.date === day), (trip) => trip.income)), borderColor: '#0f172a', backgroundColor: '#0f172a', tension: 0.35 }],
  }), [data.trips, days]);

  const categories = useMemo(() => [...new Set(data.expenses.map((expense) => expense.category))], [data.expenses]);
  const expenseChart = useMemo(() => ({
    labels: categories,
    datasets: [{ label: 'Expenses', data: categories.map((category) => sum(data.expenses.filter((expense) => expense.category === category), (expense) => expense.amount)), backgroundColor: '#64748b' }],
  }), [categories, data.expenses]);

  const chartOptions = useMemo(() => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10 } } } }), []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-slate-50">Operations Dashboard</h1>
          <p className="muted text-sm">Today's school transport snapshot.</p>
        </div>
        <Link className="btn-primary" to="/trips">Quick Add Trip</Link>
      </div>

      <TripCapture app={app} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard title="Daily income" amount={dailyIncome} format={currency} icon={CircleDollarSign} tone="green" emphasis />
        <KpiCard title="Weekly income" amount={weeklyIncome} format={currency} icon={TrendingUp} />
        <KpiCard title="Monthly income" amount={monthlyIncome} format={currency} icon={TrendingUp} />
        <KpiCard title="Total expenses" amount={expenses} format={currency} icon={CircleDollarSign} tone="red" emphasis />
        <KpiCard title="Net profit" amount={monthlyIncome - expenses} format={currency} icon={TrendingUp} tone={monthlyIncome - expenses >= 0 ? 'green' : 'red'} emphasis />
        <KpiCard title="Active students" amount={data.students.length} icon={Users} />
        <KpiCard title="Trips today" amount={todaysTrips.length} icon={Bus} />
        <KpiCard title="Fuel estimate" amount={fuel} format={currency} icon={Fuel} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="panel p-4 xl:col-span-3">
          <h2 className="mb-3 text-xl font-bold text-navy dark:text-slate-50">Income over time</h2>
          <Line data={incomeChart} options={chartOptions} height={260} />
        </div>
        <div className="panel p-4 xl:col-span-2">
          <h2 className="mb-3 text-xl font-bold text-navy dark:text-slate-50">Expense categories</h2>
          <Bar data={expenseChart} options={chartOptions} height={260} />
        </div>
      </div>

      <div className="panel p-4">
        <h2 className="mb-3 text-xl font-bold text-navy dark:text-slate-50">Alerts</h2>
        <div className="grid gap-2">
          {missingTrip && <Alert text="No trip has been captured for today." />}
          {!!unpaid.length && <Alert text={`${unpaid.length} student payments are outstanding.`} />}
          {highFuel && <Alert text="Fuel estimate is high compared with today's income." />}
          {!missingTrip && !unpaid.length && !highFuel && <p className="muted text-sm">No alerts right now.</p>}
        </div>
      </div>
    </div>
  );
}

function Alert({ text }) {
  return <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-danger dark:bg-red-950 dark:text-red-200"><AlertTriangle size={16} /> {text}</div>;
}
