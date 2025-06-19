
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import OrderDetails from '@/components/OrderDetails';
import AuthGuard from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, AlertTriangle, PlusCircle } from 'lucide-react';
import type { OrderStatus, Order, OrderItem } from '@/types';
import { useToast } from '@/hooks/use-toast';


function OrderDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const orderId = params.orderId as string;
  
  const { 
    orders, 
    branches, 
    users, 
    currentUser, 
    updateOrderStatus: contextUpdateStatus, 
    addInvoiceToOrder: contextAddInvoice,
    removeInvoiceFromOrder: contextRemoveInvoice,
    updateOrderItems: contextUpdateOrderItems, 
    isLoading: contextIsLoading,
  } = useAppContext();
  
  const [order, setOrder] = useState<Order | null | undefined>(undefined); 
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [editableOrderItems, setEditableOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setPageLoading(true);
      if (orderId) {
        const foundOrder = orders.find(o => o.id === orderId); 
        
        if (foundOrder) {
          setOrder(foundOrder); 
          setEditableOrderItems(JSON.parse(JSON.stringify(foundOrder.items)));
        } else {
          setOrder(null); 
        }
      }
      setPageLoading(false);
    };

    if (!contextIsLoading) { 
        fetchOrderDetails();
    }
  }, [orderId, orders, contextIsLoading]);


  useEffect(() => {
    if (searchParams.get('edit') === 'true' && currentUser?.role === 'purchase_manager') {
      setIsEditingStatus(true);
    }
  }, [searchParams, currentUser]);


  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    const updatedOrder = await contextUpdateStatus(id, status);
    if (updatedOrder) {
      setOrder(updatedOrder); 
      setEditableOrderItems(JSON.parse(JSON.stringify(updatedOrder.items)));
      toast({title: "Status Updated", description: `Order #${id.slice(-6)} status changed to ${status}.`});
    } else {
      toast({title: "Update Failed", description: `Failed to update status for order #${id.slice(-6)}.`, variant: "destructive"});
    }
    setIsEditingStatus(false); 
    router.replace(`/dashboard/orders/${orderId}`, undefined); 
  };

  const handleAddInvoice = async (id: string, fileName: string, dataUrl: string) => {
    const updatedOrder = await contextAddInvoice(id, fileName, dataUrl);
    if (updatedOrder) {
      setOrder(updatedOrder);
      toast({title: "Invoice Added", description: `Invoice "${fileName}" added to order #${id.slice(-6)}.`});
    } else {
      toast({title: "Invoice Add Failed", description: `Failed to add invoice for order #${id.slice(-6)}.`, variant: "destructive"});
    }
  };

  const handleRemoveInvoice = async (id: string, invoiceId: number, invoiceFileName: string) => {
    const updatedOrder = await contextRemoveInvoice(id, invoiceId);
    if (updatedOrder) {
      setOrder(updatedOrder);
      toast({title: "Invoice Removed", description: `Invoice "${invoiceFileName}" removed from order #${id.slice(-6)}.`});
    } else {
      toast({title: "Invoice Removal Failed", description: `Failed to remove invoice for order #${id.slice(-6)}.`, variant: "destructive"});
    }
  }

  const handleItemQuantityChange = (itemCode: string, newQuantity: number) => {
    setEditableOrderItems(prevItems => 
      prevItems.map(oi => oi.item.code === itemCode ? {...oi, quantity: Math.max(0, newQuantity)} : oi)
    );
  };

  const handleSaveItemChanges = async (id: string) => {
    const updatedOrder = await contextUpdateOrderItems(id, editableOrderItems);
    if (updatedOrder) {
      setOrder(updatedOrder);
      setEditableOrderItems(JSON.parse(JSON.stringify(updatedOrder.items)));
      toast({title: "Order Items Updated", description: `Items for order #${id.slice(-6)} have been updated.`});
    } else {
      toast({title: "Update Failed", description: `Failed to update items for order #${id.slice(-6)}.`, variant: "destructive"});
    }
  };

  if (pageLoading || contextIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="font-headline text-3xl text-destructive mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">The order with ID #{orderId?.slice(-6)} could not be found.</p>
        <Button asChild>
          <Link href="/dashboard/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  if (currentUser?.role === 'employee' && order.userId !== currentUser.id) {
     router.replace('/dashboard?error=unauthorized');
     return null; 
  }

  const branch = branches.find(b => b.id === order.branchId);
  const user = users.find(u => u.id === order.userId);
  const canEditOrderDetails = currentUser?.role === 'purchase_manager' && order.status !== 'Delivered' && order.status !== 'Cancelled';


  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders">
            &larr; Back to Orders List
          </Link>
        </Button>
        {currentUser?.role === 'employee' && ( 
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Order
            </Link>
          </Button>
        )}
      </div>
      <OrderDetails 
        order={order} 
        editableOrderItems={editableOrderItems}
        branch={branch} 
        user={user}
        allowStatusUpdate={currentUser?.role === 'purchase_manager'}
        onUpdateStatus={handleUpdateStatus}
        isEditingStatus={isEditingStatus}
        setIsEditingStatus={setIsEditingStatus}
        allowInvoiceManagement={currentUser?.role === 'purchase_manager'}
        onAddInvoice={handleAddInvoice}
        onRemoveInvoice={(invoiceId, invoiceFileName) => handleRemoveInvoice(order.id, invoiceId, invoiceFileName)}
        allowItemEditing={canEditOrderDetails}
        onItemQuantityChange={handleItemQuantityChange}
        onSaveItemChanges={() => handleSaveItemChanges(order.id)}
      />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <AuthGuard>
      <OrderDetailPageContent />
    </AuthGuard>
  );
}
