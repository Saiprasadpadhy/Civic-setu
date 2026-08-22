import { Navbar } from './Navbar';

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="w-full px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CivicSetu. Built for transparent, evidence-grounded civic governance.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacy</span>
            <span>Terms</span>
            <span>API Status: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
