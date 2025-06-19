
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from '@/contexts/AppContext';
import { ShoppingCart, ListOrdered, PackageSearch, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { currentUser, currentBranch } = useAppContext();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setError("You are not authorized to access the previous page.");
    }
  }, [searchParams]);

  if (!currentUser) { 
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <p className="text-muted-foreground">Loading user data or redirecting...</p>
            <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
        </div>
    );
  }

  if (currentUser.role !== 'purchase_manager' && !currentBranch) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <h1 className="font-headline text-2xl text-destructive">Error</h1>
            <p className="text-muted-foreground">Branch information is missing for your account. Please contact support or try logging in again.</p>
            <Link href="/" passHref>
                <Button variant="link" className="mt-4">Go to Login</Button>
            </Link>
        </div>
    );
  }

  const greeting = `Welcome back, ${currentUser.name}!`;
  const branchInfo = currentUser.role === 'purchase_manager'
    ? "You have access to manage orders and inventory for all stores."
    : `You are currently managing orders for ${currentBranch!.name}.`;

  return (
    <div className="space-y-8 flex flex-col items-center">
      {error && (
         <Alert variant="destructive" className="mb-6 w-full max-w-3xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authorization Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="shadow-lg w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="font-headline text-4xl text-primary">{greeting}</CardTitle>
          <CardDescription className="text-lg">{branchInfo}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">What would you like to do today?</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
        {currentUser.role === 'employee' && (
          <> 
            <ActionCard
              title="Create New Order"
              description="Browse inventory and place a new purchase order."
              href="/dashboard/orders/new"
              icon={<ShoppingCart className="h-10 w-10 text-primary" />}
            />
            <ActionCard
              title="View My Orders"
              description="Track the status of your existing orders."
              href="/dashboard/orders"
              icon={<ListOrdered className="h-10 w-10 text-primary" />}
            />
          </>
        )}
        
        {currentUser.role === 'purchase_manager' && (
          <>
             {/* Purchase manager no longer sees "Create New Order" here */}
            <ActionCard
              title="View My Created Orders"
              description="Track status of orders you (or others in your role) might have created if policies change."
              href="/dashboard/orders" 
              icon={<ListOrdered className="h-10 w-10 text-primary" />}
            />
            <ActionCard
              title="Manage All Orders"
              description="View and manage all orders, and upload invoices."
              href="/dashboard/orders?view=all"
              icon={<Users className="h-10 w-10 text-accent" />}
            />
            <ActionCard
              title="Manage Inventory"
              description="View and update the master inventory list."
              href="/dashboard/inventory"
              icon={<PackageSearch className="h-10 w-10 text-accent" />}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function ActionCard({ title, description, href, icon }: ActionCardProps) {
  return (
    <Link href={href} passHref className="block w-full max-w-xs">
      <Card className="hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
          {icon}
          <CardTitle className="font-headline text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
        <CardContent className="pt-0">
           <Button variant="link" className="p-0 text-primary">Go to {title.toLowerCase()} &rarr;</Button>
        </CardContent>
      </Card>
    </Link>
  );
}
