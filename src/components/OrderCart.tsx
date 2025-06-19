
"use client";

import type { OrderItem, Item } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingBag, Store } from 'lucide-react';

interface OrderCartProps {
  orderItems: OrderItem[];
  onRemoveItem: (itemCode: string) => void;
  onUpdateQuantity: (itemCode: string, newQuantity: number) => void;
  onSubmitOrder: () => void;
  isSubmitting?: boolean;
  selectedBranchName?: string;
}

export default function OrderCart({ 
  orderItems, 
  onRemoveItem, 
  onUpdateQuantity, 
  onSubmitOrder, 
  isSubmitting = false,
  selectedBranchName 
}: OrderCartProps) {
  const totalItems = orderItems.reduce((sum, current) => sum + current.quantity, 0);
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-primary" />
          Current Order
        </CardTitle>
        {selectedBranchName && (
          <CardDescription className="flex items-center text-sm">
             <Store className="mr-1.5 h-4 w-4 text-muted-foreground" /> For: {selectedBranchName}
          </CardDescription>
        )}
        <CardDescription>
          {totalItems > 0 ? `You have ${totalItems} item(s) in your order.` : 'Your order is empty.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orderItems.length > 0 ? (
          <ScrollArea className="h-[350px] pr-4"> {/* Adjusted height slightly */}
            <ul className="space-y-4">
              {orderItems.map(({ item, quantity }) => (
                <li key={item.code} className="flex items-center gap-4 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex-grow">
                    <p className="font-semibold">{item.description}</p>
                    <p className="text-sm text-muted-foreground">Unit: {item.units} | Code: {item.code}</p>
                  </div>
                  <Input
                    type="number"
                    min="0" // Changed min to 0
                    value={quantity}
                    onChange={(e) => onUpdateQuantity(item.code, parseInt(e.target.value, 10))}
                    className="w-20 h-9 text-center"
                    aria-label={`Quantity for ${item.description}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.code)} aria-label={`Remove ${item.description}`}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {selectedBranchName ? "Add items from the inventory to start your order." : "Please select a store first."}
          </p>
        )}
      </CardContent>
      {orderItems.length > 0 && (
        <CardContent className="border-t pt-6">
            <Button 
              onClick={onSubmitOrder} 
              className="w-full" 
              size="lg"
              disabled={isSubmitting || orderItems.length === 0 || !selectedBranchName}
            >
              {isSubmitting ? "Submitting..." : "Submit Order"}
            </Button>
        </CardContent>
      )}
    </Card>
  );
}
