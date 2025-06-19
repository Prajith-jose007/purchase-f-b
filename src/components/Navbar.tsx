
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAppContext } from '@/contexts/AppContext';
import { AppLogo } from '@/components/AppLogo';
import { Home, ListOrdered, ShoppingCart, Users, LogOut, PackageSearch, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { currentUser, currentBranch, setCurrentUser, setCurrentBranch: setAppContextBranch } = useAppContext();
  const router = useRouter();

  const handleLogout = () => {
    setCurrentUser(null);
    setAppContextBranch(null); 
    router.push('/');
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <AppLogo />
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
          {currentUser?.role === 'employee' && ( // Only employees can create new orders from navbar
            <Button variant="ghost" asChild>
              <Link href="/dashboard/orders/new" className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" /> New Order
              </Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            {/* Link to 'My Orders' (own orders for employee, own created if PM, or all if PM with ?view=all) */}
            <Link href="/dashboard/orders" className="flex items-center gap-1">
              <ListOrdered className="h-4 w-4" /> Orders
            </Link>
          </Button>
          {currentUser?.role === 'purchase_manager' && (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/inventory" className="flex items-center gap-1">
                  <PackageSearch className="h-4 w-4" /> Inventory
                </Link>
              </Button>
              {/* Add link to all orders for PM if desired, or rely on dashboard card */}
               <Button variant="ghost" asChild>
                <Link href="/dashboard/orders?view=all" className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> All Orders
                </Link>
              </Button>
            </>
          )}
        </nav>
        
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </p>
                  {currentBranch && currentUser.role !== 'purchase_manager' && (
                    <p className="text-xs leading-none text-muted-foreground">{currentBranch.name}</p>
                  )}
                  {currentUser.role === 'purchase_manager' && (
                     <p className="text-xs leading-none text-muted-foreground">(All Stores Access)</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
