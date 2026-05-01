import { Pencil, Trash2 } from 'lucide-react';

export default function DataTable({ columns, rows, onEdit, onDelete, empty = 'No records yet.' }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => (
          <div key={row.id} className="panel p-3">
            <div className="grid gap-2">
              {columns.map((column) => (
                <div key={column.key} className="grid gap-1">
                  <span className="label">{column.label}</span>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{column.render ? column.render(row) : row[column.key]}</div>
                </div>
              ))}
            </div>
            {(onEdit || onDelete) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {onEdit && <button className="btn-secondary" onClick={() => onEdit(row)}><Pencil size={16} /> Edit</button>}
                {onDelete && <button className="btn-danger" onClick={() => onDelete(row.id)}><Trash2 size={16} /> Delete</button>}
              </div>
            )}
          </div>
        ))}
        {!rows.length && <div className="panel p-6 text-center text-sm text-slate-600 dark:text-slate-300">{empty}</div>}
      </div>

      <div className="panel hidden overflow-hidden lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            <tr>
              {columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}
              {(onEdit || onDelete) && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={row.id} className="bg-white dark:bg-nightPanel">
                {columns.map((column) => <td key={column.key} className="px-4 py-3">{column.render ? column.render(row) : row[column.key]}</td>)}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {onEdit && <button className="btn-secondary px-2" onClick={() => onEdit(row)} aria-label="Edit"><Pencil size={16} /></button>}
                      {onDelete && <button className="btn-danger px-2" onClick={() => onDelete(row.id)} aria-label="Delete"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && <tr><td className="px-4 py-8 text-center text-slate-600 dark:text-slate-300" colSpan={columns.length + 1}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
