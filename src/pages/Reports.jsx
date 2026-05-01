import { jsPDF } from 'jspdf';
import PageHeader from '../components/PageHeader.jsx';
import { currency, downloadCsv, inMonth, inWeek, sum, todayKey } from '../lib/utils';

export default function Reports({ app }) {
  const { data } = app;
  const today = todayKey();
  const dailyTrips = data.trips.filter((trip) => trip.date === today);
  const weeklyTrips = data.trips.filter((trip) => inWeek(trip.date));
  const monthlyTrips = data.trips.filter((trip) => inMonth(trip.date));
  const routeProfit = data.routes.map((route) => {
    const trips = data.trips.filter((trip) => trip.routeId === route.id);
    return { route: route.name, income: sum(trips, (trip) => trip.income), fuel: sum(trips, (trip) => trip.fuelCost), trips: trips.length };
  });
  const driverPerformance = data.vehicles.map((vehicle) => {
    const trips = data.trips.filter((trip) => trip.vehicleId === vehicle.id);
    return { driver: vehicle.assignedDriver || vehicle.registration, trips: trips.length, income: sum(trips, (trip) => trip.income) };
  });

  const exportPdf = (title, lines) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    lines.forEach((line, index) => doc.text(line, 14, 30 + index * 8));
    doc.save(`${title.toLowerCase().replaceAll(' ', '-')}.pdf`);
  };

  const dailyLines = [
    `Trips completed: ${dailyTrips.length}`,
    `Income: ${currency(sum(dailyTrips, (trip) => trip.income))}`,
    `Fuel estimate: ${currency(sum(dailyTrips, (trip) => trip.fuelCost))}`,
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Daily, weekly, monthly, driver, and route summaries." />
      <div className="grid gap-4 lg:grid-cols-3">
        <ReportCard title="Daily report" lines={dailyLines} onPdf={() => exportPdf('Daily Report', dailyLines)} onCsv={() => exportTrips('daily-report.csv', dailyTrips, data)} />
        <ReportCard title="Weekly report" lines={[`Trips: ${weeklyTrips.length}`, `Income: ${currency(sum(weeklyTrips, (trip) => trip.income))}`]} onPdf={() => exportPdf('Weekly Report', [`Trips: ${weeklyTrips.length}`, `Income: ${currency(sum(weeklyTrips, (trip) => trip.income))}`])} onCsv={() => exportTrips('weekly-report.csv', weeklyTrips, data)} />
        <ReportCard title="Monthly report" lines={[`Trips: ${monthlyTrips.length}`, `Income: ${currency(sum(monthlyTrips, (trip) => trip.income))}`, `Expenses: ${currency(sum(data.expenses.filter((expense) => inMonth(expense.date)), (expense) => expense.amount))}`]} onPdf={() => exportPdf('Monthly Report', [`Trips: ${monthlyTrips.length}`, `Income: ${currency(sum(monthlyTrips, (trip) => trip.income))}`])} onCsv={() => exportTrips('monthly-report.csv', monthlyTrips, data)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4"><h3 className="mb-3 font-bold text-navy">Driver performance</h3>{driverPerformance.map((row) => <p key={row.driver} className="border-b border-line py-2 text-sm">{row.driver}: {row.trips} trips, {currency(row.income)}</p>)}</div>
        <div className="panel p-4"><h3 className="mb-3 font-bold text-navy">Route profitability</h3>{routeProfit.map((row) => <p key={row.route} className="border-b border-line py-2 text-sm">{row.route}: {currency(row.income - row.fuel)} net across {row.trips} trips</p>)}</div>
      </div>
    </div>
  );
}

function ReportCard({ title, lines, onPdf, onCsv }) {
  return (
    <div className="panel p-4">
      <h3 className="font-bold text-navy">{title}</h3>
      <div className="my-3 space-y-1 text-sm text-slate-600">{lines.map((line) => <p key={line}>{line}</p>)}</div>
      <div className="flex gap-2"><button className="btn-primary" onClick={onPdf}>PDF</button><button className="btn-secondary" onClick={onCsv}>CSV</button></div>
    </div>
  );
}

function exportTrips(filename, trips, data) {
  downloadCsv(filename, [
    ['Date', 'Time', 'Route', 'Vehicle', 'Driver', 'Students', 'Income', 'Fuel'],
    ...trips.map((trip) => [trip.date, trip.time, data.routes.find((route) => route.id === trip.routeId)?.name, data.vehicles.find((vehicle) => vehicle.id === trip.vehicleId)?.registration, trip.driver, trip.studentsOnboard, trip.income, trip.fuelCost]),
  ]);
}
