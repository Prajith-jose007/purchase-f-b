
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Branch, Item, Order, OrderItem, OrderStatus, UploadedInvoice } from '@/types';
import { 
  addOrderAction, 
  updateOrderStatusAction, 
  setInventoryAction,
  addInvoiceToOrderAction,
  removeInvoiceFromOrderAction,
  updateOrderItemsAction
} from '@/actions/contextActions';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  inventory: Item[];
  setInventory: (items: Item[]) => Promise<void>;
  orders: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'invoices'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order | undefined>;
  addInvoiceToOrder: (orderId: string, fileName: string, dataUrl: string) => Promise<Order | undefined>;
  removeInvoiceFromOrder: (orderId: string, invoiceId: number) => Promise<Order | undefined>;
  updateOrderItems: (orderId: string, updatedItems: OrderItem[]) => Promise<Order | undefined>;
  branches: Branch[];
  users: User[];
  isLoading: boolean;
  refreshOrders: () => Promise<void>;
  refreshContext: () => Promise<void>;
  fetchApiData: <T>(url: string) => Promise<T>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const processOrders = (rawOrders: Order[]): Order[] => {
  return rawOrders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item
    }))
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

async function fetchApiDataInternal<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let errorMessage = `Failed to fetch ${url}: Status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage += ` (Server Message: ${errorData.message || 'No message'})`;
      if (errorData.error) {
        errorMessage += ` (Server Error Detail: ${errorData.error})`;
      }
    } catch (e) {
      // Response body was not JSON or failed to parse
    }
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return response.json();
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [inventory, setInventoryState] = useState<Item[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [branchesData, setBranchesDataState] = useState<Branch[]>([]);
  const [usersData, setUsersDataState] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInitialData = useCallback(async (attempt = 1) => {
    setIsLoading(true);
    console.log(`AppContext: Attempting to load initial data from APIs (attempt ${attempt})`);
    try {
      const results = await Promise.allSettled([
        fetchApiDataInternal<{ branches: Branch[] }>('/api/app-data/branches').then(data => data.branches),
        fetchApiDataInternal<User[]>('/api/app-data/users'), // API already strips passwords
        fetchApiDataInternal<{ inventory: Item[] }>('/api/app-data/inventory').then(data => data.inventory),
        fetchApiDataInternal<{ orders: Order[] }>('/api/app-data/orders').then(data => data.orders),
      ]);

      const [branchesResult, usersResult, inventoryResult, ordersResult] = results;

      if (branchesResult.status === 'fulfilled') setBranchesDataState(branchesResult.value || []);
      else { console.error("AppContext: Failed to load branches:", branchesResult.reason); setBranchesDataState([]); }

      if (usersResult.status === 'fulfilled') setUsersDataState(usersResult.value || []);
      else { console.error("AppContext: Failed to load users:", usersResult.reason); setUsersDataState([]); }
      
      if (inventoryResult.status === 'fulfilled') setInventoryState(inventoryResult.value || []);
      else { console.error("AppContext: Failed to load inventory:", inventoryResult.reason); setInventoryState([]); }

      if (ordersResult.status === 'fulfilled') setOrdersState(processOrders(ordersResult.value || []));
      else { console.error("AppContext: Failed to load orders:", ordersResult.reason); setOrdersState([]); }

      const storedUserJson = localStorage.getItem('currentUser');
      if (storedUserJson) {
        try {
          const parsedUser = JSON.parse(storedUserJson) as User;
          const serverUser = (usersResult.status === 'fulfilled' && usersResult.value) ? usersResult.value.find(u => u.id === parsedUser.id) : null;
          
          if (serverUser) {
            setCurrentUserState(serverUser);
            if (serverUser.role === 'purchase_manager') {
              setCurrentBranchState(null);
              localStorage.removeItem('currentBranch');
            } else if (serverUser.branchId) {
              const userBranch = (branchesResult.status === 'fulfilled' && branchesResult.value) ? branchesResult.value.find(b => b.id === serverUser.branchId) : null;
              setCurrentBranchState(userBranch || null);
              if (userBranch) localStorage.setItem('currentBranch', JSON.stringify(userBranch));
              else localStorage.removeItem('currentBranch');
            } else {
              setCurrentBranchState(null);
              localStorage.removeItem('currentBranch');
            }
          } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentBranch');
            setCurrentUserState(null);
            setCurrentBranchState(null);
          }
        } catch (e) {
          console.error("Error processing stored user from localStorage", e);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('currentBranch');
          setCurrentUserState(null);
          setCurrentBranchState(null);
        }
      } else {
        setCurrentUserState(null);
        setCurrentBranchState(null);
      }

    } catch (error) {
      console.error("AppContext: Critical error during initial data load (wrapper):", error);
      // Set defaults on critical failure
      setBranchesDataState([]); setUsersDataState([]); setInventoryState([]); setOrdersState([]);
      setCurrentUserState(null); setCurrentBranchState(null);
      if (attempt < 3) {
        console.log(`Retrying initial data load in 3 seconds... (attempt ${attempt + 1})`);
        setTimeout(() => loadInitialData(attempt + 1), 3000);
        return; 
      }
    } 
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user.role === 'purchase_manager') {
        setCurrentBranch(null); 
      } else if (user.branchId) {
        const userBranch = branchesData.find(b => b.id === user.branchId);
        setCurrentBranch(userBranch || null);
      } else {
        setCurrentBranch(null); 
      }
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentBranch');
      setCurrentBranch(null);
    }
  };

  const setCurrentBranch = (branch: Branch | null) => {
    setCurrentBranchState(branch);
    if (branch) {
      localStorage.setItem('currentBranch', JSON.stringify(branch));
    } else {
      localStorage.removeItem('currentBranch');
    }
  };

  const setInventory = async (items: Item[]): Promise<void> => {
    setIsLoading(true);
    try {
      const { updatedInventory, updatedOrders } = await setInventoryAction(items);
      setInventoryState(updatedInventory);
      setOrdersState(processOrders(updatedOrders));
    } catch (error) {
      console.error("Error setting inventory via AppContext:", error);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'invoices'>): Promise<Order> => {
    setIsLoading(true);
    try {
      const newOrder = await addOrderAction(orderData);
      await refreshOrders(); 
      return newOrder;
    } catch (error) {
      console.error("Error adding order via AppContext:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order | undefined> => {
    setIsLoading(true);
    try {
      const updatedOrder = await updateOrderStatusAction(orderId, status);
      if (updatedOrder) {
        setOrdersState(prevOrders => processOrders(prevOrders.map(o => o.id === orderId ? updatedOrder : o)));
      }
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status via AppContext:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addInvoiceToOrder = async (orderId: string, fileName: string, dataUrl: string): Promise<Order | undefined> => {
    setIsLoading(true);
    try {
      const updatedOrder = await addInvoiceToOrderAction(orderId, fileName, dataUrl);
      if (updatedOrder) {
        setOrdersState(prevOrders => processOrders(prevOrders.map(o => o.id === orderId ? updatedOrder : o)));
      }
      return updatedOrder;
    } catch (error) {
      console.error("Error adding invoice via AppContext:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeInvoiceFromOrder = async (orderId: string, invoiceId: number): Promise<Order | undefined> => {
    setIsLoading(true);
    try {
      const updatedOrder = await removeInvoiceFromOrderAction(orderId, invoiceId);
       if (updatedOrder) {
        setOrdersState(prevOrders => processOrders(prevOrders.map(o => o.id === orderId ? updatedOrder : o)));
      }
      return updatedOrder;
    } catch (error) {
      console.error("Error removing invoice from order via AppContext:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderItems = async (orderId: string, updatedOrderItemsData: OrderItem[]): Promise<Order | undefined> => {
    setIsLoading(true);
    try {
      const updatedOrder = await updateOrderItemsAction(orderId, updatedOrderItemsData);
      if (updatedOrder) {
        setOrdersState(prevOrders => processOrders(prevOrders.map(o => o.id === orderId ? updatedOrder : o)));
      }
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order items via AppContext:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrders = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApiDataInternal<{ orders: Order[] }>('/api/app-data/orders');
      setOrdersState(processOrders(data.orders || []));
    } catch (error) {
      console.error("AppContext: Failed to refresh orders:", error);
      setOrdersState([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContext = async () => {
    await loadInitialData(1);
  }

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      currentBranch, setCurrentBranch,
      inventory, setInventory,
      orders, addOrder, updateOrderStatus, addInvoiceToOrder, removeInvoiceFromOrder, updateOrderItems,
      branches: branchesData,
      users: usersData,
      isLoading,
      refreshOrders,
      refreshContext,
      fetchApiData: fetchApiDataInternal
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
