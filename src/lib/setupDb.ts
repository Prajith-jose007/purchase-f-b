
'use server';
/**
 * @fileOverview Database setup script.
 * This script will:
 * 1. Ensure the database specified in .env (DB_DATABASE) exists.
 * 2. Create all necessary tables if they don't exist.
 * 3. Seed some initial data (branches, users).
 *
 * To run this script: npm run db:setup
 *
 * NOTE: If you don't want to seed data, comment out the call to seedData() in the main() function.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_DATABASE || 'dutchpurchase';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'dutchpurchase',
  password: process.env.DB_PASSWORD || 'Dutchoriental',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const dbConfigWithDb = {
  ...dbConfig,
  database: dbName,
};

const tableSchemas = [
  `CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(191) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(191) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    branch_id VARCHAR(191),
    role ENUM('employee', 'purchase_manager') NOT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS inventory (
    code VARCHAR(191) PRIMARY KEY,
    remark VARCHAR(255),
    type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    units VARCHAR(255) NOT NULL,
    packing DECIMAL(10, 2) NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(191) PRIMARY KEY,
    branch_id VARCHAR(191) NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    status ENUM('Pending', 'Approved', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(191) NOT NULL,
    item_code VARCHAR(191) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_code) REFERENCES inventory(code)
  );`,
  `CREATE TABLE IF NOT EXISTS order_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(191) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    data_url LONGTEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );`
];

const seedSql = [
  // Branches
  `INSERT IGNORE INTO branches (id, name) VALUES ('branch-main', 'Main Branch Dubai');`,
  `INSERT IGNORE INTO branches (id, name) VALUES ('branch-satellite', 'Satellite Office Abu Dhabi');`,
  `INSERT IGNORE INTO branches (id, name) VALUES ('branch-new', 'New Outlet Sharjah');`,

  // Users
  // IMPORTANT: These are default passwords for development convenience.
  // They should be changed immediately in a real environment or managed via a secure user creation process.
  `INSERT IGNORE INTO users (id, name, username, password, role) VALUES ('pm001', 'Procurement Head', 'manager', 'manager', 'purchase_manager');`,
  `INSERT IGNORE INTO users (id, name, username, password, branch_id, role) VALUES ('emp001', 'Store Keeper Alpha', 'employee1', 'employee1', 'branch-main', 'employee');`,
  `INSERT IGNORE INTO users (id, name, username, password, branch_id, role) VALUES ('emp002', 'Store Keeper Beta', 'employee2', 'employee2', 'branch-satellite', 'employee');`,
  `INSERT IGNORE INTO users (id, name, username, password, branch_id, role) VALUES ('emp003', 'New Staff Gamma', 'employee3', 'employee3', 'branch-new', 'employee');`
];


async function ensureDatabaseExists() {
  let connection: mysql.Connection | null = null;
  try {
    console.log('Attempting to connect to MySQL server to check/create database...');
    connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database '${dbName}' ensured.`);
  } catch (error) {
    console.error(`Error ensuring database '${dbName}' exists:`, error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createTables() {
  let connection: mysql.Connection | null = null;
  try {
    console.log(`Attempting to connect to database '${dbName}' to create tables...`);
    connection = await mysql.createConnection(dbConfigWithDb);
    console.log('Connected to database. Creating tables...');
    for (const schema of tableSchemas) {
      const tableNameMatch = schema.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown table';
      try {
        await connection.query(schema);
        console.log(`Table '${tableName}' ensured (created if not exists).`);
      } catch (tableError) {
        console.error(`Error creating table '${tableName}':`, (tableError as Error).message);
        // Decide if you want to throw or continue
      }
    }
    console.log('All tables ensured.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function seedData() {
  let connection: mysql.Connection | null = null;
  try {
    console.log(`Attempting to connect to database '${dbName}' for seeding...`);
    connection = await mysql.createConnection(dbConfigWithDb);
    console.log('Connected to database. Seeding initial data...');
    for (const sql of seedSql) {
       const actionMatch = sql.match(/INSERT IGNORE INTO (\w+)/);
       const actionTable = actionMatch ? `table '${actionMatch[1]}'` : 'item';
      try {
        const [result] = await connection.query(sql) as mysql.ResultSetHeader[];
        if (result.affectedRows > 0) {
          console.log(`Seeded ${actionTable}.`);
        } else {
          console.log(`Skipped seeding for ${actionTable} (already exists or no change).`);
        }
      } catch (seedError) {
         console.error(`Error seeding ${actionTable}:`, (seedError as Error).message);
      }
    }
    console.log('Initial data seeding completed.');
    console.warn("\nIMPORTANT: Seeded users have default passwords (e.g., 'manager'/'manager', 'employee1'/'employee1').");
    console.warn("These should be changed in a production environment or if security is a concern.\n");
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function main() {
  try {
    console.log('Starting database setup...');
    await ensureDatabaseExists();
    await createTables();
    await seedData(); // Comment this line out if you do not want to seed data
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1); // Exit with error code
  }
}

main();
