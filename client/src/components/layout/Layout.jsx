import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} CivicSetu. Civic grievance management platform.
      </footer>
    </div>
  );
}
