
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

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    
    if (user) {
      // Check status
      if (user.status === 'Inactive') {
        return res.status(403).json({ error: 'Account is inactive. Contact Admin.' });
      }
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const users = await db.all('SELECT id, name, email, role, phone, address, status FROM users'); // Exclude password
    
    // Parse JSON fields for tickets (itemsUsed)
    const ticketsParsed = tickets.map(t => ({
      ...t,
      itemsUsed: t.itemsUsed ? JSON.parse(t.itemsUsed) : []
    }));

    res.json({ tickets: ticketsParsed, customers, leads, parts, machineTypes, users });
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

app.put('/api/tickets/:id', async (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const data = req.body;

    const allowedColumns = [
      'customerId', 'customerName', 'type', 'description', 'priority', 'status', 
      'assignedTechnicianId', 'scheduledDate', 'completedDate', 'itemsUsed', 
      'serviceCharge', 'totalAmount', 'paymentMode', 'technicianNotes', 'nextFollowUp'
    ];

    const updates = [];
    const values = [];

    for (const col of allowedColumns) {
      if (data[col] !== undefined) {
        updates.push(`${col} = ?`);
        let val = data[col];
        if ((col === 'itemsUsed') && typeof val === 'object') {
            val = JSON.stringify(val);
        }
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'No fields to update' });
    }

    const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);
    await db.run(sql, values);

    if (data.assignedTechnicianId && data.scheduledDate) {
         await db.run(
            `INSERT INTO ticket_assignment_history (ticketId, technicianId, assignedAt, scheduledDate) 
             VALUES (?, ?, ?, ?)`,
            [id, data.assignedTechnicianId, new Date().toISOString(), data.scheduledDate]
         );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id/history', async (req, res) => {
    try {
        const db = getDb();
        const history = await db.all(
            'SELECT * FROM ticket_assignment_history WHERE ticketId = ? ORDER BY assignedAt DESC', 
            [req.params.id]
        );
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
    await db.run(
      'INSERT INTO customers (id, name, phone, address, type) VALUES (?, ?, ?, ?, ?)',
      [id, name, phone, address, type]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Machines ---
app.post('/api/machines', async (req, res) => {
  const { customerId, modelNo, installationDate, warrantyExpiry, amcActive, amcExpiry } = req.body;
  try {
    const db = getDb();
    await db.run(
      `INSERT INTO machines (customerId, modelNo, installationDate, warrantyExpiry, amcActive, amcExpiry) 
       VALUES (?, ?, ?, ?, ?, ?)`,
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
      `INSERT INTO leads (id, name, phone, source, status, notes, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
      `UPDATE leads SET status = ?, nextFollowUp = COALESCE(?, nextFollowUp), estimateValue = COALESCE(?, estimateValue) WHERE id = ?`,
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
      `INSERT INTO parts (id, name, category, price, warrantyMonths) VALUES (?, ?, ?, ?, ?)`,
      [id, name, category, price, warrantyMonths]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Machine Types ---
app.post('/api/machine-types', async (req, res) => {
    const { id, modelName, description, warrantyMonths, price } = req.body;
    try {
      const db = getDb();
      await db.run(
        `INSERT INTO machine_types (id, modelName, description, warrantyMonths, price) VALUES (?, ?, ?, ?, ?)`,
        [id, modelName, description, warrantyMonths, price]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// --- Users ---
app.post('/api/users', async (req, res) => {
  const { id, name, email, password, role, phone, address, status } = req.body;
  try {
    const db = getDb();
    await db.run(
        `INSERT INTO users (id, name, email, password, role, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [id, name, email, password, role, phone || '', address || '', status || 'Active']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, email, password, role, phone, address, status } = req.body;
    const id = req.params.id;
    try {
        const db = getDb();
        
        // Dynamically build update query
        const updates = [];
        const values = [];
        
        if (name) { updates.push('name = ?'); values.push(name); }
        if (email) { updates.push('email = ?'); values.push(email); }
        if (password) { updates.push('password = ?'); values.push(password); }
        if (role) { updates.push('role = ?'); values.push(role); }
        if (phone) { updates.push('phone = ?'); values.push(phone); }
        if (address) { updates.push('address = ?'); values.push(address); }
        if (status) { updates.push('status = ?'); values.push(status); }
        
        if (updates.length === 0) return res.json({ success: true });

        values.push(id);
        await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const db = getDb();
        // Prevent deleting last admin
        const admins = await db.all("SELECT id FROM users WHERE role = 'Admin'");
        if (admins.length === 1 && admins[0].id === req.params.id) {
            return res.status(400).json({ error: "Cannot delete the only Admin user." });
        }
        
        await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
