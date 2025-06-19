
export type Item = {
  code: string;
  remark?: string | null;
  type: string;
  category: string;
  description: string;
  units: string;
  packing: number;
};

export type OrderItem = {
  id?: number; // Optional: Primary key from order_items table
  item: Item; // Holds the full Item object, denormalized or joined
  item_code: string; // Actual foreign key to inventory table
  quantity: number;
};

export type OrderStatus = 'Pending' | 'Approved' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface UploadedInvoice {
  id?: number; // Optional: Primary key from order_invoices table
  fileName: string;
  dataUrl: string; // For base64 data URI or file path
  uploadedAt: Date | string; // string if coming from DB, Date if new
}

export type Order = {
  id: string;
  branchId: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  invoices?: UploadedInvoice[] | null;
  // Optional: Fields that might come from JOINs
  branchName?: string;
  userName?: string;
};

export type UserRole = 'employee' | 'purchase_manager';

export type User = {
  id: string;
  name: string;
  username: string;
  password?: string; // Only for login check, not stored in frontend state post-login
  branchId: string | null;
  role: UserRole;
  branchName?: string; // Optional: for display
};

export type Branch = {
  id: string;
  name: string;
};
