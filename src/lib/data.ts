
import pool from './db';
import type { Item, Branch, User, Order, OrderItem, OrderStatus, UploadedInvoice } from '@/types';
import type * as mysql from 'mysql2/promise'; // For RowDataPacket if needed for complex types

// --- Inventory Data & Parsing ---
export const parseInventoryCSV = (csvString: string): Item[] => {
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) return [];
  const header = lines[0].split('\t').map(h => h.trim().toUpperCase());
  const items: Item[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length !== header.length) continue; // Skip malformed lines
    const itemData: any = {};
    header.forEach((key, index) => {
      let value: string | number | null = values[index]?.trim() || '';
      if (key === 'REMARK' && (value === '' || value === undefined)) {
        value = null;
      } else if (key === 'PACKING') {
        value = parseFloat(value as string) || 0;
      }
      itemData[key.toLowerCase()] = value;
    });
    items.push(itemData as Item);
  }
  return items;
};

// --- Inventory Functions ---
export const getInventoryItems = async (): Promise<Item[]> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<Item[]>("SELECT * FROM inventory");
    return rows;
  } finally {
    connection.release();
  }
};

export const getInventoryItemByCode = async (code: string): Promise<Item | undefined> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<Item[]>("SELECT * FROM inventory WHERE code = ?", [code]);
    return rows[0];
  } finally {
    connection.release();
  }
};

export const getItemTypes = async (): Promise<string[]> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>("SELECT DISTINCT type FROM inventory ORDER BY type ASC");
    return rows.map(row => row.type);
  } finally {
    connection.release();
  }
};

export const getItemCategories = async (selectedType?: string): Promise<string[]> => {
  const connection = await pool.getConnection();
  try {
    let query = "SELECT DISTINCT category FROM inventory";
    const params: string[] = [];
    if (selectedType) {
      query += " WHERE type = ?";
      params.push(selectedType);
    }
    query += " ORDER BY category ASC";
    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);
    return rows.map(row => row.category);
  } finally {
    connection.release();
  }
};

export const updateFullInventory = async (items: Item[]): Promise<void> => {
  if (items.length === 0) return;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM inventory");
    const values = items.map(item => [
      item.code, item.remark, item.type, item.category,
      item.description, item.units, item.packing
    ]);
    await connection.query(
      "INSERT INTO inventory (code, remark, type, category, description, units, packing) VALUES ?",
      [values]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Error updating full inventory:", error);
    throw error;
  } finally {
    connection.release();
  }
};


// --- Branch Functions ---
export const getBranches = async (): Promise<Branch[]> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<Branch[]>("SELECT * FROM branches");
    return rows;
  } finally {
    connection.release();
  }
};

export const getBranchById = async (id: string): Promise<Branch | undefined> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<Branch[]>("SELECT * FROM branches WHERE id = ?", [id]);
    return rows[0];
  } finally {
    connection.release();
  }
};

// --- User Functions ---
interface UserQueryResult extends Omit<User, 'password' | 'branchId' | 'branchName'> {
  branch_id: string | null;
  branchName?: string;
  password?: string;
}

export const getUsers = async (): Promise<User[]> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<UserQueryResult[]>(
      "SELECT u.id, u.name, u.username, u.branch_id, u.role, b.name as branchName FROM users u LEFT JOIN branches b ON u.branch_id = b.id"
    );
    return rows.map(row => ({ ...row, branchId: row.branch_id }));
  } finally {
    connection.release();
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<UserQueryResult[]>(
       "SELECT u.id, u.name, u.username, u.branch_id, u.role, b.name as branchName FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.id = ?", [id]
    );
    if (rows.length === 0) return undefined;
    return { ...rows[0], branchId: rows[0].branch_id };
  } finally {
    connection.release();
  }
};

export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<UserQueryResult[]>(
      "SELECT u.id, u.name, u.username, u.password, u.branch_id, u.role, b.name as branchName FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.username = ?", [username]
    );
    if (rows.length === 0) return undefined;
    return { ...rows[0], branchId: rows[0].branch_id };
  } finally {
    connection.release();
  }
};

// --- Order Functions ---
interface OrderQueryResult extends Omit<Order, 'items' | 'invoices' | 'branchId' | 'userId'> {
  branch_id: string;
  user_id: string;
}
interface OrderItemQueryResult extends Omit<OrderItem, 'item' | 'item_code'> { 
  item_code: string;
  // Plus all fields from Item
  code: string;
  remark?: string | null;
  type: string;
  category: string;
  description: string;
  units: string;
  packing: number;
}


export const getOrders = async (): Promise<Order[]> => {
  const connection = await pool.getConnection();
  try {
    const [orderRows] = await connection.query<OrderQueryResult[]>(`
      SELECT o.*, b.name as branchName, u.name as userName
      FROM orders o
      JOIN branches b ON o.branch_id = b.id
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    const orders: Order[] = [];
    for (const orderData of orderRows) {
      const [itemRows] = await connection.query<OrderItemQueryResult[]>(`
        SELECT oi.id, oi.item_code, oi.quantity, inv.*
        FROM order_items oi
        JOIN inventory inv ON oi.item_code = inv.code
        WHERE oi.order_id = ?
      `, [orderData.id]);

      const items: OrderItem[] = itemRows.map(row => ({
        id: row.id,
        item_code: row.item_code,
        quantity: row.quantity,
        item: {
          code: row.code,
          remark: row.remark,
          type: row.type,
          category: row.category,
          description: row.description,
          units: row.units,
          packing: row.packing,
        }
      }));

      const [invoiceRows] = await connection.query<UploadedInvoice[]>(
        "SELECT id, file_name as fileName, data_url as dataUrl, uploaded_at as uploadedAt FROM order_invoices WHERE order_id = ?",
        [orderData.id]
      );

      orders.push({
        ...orderData,
        branchId: orderData.branch_id,
        userId: orderData.user_id,
        items,
        invoices: invoiceRows
      });
    }
    return orders;
  } finally {
    connection.release();
  }
};

export const getOrderById = async (orderId: string): Promise<Order | undefined> => {
  const connection = await pool.getConnection();
  try {
    const [orderRows] = await connection.query<OrderQueryResult[]>(`
      SELECT o.*, b.name as branchName, u.name as userName
      FROM orders o
      JOIN branches b ON o.branch_id = b.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orderRows.length === 0) return undefined;
    const orderData = orderRows[0];

    const [itemRows] = await connection.query<OrderItemQueryResult[]>(`
      SELECT oi.id, oi.item_code, oi.quantity, inv.*
      FROM order_items oi
      JOIN inventory inv ON oi.item_code = inv.code
      WHERE oi.order_id = ?
    `, [orderData.id]);

    const items: OrderItem[] = itemRows.map(row => ({
      id: row.id,
      item_code: row.item_code,
      quantity: row.quantity,
      item: {
        code: row.code,
        remark: row.remark,
        type: row.type,
        category: row.category,
        description: row.description,
        units: row.units,
        packing: row.packing,
      }
    }));

    const [invoiceRows] = await connection.query<UploadedInvoice[]>(
      "SELECT id, file_name as fileName, data_url as dataUrl, uploaded_at as uploadedAt FROM order_invoices WHERE order_id = ?",
      [orderData.id]
    );

    return {
      ...orderData,
      branchId: orderData.branch_id,
      userId: orderData.user_id,
      items,
      invoices: invoiceRows
    };
  } finally {
    connection.release();
  }
};

export const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'invoices'>): Promise<Order> => {
  const connection = await pool.getConnection();
  const newOrderId = `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now = new Date();

  try {
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO orders (id, branch_id, user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [newOrderId, orderData.branchId, orderData.userId, 'Pending', now, now]
    );

    if (orderData.items.length > 0) {
      const itemValues = orderData.items.map(oi => [
        newOrderId, oi.item.code, oi.quantity
      ]);
      await connection.query(
        "INSERT INTO order_items (order_id, item_code, quantity) VALUES ?",
        [itemValues]
      );
    }
    await connection.commit();

    const newOrder = await getOrderById(newOrderId);
    if (!newOrder) throw new Error("Failed to retrieve newly created order.");
    return newOrder;

  } catch (error) {
    await connection.rollback();
    console.error("Error adding order:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order | undefined> => {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, orderId]
    );
    return getOrderById(orderId);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const addInvoiceToOrder = async (orderId: string, fileName: string, dataUrl: string): Promise<Order | undefined> => {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      "INSERT INTO order_invoices (order_id, file_name, data_url, uploaded_at) VALUES (?, ?, ?, NOW())",
      [orderId, fileName, dataUrl]
    );
    await connection.query("UPDATE orders SET updated_at = NOW() WHERE id = ?", [orderId]);
    return getOrderById(orderId);
  } catch (error) {
    console.error("Error adding invoice to order:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const removeInvoiceFromOrder = async (orderId: string, invoiceId: number): Promise<Order | undefined> => {
  const connection = await pool.getConnection();
  try {
    await connection.query("DELETE FROM order_invoices WHERE id = ? AND order_id = ?", [invoiceId, orderId]);
    await connection.query("UPDATE orders SET updated_at = NOW() WHERE id = ?", [orderId]);
    return getOrderById(orderId);
  } catch (error) {
    console.error("Error removing invoice from order:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const updateOrderItems = async (orderId: string, updatedItems: OrderItem[]): Promise<Order | undefined> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // First, delete existing items for the order
    await connection.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);

    // Then, insert the updated items if there are any
    if (updatedItems.length > 0) {
      const itemValues = updatedItems.map(oi => [
        orderId, 
        oi.item.code, 
        oi.quantity, 
      ]);
      await connection.query(
        "INSERT INTO order_items (order_id, item_code, quantity) VALUES ?",
        [itemValues]
      );
    }

    await connection.query("UPDATE orders SET updated_at = NOW() WHERE id = ?", [orderId]);
    await connection.commit();
    return getOrderById(orderId);
  } catch (error) {
    await connection.rollback();
    console.error("Error updating order items:", error);
    throw error;
  } finally {
    connection.release();
  }
};
