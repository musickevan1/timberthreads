'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePasswordLogin = () => {
    if (password === 'timberandthreads2024') {
      sessionStorage.setItem('isAuthenticated', 'true');
      router.push('/admin/gallery');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  // For development/testing only
  const handleTestLogin = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    router.push('/admin/gallery');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <Image
              src="/assets/logo.png"
              alt="Timber & Threads Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        
        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordLogin();
                }
              }}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handlePasswordLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Sign in
            </button>
            
            <Link 
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Back to Home
            </Link>
            
            {/* Development/testing button - remove in production */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2 text-center">Development/Testing Only</p>
              <button
                type="button"
                onClick={handleTestLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none"
              >
                Test Login (Bypass Password)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
