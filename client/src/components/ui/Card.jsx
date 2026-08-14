export function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-200
        ${glass ? 'glass-panel shadow-glass' : 'bg-white border border-slate-200/80 shadow-sm'}
        ${hover ? 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`p-6 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-slate-900 font-display">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-4 sm:px-6 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
