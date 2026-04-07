import fs from 'fs';
import path from 'path';

// In-memory storage (resets on each invocation in Vercel)
let orders = [];

// Try to load from file if it exists
const dbPath = '/tmp/orders.json';
function loadOrders() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      orders = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    orders = [];
  }
}

function saveOrders() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error saving orders:', error);
  }
}

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "OD-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Load orders on startup
loadOrders();

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json(orders);
  }

  if (req.method === 'POST') {
    const { items, total, phone, screenshot } = req.body;
    
    if (!items || !total || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = generateToken();
    const newOrder = {
      id: orders.length + 1,
      token,
      items: typeof items === 'string' ? JSON.parse(items) : items,
      total: parseFloat(total),
      screenshot: screenshot || null,
      timestamp: Date.now(),
      status: 'processing',
      phone
    };

    orders.push(newOrder);
    saveOrders();

    return res.status(200).json(newOrder);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
