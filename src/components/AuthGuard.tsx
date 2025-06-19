"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[]; // Optional: specify roles allowed for this route
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { currentUser, isLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.replace('/'); // Redirect to login page
      } else if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        router.replace('/dashboard?error=unauthorized'); // Or a dedicated unauthorized page
      }
    }
  }, [currentUser, isLoading, router, allowedRoles]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Helper type for pages that require authentication
export type AuthenticatedPageProps<P = {}> = P & {
  // You can add any props that authenticated pages might need from AuthGuard or layout
};
