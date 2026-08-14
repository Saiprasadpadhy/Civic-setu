export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-slate-200 text-left text-sm ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return <thead className={`bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold ${className}`}>{children}</thead>;
}

export function TableBody({ children, className = '' }) {
  return <tbody className={`divide-y divide-slate-100 bg-white text-slate-700 ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = '', hover = true, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`
        transition-colors duration-150
        ${hover ? 'hover:bg-slate-50/80 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', header = false }) {
  const Component = header ? 'th' : 'td';
  return <Component className={`px-5 py-3.5 whitespace-nowrap ${className}`}>{children}</Component>;
}
