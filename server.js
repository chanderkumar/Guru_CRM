
import express from 'express';
import cors from 'cors';
import { initDb, getDb } from './database.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
initDb();

// --- API Endpoints ---

// Get All Initial Data
app.get('/api/init', async (req, res) => {
  try {
    const db = getDb();
    const tickets = await db.all('SELECT * FROM tickets');
    const customers = await db.all('SELECT * FROM customers');
    
    // Fetch nested data for customers (machines)
    for (let customer of customers) {
      customer.machines = await db.all('SELECT * FROM machines WHERE customerId = ?', [customer.id]);
      // Convert boolean/integers back to proper types if needed
      customer.machines = customer.machines.map(m => ({
        ...m,
        amcActive: !!m.amcActive
      }));
    }

    const leads = await db.all('SELECT * FROM leads');
    const parts = await db.all('SELECT * FROM parts');
    
    // Parse JSON fields for tickets (itemsUsed)
    const ticketsParsed = tickets.map(t => ({
      ...t,
      itemsUsed: t.itemsUsed ? JSON.parse(t.itemsUsed) : []
    }));

    res.json({ tickets: ticketsParsed, customers, leads, parts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Tickets ---
app.post('/api/tickets', async (req, res) => {
  const { id, customerId, customerName, type, description, priority, status, scheduledDate, totalAmount, itemsUsed, serviceCharge } = req.body;
  try {
    const db = getDb();
    await db.run(
      `INSERT INTO tickets (id, customerId, customerName, type, description, priority, status, scheduledDate, totalAmount, itemsUsed, serviceCharge) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, customerId, customerName, type, description, priority, status, scheduledDate, totalAmount, JSON.stringify(itemsUsed), serviceCharge]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  const { status, assignedTechnicianId, itemsUsed, serviceCharge, totalAmount, completedDate, paymentMode, technicianNotes, nextFollowUp } = req.body;
  try {
    const db = getDb();
    await db.run(
      `UPDATE tickets SET 
       status = COALESCE(?, status), 
       assignedTechnicianId = COALESCE(?, assignedTechnicianId),
       itemsUsed = COALESCE(?, itemsUsed),
       serviceCharge = COALESCE(?, serviceCharge),
       totalAmount = COALESCE(?, totalAmount),
       completedDate = COALESCE(?, completedDate),
       paymentMode = COALESCE(?, paymentMode),
       technicianNotes = COALESCE(?, technicianNotes),
       nextFollowUp = COALESCE(?, nextFollowUp)
       WHERE id = ?`,
      [status, assignedTechnicianId, itemsUsed ? JSON.stringify(itemsUsed) : null, serviceCharge, totalAmount, completedDate, paymentMode, technicianNotes, nextFollowUp, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Customers ---
app.post('/api/customers', async (req, res) => {
  const { id, name, phone, address, type } = req.body;
  try {
    const db = getDb();
    await db.run('INSERT INTO customers (id, name, phone, address, type) VALUES (?, ?, ?, ?, ?)', [id, name, phone, address, type]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/machines', async (req, res) => {
  const { customerId, modelNo, installationDate, warrantyExpiry, amcActive, amcExpiry } = req.body;
  try {
    const db = getDb();
    await db.run(
      'INSERT INTO machines (customerId, modelNo, installationDate, warrantyExpiry, amcActive, amcExpiry) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, modelNo, installationDate, warrantyExpiry, amcActive ? 1 : 0, amcExpiry]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Leads ---
app.post('/api/leads', async (req, res) => {
  const { id, name, phone, source, status, notes, createdAt } = req.body;
  try {
    const db = getDb();
    await db.run(
      'INSERT INTO leads (id, name, phone, source, status, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, source, status, notes, createdAt]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  const { status, nextFollowUp, estimateValue } = req.body;
  try {
    const db = getDb();
    await db.run(
      'UPDATE leads SET status = ?, nextFollowUp = COALESCE(?, nextFollowUp), estimateValue = COALESCE(?, estimateValue) WHERE id = ?',
      [status, nextFollowUp, estimateValue, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Parts ---
app.post('/api/parts', async (req, res) => {
  const { id, name, category, price, warrantyMonths } = req.body;
  try {
    const db = getDb();
    await db.run(
      'INSERT INTO parts (id, name, category, price, warrantyMonths) VALUES (?, ?, ?, ?, ?)',
      [id, name, category, price, warrantyMonths]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
