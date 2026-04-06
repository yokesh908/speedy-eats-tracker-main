const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for Vercel (since SQLite doesn't work well)
let orders = [];
const DB_FILE = path.join(__dirname, 'orders.json');

// Load orders from file
function loadOrders() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      orders = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    orders = [];
  }
}

// Save orders to file
function saveOrders() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error saving orders:', error);
  }
}

// Load orders on startup
loadOrders();

// Routes

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Get order by token
app.get('/api/orders/:token', (req, res) => {
  const { token } = req.params;
  const order = orders.find(o => o.token === token);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Create new order
app.post('/api/orders', (req, res) => {
  const { items, total, phone, screenshot } = req.body;
  if (!items || !total || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token = generateToken();
  const newOrder = {
    id: orders.length + 1,
    token,
    items: JSON.parse(items),
    total: parseFloat(total),
    screenshot: screenshot || null,
    timestamp: Date.now(),
    status: 'processing',
    phone
  };

  orders.push(newOrder);
  saveOrders();

  res.json(newOrder);
});

// Update order status
app.put('/api/orders/:token/status', (req, res) => {
  const { token } = req.params;
  const { status } = req.body;

  if (!['processing', 'confirmed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const orderIndex = orders.findIndex(o => o.token === token);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders[orderIndex].status = status;
  saveOrders();
  res.json(orders[orderIndex]);
});

  res.json({ message: 'Order status updated' });
});

// Delete order
app.delete('/api/orders/:token', (req, res) => {
  const { token } = req.params;
  const orderIndex = orders.findIndex(o => o.token === token);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders.splice(orderIndex, 1);
  saveOrders();

  res.json({ message: 'Order deleted' });
});

// Clear all orders
app.delete('/api/orders', (req, res) => {
  orders = [];
  saveOrders();
  res.json({ message: 'All orders cleared' });
});

// Generate token
function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "OD-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Start server (only in development)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;