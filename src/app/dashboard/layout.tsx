
import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto py-8">
          {children}
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              &copy; 2025 Dutch Oriental Purchase Order. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
