'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Twitter, LogOut } from 'lucide-react';

export function SignInButton() {
  return (
    <div className="space-y-3">
      <Button
        onClick={() => signIn('demo')}
        className="w-full"
        size="lg"
        variant="default"
      >
        Demo Login (Local Testing)
      </Button>
      
      <Button
        onClick={() => signIn('twitter')}
        className="w-full"
        size="lg"
        variant="outline"
      >
        <Twitter className="h-5 w-5 mr-2" />
        Sign in with Twitter
      </Button>
    </div>
  );
}

export function SignOutButton({ userName }: { userName?: string | null }) {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-600">
        Welcome, {userName}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut()}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}