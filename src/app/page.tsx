
"use client";

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from '@/contexts/AppContext';
import { AppLogo } from '@/components/AppLogo';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { loginUserAction } from '@/actions/userActions';
import type { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, isLoading: contextIsLoading, currentUser: contextCurrentUser } = useAppContext();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!contextIsLoading && contextCurrentUser) {
      router.replace('/dashboard');
    }
  }, [contextIsLoading, contextCurrentUser, router]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await loginUserAction(username, password);
      if (user) {
        setCurrentUser(user); 
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}!`,
        });
        // Redirect is handled by the useEffect hook
      } else {
        // This case implies user was null, meaning username/password didn't match
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // This catch block handles errors thrown by loginUserAction (e.g., database connection issues)
      console.error("Login page error:", error);
      toast({
        title: "Login Error",
        description: (error as Error).message || "An unexpected error occurred. Please try again or check server logs.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (contextIsLoading && !contextCurrentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading Culinary Compass...</p>
      </div>
    );
  }
  
  if (!contextIsLoading && contextCurrentUser) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center">
          <AppLogo />
          <CardTitle className="font-headline pt-2 text-center text-3xl">Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
