
"use client";

import type { Item } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Package, Tag } from 'lucide-react';

interface InventoryItemCardProps {
  item: Item;
  onAddItemToOrder: (item: Item, quantity: number) => void;
}

export default function InventoryItemCard({ item, onAddItemToOrder }: InventoryItemCardProps) {
  const [quantity, setQuantity] = useState<number>(0); // Changed default to 0

  const handleAdd = () => {
    if (quantity > 0) {
      onAddItemToOrder(item, quantity);
      setQuantity(0); // Reset quantity to 0 after adding
    }
  };
  
  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl leading-tight">{item.description}</CardTitle>
          {item.remark && (
            <Badge variant={item.remark.toLowerCase() === 'new' ? 'default' : 'secondary'} className="ml-2 shrink-0">
              {item.remark}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground">CODE: {item.code}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1"><Package size={14}/> {item.category}</span>
          <span className="flex items-center gap-1"><Tag size={14}/> {item.type}</span>
        </div>
        <p>Unit: <span className="font-medium">{item.units}</span></p>        
        <p>Packing: <span className="font-medium">{item.packing} {item.units}</span></p>
      </CardContent>
      <CardFooter className="flex items-end gap-2 pt-4">
        <div className="flex-grow">
          <Label htmlFor={`quantity-${item.code}`} className="sr-only">Quantity</Label>
          <Input
            id={`quantity-${item.code}`}
            type="number"
            min="0" // Changed min to 0
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
            className="w-full h-9 text-center"
            aria-label={`Quantity for ${item.description}`}
          />
        </div>
        <Button onClick={handleAdd} size="sm" className="h-9" disabled={quantity <= 0}>Add to Order</Button> 
      </CardFooter>
    </Card>
  );
}
