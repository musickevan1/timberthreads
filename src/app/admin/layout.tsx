'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin';

  // Don't show the admin header on the login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative w-8 h-8">
                <Image
                  src="/assets/gallery/logo.png"
                  alt="Timber & Threads Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl font-serif text-stone-800">
                Timber & Threads Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-sm text-stone-600 hover:text-teal-700 transition-colors"
              >
                View Website
              </Link>
              <button
                onClick={() => {
                  sessionStorage.removeItem('isAuthenticated');
                  window.location.href = '/admin';
                }}
                className="text-sm text-stone-600 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/admin/gallery"
              className={`inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium border-b-2 ${
                pathname.includes('/admin/gallery')
                  ? 'border-teal-600 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              Gallery Management
            </Link>
            {/* Add more admin navigation links here as needed */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>

      {/* Footer removed to prevent it from covering gallery options */}
    </div>
  );
}
