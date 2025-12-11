
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

export async function initDb() {
  if (db) return db;

  const sqlite3Verbose = sqlite3.verbose();

  db = await open({
    filename: './guru_erp.db',
    driver: sqlite3Verbose.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      address TEXT,
      type TEXT
    );

    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId TEXT,
      modelNo TEXT,
      installationDate TEXT,
      warrantyExpiry TEXT,
      amcActive INTEGER,
      amcExpiry TEXT,
      FOREIGN KEY(customerId) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      customerName TEXT,
      type TEXT,
      description TEXT,
      priority TEXT,
      status TEXT,
      assignedTechnicianId TEXT,
      scheduledDate TEXT,
      completedDate TEXT,
      itemsUsed TEXT,
      serviceCharge REAL,
      totalAmount REAL,
      paymentMode TEXT,
      technicianNotes TEXT,
      nextFollowUp TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      source TEXT,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      nextFollowUp TEXT,
      estimateValue REAL
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      price REAL,
      warrantyMonths INTEGER
    );

    CREATE TABLE IF NOT EXISTS machine_types (
      id TEXT PRIMARY KEY,
      modelName TEXT,
      description TEXT,
      warrantyMonths INTEGER,
      price REAL
    );

    CREATE TABLE IF NOT EXISTS ticket_assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId TEXT,
      technicianId TEXT,
      assignedAt TEXT,
      scheduledDate TEXT,
      FOREIGN KEY(ticketId) REFERENCES tickets(id)
    );

    -- Dropping old users table if it exists without email column to ensure migration
    -- In a production environment, you would use ALTER TABLE
    -- CREATE TABLE IF NOT EXISTS users ( ... );
  `);

  // Check if users table has the new schema, if not drop and recreate (Simple migration for dev)
  try {
      await db.get('SELECT email FROM users LIMIT 1');
  } catch (e) {
      // Column email likely doesn't exist, drop and recreate
      await db.exec('DROP TABLE IF EXISTS users');
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      phone TEXT,
      address TEXT,
      status TEXT DEFAULT 'Active'
    );
  `);
  
  // Seed Default Admin User if empty
  const userCount = await db.get('SELECT count(*) as count FROM users');
  if (userCount.count === 0) {
      console.log("Seeding default admin user...");
      const stmt = await db.prepare('INSERT INTO users (id, name, email, password, role, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      // Default Password: admin123
      await stmt.run('u1', 'Super Admin', 'admin@guru.com', 'admin123', 'Admin', '9999999999', 'Head Office', 'Active');
      await stmt.finalize();
  }

  console.log("Database initialized and tables checked.");
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}
