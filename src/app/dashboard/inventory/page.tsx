
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import FileUpload from '@/components/FileUpload';
import InventoryTable from '@/components/InventoryTable';
import { parseInventoryCSV } from '@/lib/data'; // parseInventoryCSV is still from data.ts
import type { Item } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

function InventoryPageContent() {
  const { inventory, setInventory, isLoading, refreshContext } = useAppContext();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInventoryUpload = async (csvString: string, fileName: string) => {
    setIsProcessing(true);
    try {
      const newItems = parseInventoryCSV(csvString); // This is synchronous parsing
      if (newItems.length > 0) {
        await setInventory(newItems); // This now calls dbUpdateFullInventory (async)
        toast({ title: "Inventory Updated", description: `${fileName} processed and inventory has been updated with ${newItems.length} items.` });
        await refreshContext(); // Refresh full context to ensure all components have latest data
      } else {
        toast({ title: "Empty or Invalid CSV", description: "The uploaded CSV file is empty or could not be parsed correctly.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error processing CSV and updating DB:", error);
      toast({ title: "Inventory Update Error", description: "There was an error processing the CSV or updating the database.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading && !isProcessing) { // Show main loader if context is loading and not during CSV processing
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl flex flex-col items-center">
      <h1 className="font-headline text-4xl text-primary self-start">Manage Inventory</h1>
      
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Upload New Inventory CSV</CardTitle>
          <CardDescription>
            Upload a CSV file to update the master inventory list. This will replace the current inventory in the database.
            The CSV should have columns: CODE, REMARK, TYPE, CATEGORY, DESCRIPTION, UNITS, PACKING.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center p-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-xl font-semibold">Processing CSV and updating database...</p>
            </div>
          ) : (
            <FileUpload 
              onFileUpload={handleInventoryUpload} 
              acceptedFileType=".csv"
              labelText="Choose Inventory CSV File"
              buttonText="Update Inventory in Database"
            />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Current Inventory List (from Database)</CardTitle>
           <CardDescription>
            Browse and search through all items currently in the inventory from the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {inventory.length > 0 ? (
            <InventoryTable items={inventory} />
          ) : (
             <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-xl font-semibold">Inventory is currently empty.</p>
                <p className="text-muted-foreground">Please upload an inventory CSV file to populate the list in the database.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <AuthGuard allowedRoles={['purchase_manager']}>
      <InventoryPageContent />
    </AuthGuard>
  );
}
