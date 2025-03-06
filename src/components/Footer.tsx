'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-100 py-8 mt-auto border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-sm text-gray-500">
            © {currentYear} Timber & Threads Retreat. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <Link 
              href="/admin"
              className="hover:text-gray-600 transition-colors duration-200"
            >
              Admin
            </Link>
            <span>•</span>
            <a 
              href="mailto:timberandthreads24@gmail.com"
              className="hover:text-gray-600 transition-colors duration-200"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
