'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthCallbackError':
        return {
          title: 'Twitter Rate Limit Exceeded',
          message: 'Twitter is temporarily limiting authentication requests. Please try again in 15 minutes.',
          suggestion: 'You can use the Demo User login to test the app in the meantime.',
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'There was a problem signing you in.',
          suggestion: 'Please try again or use the Demo User login.',
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 mb-4">
            {errorInfo.message}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {errorInfo.suggestion}
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/" className="w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Try Demo User Login
            </Button>
          </Link>
          
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>

        {error === 'OAuthCallbackError' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Twitter API Rate Limits
            </h3>
            <p className="text-sm text-yellow-700">
              Twitter limits authentication requests to prevent abuse. 
              Rate limits typically reset every 15 minutes. 
              You can continue using the app with the Demo User login.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}