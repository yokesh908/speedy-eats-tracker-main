import fs from 'fs';

let orders = [];
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

  const { token } = req.query;

  if (req.method === 'GET' && token) {
    const order = orders.find(o => o.token === token);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(200).json(order);
  }

  if (req.method === 'PUT' && token) {
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
    return res.status(200).json({ message: 'Order status updated' });
  }

  if (req.method === 'DELETE' && token) {
    const orderIndex = orders.findIndex(o => o.token === token);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders.splice(orderIndex, 1);
    saveOrders();
    return res.status(200).json({ message: 'Order deleted' });
  }

  if (req.method === 'DELETE' && !token) {
    orders = [];
    saveOrders();
    return res.status(200).json({ message: 'All orders cleared' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
