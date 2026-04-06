import { getOrders, getOrderByToken, saveOrder, updateOrderStatus, deleteOrder, clearAllOrders, type Order } from './api';

export const MENU_ITEMS: MenuItem[] = [
  { id: "cfr", name: "Chicken Fried Rice", price: 110, category: "Non-Veg" },
  { id: "cfn", name: "Chicken Fried Noodles", price: 110, category: "Non-Veg" },
  { id: "er", name: "Egg Rice", price: 100, category: "Egg" },
  { id: "en", name: "Egg Noodles", price: 100, category: "Egg" },
  { id: "em", name: "Egg Manchurian", price: 100, category: "Egg" },
  { id: "egr", name: "Egg Gobi Rice", price: 100, category: "Egg" },
  { id: "vr", name: "Veg Rice", price: 90, category: "Veg" },
  { id: "vn", name: "Veg Noodles", price: 90, category: "Veg" },
  { id: "vm", name: "Veg Manchurian", price: 90, category: "Veg" },
  { id: "vgr", name: "Veg Gobi Rice", price: 90, category: "Veg" },
  { id: "db", name: "Dum Biryani", price: 200, category: "Biryani" },
  { id: "fb", name: "Fry Biryani", price: 200, category: "Biryani" },
  { id: "mb", name: "Mix Biryani", price: 200, category: "Biryani" },
];

export function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "OD-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export { getOrders, saveOrder, updateOrderStatus, deleteOrder, clearAllOrders };

export function getCategoryColor(cat: Category): string {
  switch (cat) {
    case "Veg": return "bg-veg";
    case "Non-Veg": return "bg-nonveg";
    case "Egg": return "bg-egg";
    case "Biryani": return "bg-biryani";
  }
}
