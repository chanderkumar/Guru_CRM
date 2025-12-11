
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
    
    // Fetch nested data for customers (machines) and calculate AMC expiries
    const amcExpiries = [];
    const today = new Date();
    today.setHours(0,0,0,0); 
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23,59,59,999);

    for (let customer of customers) {
      customer.machines = await db.all('SELECT * FROM machines WHERE customerId = ?', [customer.id]);
      customer.machines = customer.machines.map(m => ({
        ...m,
        amcActive: !!m.amcActive
      }));

      for (let m of customer.machines) {
          if (m.amcActive && m.amcExpiry) {
              const expiryDate = new Date(m.amcExpiry);
              expiryDate.setHours(0,0,0,0);

              if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
                  const timeDiff = expiryDate.getTime() - today.getTime();
                  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                  
                  amcExpiries.push({
                      customerId: customer.id,
                      customerName: customer.name,
                      phone: customer.phone,
                      machineModel: m.modelNo,
                      expiryDate: m.amcExpiry,
                      daysRemaining
                  });
              }
          }
      }
    }

    const leads = await db.all('SELECT * FROM leads');
    const parts = await db.all('SELECT * FROM parts');
    const machineTypes = await db.all('SELECT * FROM machine_types');
    const users = await db.all('SELECT id, name, email, role, phone, address, status FROM users');
    
    const ticketsParsed = tickets.map(t => ({
      ...t,
      itemsUsed: t.itemsUsed ? JSON.parse(t.itemsUsed) : []
    }));

    res.json({ tickets: ticketsParsed, customers, leads, parts, machineTypes, users, amcExpiries });
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
      'serviceCharge', 'totalAmount', 'paymentMode', 'technicianNotes', 'nextFollowUp', 'cancellationReason'
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

    // History Log
    if (data.assignedTechnicianId && data.scheduledDate) {
         await db.run(
            `INSERT INTO ticket_assignment_history (ticketId, technicianId, assignedAt, scheduledDate) 
             VALUES (?, ?, ?, ?)`,
            [id, data.assignedTechnicianId, new Date().toISOString(), data.scheduledDate]
         );
    }

    // Deduct Stock
    if (data.status === 'Completed' && data.itemsUsed && Array.isArray(data.itemsUsed)) {
        for (const item of data.itemsUsed) {
            await db.run(
                'UPDATE parts SET stockQuantity = stockQuantity - ? WHERE id = ?',
                [item.quantity, item.partId]
            );
        }
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
    const result = await db.run(
      `INSERT INTO machines (customerId, modelNo, installationDate, warrantyExpiry, amcActive, amcExpiry) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, modelNo, installationDate, warrantyExpiry, amcActive ? 1 : 0, amcExpiry]
    );
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/machines/:id', async (req, res) => {
    const id = req.params.id;
    const { modelNo, installationDate, warrantyExpiry, amcActive, amcExpiry } = req.body;
    try {
        const db = getDb();
        await db.run(
            `UPDATE machines SET modelNo=?, installationDate=?, warrantyExpiry=?, amcActive=?, amcExpiry=? WHERE id=?`,
            [modelNo, installationDate, warrantyExpiry, amcActive ? 1 : 0, amcExpiry, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/machines/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.run('DELETE FROM machines WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Leads (Expanded) ---
app.post('/api/leads', async (req, res) => {
  const { id, name, phone, email, address, source, status, notes, createdAt } = req.body;
  try {
    const db = getDb();
    await db.run(
      `INSERT INTO leads (id, name, phone, email, address, source, status, notes, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, phone, email || '', address || '', source, status, notes, createdAt]
    );
    
    // Log creation history
    await db.run(
        `INSERT INTO lead_history (leadId, action, details, timestamp) VALUES (?, ?, ?, ?)`,
        [id, 'Created', `Lead created via ${source}`, new Date().toISOString()]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  const id = req.params.id;
  const updates = req.body; // status, nextFollowUp, estimateValue, email, name, etc.
  
  try {
    const db = getDb();
    const allowed = ['name', 'phone', 'email', 'address', 'status', 'nextFollowUp', 'estimateValue', 'notes'];
    const sqlUpdates = [];
    const values = [];

    // Get old status to compare
    const oldLead = await db.get("SELECT status, notes FROM leads WHERE id = ?", [id]);

    for (const key of allowed) {
        if (updates[key] !== undefined) {
            sqlUpdates.push(`${key} = ?`);
            values.push(updates[key]);
        }
    }
    
    if(sqlUpdates.length === 0) return res.json({success: true});

    values.push(id);
    await db.run(`UPDATE leads SET ${sqlUpdates.join(', ')} WHERE id = ?`, values);

    // Logging History
    const timestamp = new Date().toISOString();
    
    if (updates.status && updates.status !== oldLead.status) {
        await db.run(`INSERT INTO lead_history (leadId, action, details, timestamp) VALUES (?, ?, ?, ?)`, 
            [id, 'Status Change', `Status changed from ${oldLead.status} to ${updates.status}`, timestamp]);
    }
    
    if (updates.notes && updates.notes !== oldLead.notes) {
         await db.run(`INSERT INTO lead_history (leadId, action, details, timestamp) VALUES (?, ?, ?, ?)`, 
            [id, 'Note Added', `Note updated`, timestamp]);
    }
    
    if (updates.nextFollowUp) {
         await db.run(`INSERT INTO lead_history (leadId, action, details, timestamp) VALUES (?, ?, ?, ?)`, 
            [id, 'Follow-up Set', `Next follow-up set for ${updates.nextFollowUp}`, timestamp]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.run('DELETE FROM lead_history WHERE leadId = ?', [req.params.id]);
        await db.run('DELETE FROM leads WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/leads/:id/history', async (req, res) => {
    try {
        const db = getDb();
        const history = await db.all('SELECT * FROM lead_history WHERE leadId = ? ORDER BY timestamp DESC', [req.params.id]);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/leads/:id/convert', async (req, res) => {
    const leadId = req.params.id;
    try {
        const db = getDb();
        const lead = await db.get('SELECT * FROM leads WHERE id = ?', [leadId]);
        
        if (!lead) return res.status(404).json({error: "Lead not found"});

        // Create Customer
        const customerId = `c${Date.now()}`;
        await db.run(
            'INSERT INTO customers (id, name, phone, address, type) VALUES (?, ?, ?, ?, ?)',
            [customerId, lead.name, lead.phone, lead.address || 'Address pending', 'Guru-Installed']
        );

        // Update Lead status to Installed/Sold if not already
        await db.run('UPDATE leads SET status = ? WHERE id = ?', ['Installed', leadId]);
        
        await db.run(`INSERT INTO lead_history (leadId, action, details, timestamp) VALUES (?, ?, ?, ?)`, 
            [leadId, 'Converted', `Converted to Customer ID: ${customerId}`, new Date().toISOString()]);

        res.json({ success: true, customerId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Parts ---
app.post('/api/parts', async (req, res) => {
  const { id, name, category, price, warrantyMonths, stockQuantity } = req.body;
  try {
    const db = getDb();
    await db.run(
      `INSERT INTO parts (id, name, category, price, warrantyMonths, stockQuantity) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, category, price, warrantyMonths, stockQuantity || 0]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/parts/:id', async (req, res) => {
    const { name, category, price, warrantyMonths, stockQuantity } = req.body;
    const id = req.params.id;
    try {
      const db = getDb();
      await db.run(
        `UPDATE parts SET name = ?, category = ?, price = ?, warrantyMonths = ?, stockQuantity = ? WHERE id = ?`,
        [name, category, price, warrantyMonths, stockQuantity, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// --- Machine Types (Master) ---
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
