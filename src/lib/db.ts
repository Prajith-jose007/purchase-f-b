
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'dutchpurchase',
  password: process.env.DB_PASSWORD || 'Dutchoriental',
  database: process.env.DB_DATABASE || 'dutchpurchase',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

/*
To set up your MySQL database automatically (create database, tables, and seed initial data):
1. Ensure your .env file is configured with your MySQL connection details.
2. Run the following command in your project's root terminal:
   npm run db:setup

This script uses 'CREATE TABLE IF NOT EXISTS' and 'INSERT IGNORE'
so it can be run multiple times without duplicating tables or initial seed data.

The table schemas are defined within the setup script (src/lib/setupDb.ts)
but are based on the following structure:

CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(191) NOT NULL UNIQUE, -- Max length 191 for utf8mb4 compatibility
  password VARCHAR(255) NOT NULL, -- NOTE: Seeded passwords are for dev only!
  branch_id VARCHAR(191),
  role ENUM('employee', 'purchase_manager') NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  code VARCHAR(191) PRIMARY KEY, -- Max length 191 for utf8mb4 compatibility
  remark VARCHAR(255),
  type VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  units VARCHAR(255) NOT NULL,
  packing DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(191) PRIMARY KEY, -- Max length 191 for utf8mb4 compatibility
  branch_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  status ENUM('Pending', 'Approved', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(191) NOT NULL,
  item_code VARCHAR(191) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (item_code) REFERENCES inventory(code)
);

CREATE TABLE IF NOT EXISTS order_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(191) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  data_url LONGTEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
*/

    