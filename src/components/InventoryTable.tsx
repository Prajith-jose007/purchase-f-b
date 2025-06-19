
"use client";

import type { Item } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from 'react';
import { PackageSearch, Filter, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useAppContext } from '@/contexts/AppContext';

const ALL_TYPES_VALUE = "all-types-placeholder";
const ALL_CATEGORIES_VALUE = "all-categories-placeholder";

interface InventoryTableProps {
  items: Item[];
}

export default function InventoryTable({ items }: InventoryTableProps) {
  const { fetchApiData } = useAppContext(); // Using fetchApiData from context
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

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
        console.error("Error fetching item types for inventory table:", error);
        // Not showing toast here to avoid clutter, but error is logged.
        setItemTypes([]);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    if (fetchApiData) { // Ensure fetchApiData is available
        loadTypes();
    }
  }, [fetchApiData]);

  const handleTypeFilterChange = async (value: string) => {
    const newType = value === ALL_TYPES_VALUE ? "" : value;
    setTypeFilter(newType);
    setCategoryFilter(""); 
    if (newType && fetchApiData) {
      setIsLoadingCategories(true);
      try {
        const data = await fetchApiData<{ categories: string[] }>(`/api/app-data/item-categories?type=${newType}`);
        setItemCategories(data.categories || []);
      } catch (error) {
        console.error("Error fetching item categories for inventory table:", newType, error);
        setItemCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    } else {
      setItemCategories([]);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter && typeFilter !== ALL_TYPES_VALUE ? item.type === typeFilter : true;
      const matchesCategory = categoryFilter && categoryFilter !== ALL_CATEGORIES_VALUE ? item.category === categoryFilter : true;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [items, searchTerm, typeFilter, categoryFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setCategoryFilter('');
    setItemCategories([]); // Clear categories as type is reset
  };

  if (items.length === 0 && !searchTerm && (typeFilter === '' || typeFilter === ALL_TYPES_VALUE) && (categoryFilter === '' || categoryFilter === ALL_CATEGORIES_VALUE)) {
     return (
      <div className="text-center py-10 bg-card rounded-lg shadow">
        <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="font-headline text-2xl text-primary">Inventory is Empty</h2>
        <p className="text-lg text-muted-foreground mt-2">No items found. Try uploading an inventory CSV.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-card border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search-inventory-table" className="block text-sm font-medium text-muted-foreground mb-1">
              Search (Name or Code)
            </label>
            <Input
              id="search-inventory-table"
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="type-filter-table" className="block text-sm font-medium text-muted-foreground mb-1">
              Type {isLoadingTypes && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
            </label>
            <Select
              value={typeFilter || ALL_TYPES_VALUE}
              onValueChange={handleTypeFilterChange}
              disabled={isLoadingTypes}
            >
              <SelectTrigger id="type-filter-table">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPES_VALUE}>All Types</SelectItem>
                {itemTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="category-filter-table" className="block text-sm font-medium text-muted-foreground mb-1">
              Category {isLoadingCategories && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
            </label>
            <Select
              value={categoryFilter || ALL_CATEGORIES_VALUE}
              onValueChange={(val) => setCategoryFilter(val === ALL_CATEGORIES_VALUE ? "" : val)}
              disabled={isLoadingCategories || !typeFilter || typeFilter === ALL_TYPES_VALUE || itemCategories.length === 0}
            >
              <SelectTrigger id="category-filter-table">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
                {itemCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           {(searchTerm || (typeFilter && typeFilter !== ALL_TYPES_VALUE) || (categoryFilter && categoryFilter !== ALL_CATEGORIES_VALUE)) && (
             <Button onClick={clearFilters} variant="ghost" className="lg:col-start-4 text-sm text-muted-foreground">
              <XCircle className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg shadow">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold">No items match your filters.</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-22rem)] border rounded-lg shadow-md bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="text-right">Packing</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.code}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.units}</TableCell>
                  <TableCell className="text-right">{item.packing.toFixed(2)}</TableCell>
                  <TableCell>
                    {item.remark && (
                      <Badge variant={item.remark.toLowerCase() === 'new' ? 'default' : 'secondary'}>
                        {item.remark}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}

    