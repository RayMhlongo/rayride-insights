import { Pencil, Trash2 } from 'lucide-react';

export default function DataTable({ columns, rows, onEdit, onDelete, empty = 'No records yet.' }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}
              {(onEdit || onDelete) && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="bg-white">
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
            {!rows.length && <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length + 1}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
