export default function Input({
  label,
  id,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-civic-500 focus:outline-none focus:ring-1 focus:ring-civic-500 disabled:bg-gray-100 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
