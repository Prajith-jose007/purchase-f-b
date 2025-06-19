
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import type { Item, OrderItem, Branch } from '@/types';
import InventoryItemCard from '@/components/InventoryItemCard';
import OrderCart from '@/components/OrderCart';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import AuthGuard from '@/components/AuthGuard';
import { Search, Filter, XCircle, Store, Loader2, PackageSearch } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

const ALL_TYPES_VALUE = "all-types-placeholder";
const ALL_CATEGORIES_VALUE = "all-categories-placeholder";

function CreateOrderPageContent() {
  const { inventory, currentUser, branches, addOrder, fetchApiData } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const loadTypes = async () => {
      setIsLoadingTypes(true);
      try {
        const data = await fetchApiData<{ types: string[] }>('/api/app-data/item-types');
        setItemTypes(data.types || []);
      } catch (error) {
        console.error("Error fetching item types:", error);
        toast({ title: "Error", description: "Could not load item types for filtering.", variant: "destructive" });
        setItemTypes([]);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    loadTypes();
  }, [fetchApiData, toast]);

  const handleTypeChange = async (value: string) => {
    const newType = value === ALL_TYPES_VALUE ? "" : value;
    setSelectedType(newType);
    setSelectedCategory(""); 
    if (newType) {
      setIsLoadingCategories(true);
      try {
        const data = await fetchApiData<{ categories: string[] }>(`/api/app-data/item-categories?type=${newType}`);
        setItemCategories(data.categories || []);
      } catch (error) {
        console.error("Error fetching item categories for type:", newType, error);
        toast({ title: "Error", description: `Could not load categories for type ${newType}.`, variant: "destructive" });
        setItemCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    } else {
      setItemCategories([]); 
    }
  };

  const handleAddItemToOrder = (item: Item, quantity: number) => {
    setCurrentOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(oi => oi.item.code === item.code);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      }
      return [...prevItems, { item, quantity, item_code: item.code }];
    });
    toast({ title: "Item Added", description: `${item.description} added to your order.` });
  };

  const handleRemoveItem = (itemCode: string) => {
    setCurrentOrderItems(prevItems => prevItems.filter(oi => oi.item.code !== itemCode));
    toast({ title: "Item Removed", description: `Item removed from your order.`, variant: "destructive" });
  };

  const handleUpdateQuantity = (itemCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemCode);
      return;
    }
    setCurrentOrderItems(prevItems =>
      prevItems.map(oi => oi.item.code === itemCode ? { ...oi, quantity: newQuantity } : oi)
    );
  };

  const handleSubmitOrder = async () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not identified. Please login again.", variant: "destructive" });
      return;
    }
    if (!selectedBranchId) {
      toast({ title: "Error", description: "Please select a store for the order.", variant: "destructive" });
      return;
    }
    if (currentOrderItems.length === 0) {
      toast({ title: "Empty Order", description: "Please add items to your order before submitting.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderDataForAdd = {
        branchId: selectedBranchId,
        userId: currentUser.id,
        items: currentOrderItems,
      };
      const createdOrder = await addOrder(orderDataForAdd);
      toast({ title: "Order Submitted!", description: `Your order #${createdOrder.id.slice(-6)} has been placed for ${branches.find(b=>b.id === selectedBranchId)?.name}.` });
      setCurrentOrderItems([]);
      setSelectedBranchId(''); 
      router.push(`/dashboard/orders/${createdOrder.id}`);
    } catch (error) {
      console.error("Order submission error:", error);
      toast({ title: "Submission Failed", description: (error as Error).message || "There was an error submitting your order.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType && selectedType !== ALL_TYPES_VALUE ? item.type === selectedType : true;
      const matchesCategory = selectedCategory && selectedCategory !== ALL_CATEGORIES_VALUE ? item.category === selectedCategory : true;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [inventory, searchTerm, selectedType, selectedCategory]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedCategory('');
    setItemCategories([]); // Clear categories as type is reset
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="font-headline text-4xl mb-8 text-primary">Create New Order</h1>

      <div className="mb-6 p-6 bg-card border rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-1">
             <Label htmlFor="store-select" className="block text-sm font-medium text-muted-foreground mb-1">
              Select Store
            </Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger id="store-select" className="w-full">
                <SelectValue placeholder="Choose a store" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch: Branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-1">
            <Label htmlFor="search-inventory" className="block text-sm font-medium text-muted-foreground mb-1">
              Search Items (Name or Code)
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search-inventory"
                type="text"
                placeholder="E.g., Apple, 101..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="type-filter" className="block text-sm font-medium text-muted-foreground mb-1">
              Filter by Type {isLoadingTypes && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
            </Label>
            <Select
              value={selectedType || ALL_TYPES_VALUE}
              onValueChange={handleTypeChange}
              disabled={isLoadingTypes}
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPES_VALUE}>All Types</SelectItem>
                {itemTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category-filter" className="block text-sm font-medium text-muted-foreground mb-1">
              Filter by Category {isLoadingCategories && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
            </Label>
            <Select
              value={selectedCategory || ALL_CATEGORIES_VALUE}
              onValueChange={(val) => setSelectedCategory(val === ALL_CATEGORIES_VALUE ? "" : val)}
              disabled={isLoadingCategories || !selectedType || selectedType === ALL_TYPES_VALUE || itemCategories.length === 0}
            >
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
                {itemCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {((searchTerm || (selectedType && selectedType !== ALL_TYPES_VALUE) || (selectedCategory && selectedCategory !== ALL_CATEGORIES_VALUE))) && (
             <Button onClick={clearFilters} variant="ghost" className="lg:col-start-4 text-sm text-muted-foreground">
              <XCircle className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-headline text-3xl mb-6 flex items-center">
            Inventory Items
            {selectedBranchId && (
              <span className="ml-2 text-lg text-muted-foreground font-normal flex items-center">
                <Store className="mr-1.5 h-5 w-5" /> for {branches.find(b => b.id === selectedBranchId)?.name}
              </span>
            )}
          </h2>
          {filteredInventory.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-24rem)] pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredInventory.map(item => (
                  <InventoryItemCard key={item.code} item={item} onAddItemToOrder={handleAddItemToOrder} />
                ))}
              </div>
            </ScrollArea>
          ) : (
             inventory.length === 0 && !searchTerm && (!selectedType || selectedType === ALL_TYPES_VALUE) && (!selectedCategory || selectedCategory === ALL_CATEGORIES_VALUE) ?
             (
                <div className="text-center py-10 bg-card rounded-lg shadow">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold">Inventory is empty.</p>
                    <p className="text-muted-foreground">Please upload an inventory CSV to see items here.</p>
                </div>
             ) :
            (<div className="text-center py-10 bg-card rounded-lg shadow">
              <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold">No items match your criteria.</p>
              <p className="text-muted-foreground">Try adjusting your search or filters, or ensure a store is selected.</p>
            </div>)
          )}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <OrderCart
            orderItems={currentOrderItems}
            onRemoveItem={handleRemoveItem}
            onUpdateQuantity={handleUpdateQuantity}
            onSubmitOrder={handleSubmitOrder}
            isSubmitting={isSubmitting}
            selectedBranchName={selectedBranchId ? branches.find(b=>b.id === selectedBranchId)?.name : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <AuthGuard allowedRoles={['employee', 'purchase_manager']}>
      <CreateOrderPageContent />
    </AuthGuard>
  );
}
