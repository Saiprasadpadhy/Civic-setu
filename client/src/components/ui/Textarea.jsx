export function Textarea({
  label,
  error,
  helperText,
  rows = 4,
  className = '',
  id,
  ...props
}) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`
          block w-full rounded-xl border transition-colors duration-150 sm:text-sm p-3.5
          ${
            error
              ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
              : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 bg-white'
          }
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
