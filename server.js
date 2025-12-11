
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
    const machineTypes = await db.all('SELECT * FROM machine_types');
    
    // Parse JSON fields for tickets (itemsUsed)
    const ticketsParsed = tickets.map(t => ({
      ...t,
      itemsUsed: t.itemsUsed ? JSON.parse(t.itemsUsed) : []
    }));

    res.json({ tickets: ticketsParsed, customers, leads, parts, machineTypes });
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
      [id, customerId, customerName, type, description, priority, status, scheduledDate, totalAmount, JSON.stringify(itemsUsed || []), serviceCharge]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Robust Dynamic Update Endpoint
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const data = req.body;

    // Define allowed columns to prevent SQL injection or invalid column errors
    const allowedColumns = [
      'customerId', 'customerName', 'type', 'description', 'priority', 'status', 
      'assignedTechnicianId', 'scheduledDate', 'completedDate', 'itemsUsed', 
      'serviceCharge', 'totalAmount', 'paymentMode', 'technicianNotes', 'nextFollowUp'
    ];

    const updates = [];
    const values = [];

    // Dynamically build the SET clause based on fields present in req.body
    for (const col of allowedColumns) {
      if (data[col] !== undefined) {
        updates.push(`${col} = ?`);
        let val = data[col];
        // Ensure array/objects are stringified for TEXT columns
        if ((col === 'itemsUsed') && typeof val === 'object') {
            val = JSON.stringify(val);
        }
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: "No fields to update" });
    }

    values.push(id); // Add ID for the WHERE clause
    const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;

    console.log(`[Update Ticket] ID: ${id}, Fields: ${updates.join(', ')}`);
    
    await db.run(sql, values);

    // --- History Tracking ---
    // If assignedTechnicianId or scheduledDate is changing, log it.
    if (data.assignedTechnicianId && data.scheduledDate) {
        await db.run(
            `INSERT INTO ticket_assignment_history (ticketId, technicianId, assignedAt, scheduledDate) VALUES (?, ?, ?, ?)`,
            [id, data.assignedTechnicianId, new Date().toISOString(), data.scheduledDate]
        );
        console.log(`[History] Logged assignment for ticket ${id}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Update Ticket Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id/history', async (req, res) => {
    try {
        const db = getDb();
        const history = await db.all('SELECT * FROM ticket_assignment_history WHERE ticketId = ? ORDER BY assignedAt DESC', [req.params.id]);
        res.json(history);
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
    // Simple dynamic update for leads
    const updates = [];
    const values = [];
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (nextFollowUp !== undefined) { updates.push('nextFollowUp = ?'); values.push(nextFollowUp); }
    if (estimateValue !== undefined) { updates.push('estimateValue = ?'); values.push(estimateValue); }
    
    values.push(req.params.id);
    
    if (updates.length > 0) {
        await db.run(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, values);
    }
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

// --- Machine Master ---
app.post('/api/machine-types', async (req, res) => {
  const { id, modelName, description, warrantyMonths, price } = req.body;
  try {
    const db = getDb();
    await db.run(
      'INSERT INTO machine_types (id, modelName, description, warrantyMonths, price) VALUES (?, ?, ?, ?, ?)',
      [id, modelName, description, warrantyMonths, price]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});