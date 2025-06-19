
"use client";

import { useAppContext } from '@/contexts/AppContext';
import OrderTable from '@/components/OrderTable';
import AuthGuard from '@/components/AuthGuard';
import type { OrderStatus } from '@/types';
import { useSearchParams } from 'next/navigation';

function OrdersPageContent() {
  const { currentUser, orders, branches, users, updateOrderStatus, currentBranch } = useAppContext(); // Added currentBranch
  const searchParams = useSearchParams();
  const viewAll = searchParams.get('view') === 'all';


  if (!currentUser) {
    return <p>Loading user data...</p>; // Or a loader component
  }

  const ordersToDisplay = (currentUser.role === 'purchase_manager' && viewAll) 
    ? orders // PM sees all orders if view=all
    : orders.filter(order => order.userId === currentUser.id); // Employee or PM (default view) sees their own orders

  const tableTitle = currentUser.role === 'purchase_manager' && viewAll
    ? `All Orders (All Branches)`
    : currentUser.role === 'purchase_manager' && !viewAll
      ? `My Created Orders` 
      : `My Orders${currentBranch ? ` for ${currentBranch.name}` : ''}`;

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    // Optionally add toast notification here
  };
  
  return (
    <OrderTable 
      orders={ordersToDisplay} 
      branches={branches} 
      users={users}
      title={tableTitle}
      showBranchFilter={currentUser.role === 'purchase_manager' && viewAll}
      showStatusFilter={true}
      allowStatusUpdate={currentUser.role === 'purchase_manager'}
      onUpdateStatus={currentUser.role === 'purchase_manager' ? handleUpdateStatus : undefined}
    />
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersPageContent />
    </AuthGuard>
  );
}
