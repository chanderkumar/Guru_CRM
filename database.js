
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

export async function initDb() {
  if (db) return db;

  // sqlite3.verbose() is a function on the default export in some environments,
  // or on the namespace. We use the standard import and call verbose() on it.
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
      itemsUsed TEXT, -- JSON stored as string
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
  `);
  
  console.log("Database initialized and tables checked.");
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}
