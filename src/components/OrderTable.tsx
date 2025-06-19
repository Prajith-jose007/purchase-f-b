
"use client";

import type { Order, Branch, User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Eye, Edit3, Filter, PackageSearch, FileDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrderStatus } from '@/types';
import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface OrderTableProps {
  orders: Order[];
  branches: Branch[];
  users: User[];
  title: string;
  showBranchFilter?: boolean;
  showStatusFilter?: boolean;
  allowStatusUpdate?: boolean;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

const statusColors: Record<OrderStatus, string> = {
  Pending: "bg-yellow-500 hover:bg-yellow-600",
  Approved: "bg-blue-500 hover:bg-blue-600",
  Processing: "bg-purple-500 hover:bg-purple-600",
  Shipped: "bg-teal-500 hover:bg-teal-600",
  Delivered: "bg-green-500 hover:bg-green-600",
  Cancelled: "bg-red-500 hover:bg-red-600",
};

const ALL_BRANCHES_PLACEHOLDER = "all-branches-table-placeholder";
const ALL_STATUSES_PLACEHOLDER = "all-statuses-table-placeholder";

export default function OrderTable({ 
  orders, 
  branches, 
  users, 
  title, 
  showBranchFilter = false, 
  showStatusFilter = false,
  allowStatusUpdate = false,
  onUpdateStatus 
}: OrderTableProps) {
  const [branchFilter, setBranchFilter] = useState<string>(ALL_BRANCHES_PLACEHOLDER);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "" | typeof ALL_STATUSES_PLACEHOLDER>(ALL_STATUSES_PLACEHOLDER);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();

  const getBranchName = (branchId: string) => branches.find(b => b.id === branchId)?.name || 'N/A';
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const actualBranchFilter = branchFilter === ALL_BRANCHES_PLACEHOLDER ? "" : branchFilter;
      const actualStatusFilter = statusFilter === ALL_STATUSES_PLACEHOLDER ? "" : statusFilter;

      const matchesBranchFilter = showBranchFilter && actualBranchFilter ? order.branchId === actualBranchFilter : true;
      const matchesStatus = showStatusFilter && actualStatusFilter ? order.status === actualStatusFilter : true;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm ? 
        order.id.toLowerCase().includes(searchLower) ||
        getUserName(order.userId).toLowerCase().includes(searchLower) ||
        getBranchName(order.branchId).toLowerCase().includes(searchLower)
        : true;
      return matchesBranchFilter && matchesStatus && matchesSearch;
    });
  }, [orders, branchFilter, statusFilter, searchTerm, showBranchFilter, showStatusFilter, branches, users]);


  const orderStatuses: OrderStatus[] = ["Pending", "Approved", "Processing", "Shipped", "Delivered", "Cancelled"];

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders matching the current filters.",
        variant: "destructive",
      });
      return;
    }

    const csvHeader = "Order ID,Branch,User,Date Created,Status,Item Code,Item Description,Item Units,Item Quantity\n";
    let csvRows = "";

    filteredOrders.forEach(order => {
      const orderId = `#${order.id.slice(-6)}`;
      const branchName = getBranchName(order.branchId);
      const userName = getUserName(order.userId);
      const dateCreated = new Date(order.createdAt).toLocaleDateString();
      const status = order.status;

      order.items.forEach(orderItem => {
        const itemCode = orderItem.item.code;
        const itemDescription = orderItem.item.description;
        const itemUnits = orderItem.item.units;
        const itemQuantity = orderItem.quantity;
        csvRows += `"${orderId}","${branchName}","${userName}","${dateCreated}","${status}","${itemCode}","${itemDescription}","${itemUnits}",${itemQuantity}\n`;
      });
    });

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_with_items_export_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Export Successful",
        description: `Orders with item details exported to CSV.`,
      });
    } else {
       toast({
        title: "Export Failed",
        description: "Your browser does not support direct CSV download.",
        variant: "destructive",
      });
    }
  };


  if (orders.length === 0 && branchFilter === ALL_BRANCHES_PLACEHOLDER && statusFilter === ALL_STATUSES_PLACEHOLDER && !searchTerm) {
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow w-full max-w-md mx-auto">
        <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="font-headline text-2xl text-primary">{title}</h2>
        <p className="text-lg text-muted-foreground mt-2">No orders found.</p>
        {title.toLowerCase().includes("my orders") && (
           <Link href="/dashboard/orders/new" passHref>
            <Button className="mt-4">Create Your First Order</Button>
          </Link>
        )}
      </div>
    );
  }


  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center">
        <h2 className="font-headline text-3xl text-primary self-start">{title}</h2>
        {filteredOrders.length > 0 && (
          <Button variant="outline" onClick={handleExportCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        )}
      </div>
      
      <div className="p-4 bg-card border rounded-lg shadow-sm w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="search-orders" className="block text-sm font-medium text-muted-foreground mb-1">Search (ID, User, Branch)</label>
            <Input
              id="search-orders"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {showBranchFilter && (
            <div>
              <label htmlFor="branch-filter-orders" className="block text-sm font-medium text-muted-foreground mb-1">Filter by Branch</label>
              <Select 
                value={branchFilter} 
                onValueChange={(val) => setBranchFilter(val)}
              >
                <SelectTrigger id="branch-filter-orders">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_BRANCHES_PLACEHOLDER}>All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showStatusFilter && (
            <div>
              <label htmlFor="status-filter-orders" className="block text-sm font-medium text-muted-foreground mb-1">Filter by Status</label>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as OrderStatus | "" | typeof ALL_STATUSES_PLACEHOLDER)}
              >
                <SelectTrigger id="status-filter-orders">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES_PLACEHOLDER}>All Statuses</SelectItem>
                  {orderStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-10 bg-card rounded-lg shadow w-full max-w-md mx-auto">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold">No orders match your filters.</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
      
      {filteredOrders.length > 0 && (
        <div className="overflow-x-auto bg-card rounded-lg shadow-md w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                  <TableCell>{getBranchName(order.branchId)}</TableCell>
                  <TableCell>{getUserName(order.userId)}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                  <TableCell>
                    {allowStatusUpdate && onUpdateStatus ? (
                      <Select 
                        value={order.status} 
                        onValueChange={(newStatus) => onUpdateStatus(order.id, newStatus as OrderStatus)}
                      >
                        <SelectTrigger className={`h-8 text-xs w-36 ${statusColors[order.status]} text-white border-none focus:ring-0`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map(status => (
                            <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${statusColors[order.status]} text-white`}>{order.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/orders/${order.id}`} aria-label={`View order ${order.id.slice(-6)}`}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                    {allowStatusUpdate && (
                       <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/orders/${order.id}?edit=true`} aria-label={`Edit order ${order.id.slice(-6)}`}>
                          <Edit3 className="h-4 w-4 mr-1" /> Edit
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

