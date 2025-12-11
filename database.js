
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
      phone TEXT UNIQUE,
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
      nextFollowUp TEXT,
      cancellationReason TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      source TEXT,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      nextFollowUp TEXT,
      estimateValue REAL,
      assignedTo TEXT
    );

    CREATE TABLE IF NOT EXISTS lead_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leadId TEXT,
      action TEXT,
      details TEXT,
      timestamp TEXT,
      performedBy TEXT,
      FOREIGN KEY(leadId) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      price REAL,
      warrantyMonths INTEGER,
      stockQuantity INTEGER DEFAULT 0
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

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      phone TEXT UNIQUE,
      address TEXT,
      status TEXT DEFAULT 'Active'
    );
  `);

  // Migrations checks (Manual execution if needed for existing DBs, but prefer delete DB for this update)
  try { await db.get('SELECT email FROM leads LIMIT 1'); } 
  catch (e) { await db.exec('ALTER TABLE leads ADD COLUMN email TEXT'); }
  
  try { await db.get('SELECT address FROM leads LIMIT 1'); } 
  catch (e) { await db.exec('ALTER TABLE leads ADD COLUMN address TEXT'); }

  // Seed Default Admin User if empty
  const userCount = await db.get('SELECT count(*) as count FROM users');
  if (userCount.count === 0) {
      console.log("Seeding default admin user...");
      const stmt = await db.prepare('INSERT INTO users (id, name, email, password, role, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
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
