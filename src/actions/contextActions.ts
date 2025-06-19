
'use server';

import {
  addOrder as dbAddOrder,
  updateOrderStatus as dbUpdateOrderStatus,
  updateFullInventory as dbUpdateFullInventory,
  addInvoiceToOrder as dbAddInvoiceToOrder,
  removeInvoiceFromOrder as dbRemoveInvoiceFromOrder,
  updateOrderItems as dbUpdateOrderItems,
  getInventoryItems, // For refreshing inventory after update
  getOrders // For refreshing orders after update
} from '@/lib/data';
import type { Item, Order, OrderItem, OrderStatus, UploadedInvoice } from '@/types';

export async function addOrderAction(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'invoices'>): Promise<Order> {
  const newOrder = await dbAddOrder(orderData);
  return newOrder;
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<Order | undefined> {
  const updatedOrder = await dbUpdateOrderStatus(orderId, status);
  return updatedOrder;
}

export async function setInventoryAction(items: Item[]): Promise<{ updatedInventory: Item[], updatedOrders: Order[] }> {
  await dbUpdateFullInventory(items);
  const updatedInventory = await getInventoryItems();
  const updatedOrders = await getOrders(); // Orders might be affected by inventory changes (though less direct)
  return { updatedInventory, updatedOrders };
}

export async function addInvoiceToOrderAction(orderId: string, fileName: string, dataUrl: string): Promise<Order | undefined> {
  const updatedOrder = await dbAddInvoiceToOrder(orderId, fileName, dataUrl);
  return updatedOrder;
}

export async function removeInvoiceFromOrderAction(orderId: string, invoiceId: number): Promise<Order | undefined> {
  const updatedOrder = await dbRemoveInvoiceFromOrder(orderId, invoiceId);
  return updatedOrder;
}

export async function updateOrderItemsAction(orderId: string, updatedItems: OrderItem[]): Promise<Order | undefined> {
  const updatedOrder = await dbUpdateOrderItems(orderId, updatedItems);
  return updatedOrder;
}
