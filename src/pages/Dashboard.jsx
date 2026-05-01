import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { AlertTriangle, Bus, CircleDollarSign, Fuel, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from '../components/KpiCard.jsx';
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

  const categories = [...new Set(data.expenses.map((expense) => expense.category))];
  const expenseChart = useMemo(() => ({
    labels: categories,
    datasets: [{ label: 'Expenses', data: categories.map((category) => sum(data.expenses.filter((expense) => expense.category === category), (expense) => expense.amount)), backgroundColor: '#64748b' }],
  }), [categories, data.expenses]);

  const chartOptions = useMemo(() => ({ responsive: true, maintainAspectRatio: false }), []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-navy">Dashboard</h2>
          <p className="text-sm text-slate-500">Today's school transport snapshot.</p>
        </div>
        <Link className="btn-primary" to="/trips">Quick Add Trip</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Daily income" value={currency(dailyIncome)} icon={CircleDollarSign} tone="green" />
        <KpiCard title="Weekly income" value={currency(weeklyIncome)} icon={TrendingUp} />
        <KpiCard title="Monthly income" value={currency(monthlyIncome)} icon={TrendingUp} />
        <KpiCard title="Total expenses" value={currency(expenses)} icon={CircleDollarSign} tone="red" />
        <KpiCard title="Net profit" value={currency(monthlyIncome - expenses)} icon={TrendingUp} tone={monthlyIncome - expenses >= 0 ? 'green' : 'red'} />
        <KpiCard title="Active students" value={data.students.length} icon={Users} />
        <KpiCard title="Trips today" value={todaysTrips.length} icon={Bus} />
        <KpiCard title="Fuel estimate" value={currency(fuel)} icon={Fuel} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="panel p-4 xl:col-span-3">
          <h3 className="mb-3 font-bold text-navy">Income over time</h3>
          <Line data={incomeChart} options={chartOptions} height={260} />
        </div>
        <div className="panel p-4 xl:col-span-2">
          <h3 className="mb-3 font-bold text-navy">Expense categories</h3>
          <Bar data={expenseChart} options={chartOptions} height={260} />
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="mb-3 font-bold text-navy">Alerts</h3>
        <div className="grid gap-2">
          {missingTrip && <Alert text="No trip has been captured for today." />}
          {!!unpaid.length && <Alert text={`${unpaid.length} student payments are outstanding.`} />}
          {highFuel && <Alert text="Fuel estimate is high compared with today's income." />}
          {!missingTrip && !unpaid.length && !highFuel && <p className="text-sm text-slate-500">No alerts right now.</p>}
        </div>
      </div>
    </div>
  );
}

function Alert({ text }) {
  return <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger"><AlertTriangle size={16} /> {text}</div>;
}
