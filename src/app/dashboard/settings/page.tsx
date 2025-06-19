"use client";

import AuthGuard from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';

function SettingsPageContent() {
  const { currentUser, currentBranch } = useAppContext();
  const { toast } = useToast();
  const [name, setName] = useState(currentUser?.name || '');
  const [enableNotifications, setEnableNotifications] = useState(false);
  
  // Effect to update local state if context changes (e.g. after login)
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  const handleSaveChanges = () => {
    // In a real app, this would call an API to save changes
    // For now, we'll just show a toast
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated (simulated).",
    });
  };

  if (!currentUser || !currentBranch) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="font-headline text-4xl text-primary">Settings</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">User Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email (Role)</Label>
            <Input id="email" value={`${currentUser.id}@example.com (Read-only)`} disabled />
            <p className="text-xs text-muted-foreground">Your role is: {currentUser.role.replace('_', ' ')}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" value={currentBranch.name} disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Notifications</CardTitle>
          <CardDescription>Configure your notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="notifications-switch" 
              checked={enableNotifications}
              onCheckedChange={setEnableNotifications}
            />
            <Label htmlFor="notifications-switch">Enable Email Notifications</Label>
          </div>
           <p className="text-xs text-muted-foreground">
            Receive updates on order status changes and important announcements. (Feature not implemented)
          </p>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsPageContent />
    </AuthGuard>
  );
}
