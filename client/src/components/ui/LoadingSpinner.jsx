import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', text, className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
      {text && <p className="mt-3 text-sm font-medium text-slate-600">{text}</p>}
    </div>
  );
}

export function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-xl bg-slate-200/80 mb-2 last:mb-0 ${className}`}
        />
      ))}
    </>
  );
}
