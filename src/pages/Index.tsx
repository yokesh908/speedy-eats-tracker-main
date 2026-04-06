import { useState, useRef, useCallback } from "react";
import { MENU_ITEMS, generateToken, getCategoryColor } from "@/lib/store";
import type { OrderItem, Category } from "@/lib/store";
import { useCreateOrder, useGetOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, QrCode, Upload, CheckCircle2, Search } from "lucide-react";

type Filter = "All" | Category;
const FILTERS: Filter[] = ["All", "Veg", "Non-Veg", "Egg", "Biryani"];

export default function Index() {
  const [filter, setFilter] = useState<Filter>("All");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [token, setToken] = useState("");
  const [checkIdentifier, setCheckIdentifier] = useState("");
  const [checkedOrder, setCheckedOrder] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createOrderMutation = useCreateOrder();
  const getOrderMutation = useGetOrder();

  const filtered = filter === "All" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === filter);

  const setQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const next = Math.max(0, (prev[id] ; 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  const selectedItems: OrderItem[] = MENU_ITEMS
    .filter(item => (quantities[item.id] ; 0) > 0)
    .map(item => ({ item, quantity: quantities[item.id] }));

  const total = selectedItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  const validatePhone = (value: string) => /^\d{10}$/.test(value);

  const handleFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const confirmOrder = async () => {
    if (!validatePhone(phone)) {
      toast({ title: "Invalid phone number", description: "Please enter a 10-digit phone number.", variant: "destructive" });
      return;
    }

    if (selectedItems.length === 0) {
      toast({ title: "No items selected", description: "Please select at least one menu item.", variant: "destructive" });
      return;
    }

    if (!screenshot) {
      toast({ title: "Screenshot required", description: "Please upload your payment screenshot.", variant: "destructive" });
      return;
    }

    const newToken = generateToken();

    try {
      await createOrderMutation.mutateAsync({
        token: newToken,
        items: selectedItems,
        total,
        screenshot,
        timestamp: Date.now(),
        status: "processing",
        phone: phone.trim(),
      });
      setToken(newToken);
      setOrderPlaced(true);
    } catch (error) {
      toast({ title: "Order failed", description: "Unable to place your order. Please try again.", variant: "destructive" });
    }
  };

  const checkStatus = async () => {
    if (!checkIdentifier.trim()) {
      toast({ title: "Identifier required", description: "Enter a token or phone number.", variant: "destructive" });
      return;
    }

    try {
      const order = await getOrderMutation.mutateAsync(checkIdentifier.trim());
      setCheckedOrder(order);
    } catch (error) {
      toast({ title: "Order not found", description: "Please check the token or phone number.", variant: "destructive" });
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 shadow-xl">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="text-3xl font-bold text-center">Order Placed</h1>
          <p className="text-center text-gray-600">Waiting for confirmation.</p>
          <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-center">
            <p className="text-sm text-gray-500">Token Number</p>
            <p className="text-3xl font-semibold text-blue-700">{token}</p>
            <p className="mt-2 text-gray-700">Phone: {phone}</p>
            <p className="mt-1 text-gray-700">Total: ₹{total}</p>
          </div>
          <Button className="w-full mt-6" onClick={() => { setOrderPlaced(false); setQuantities({}); setScreenshot(null); setPhone(""); setToken(""); }}>
            Place Another Order
          </Button>
        </Card>
      </div>
    );
  }

  if (checkedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-center">Order Status</h1>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-gray-100 p-4">
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-lg font-semibold">{checkedOrder.phone}</p>
            </div>
            <div className="rounded-2xl bg-gray-100 p-4">
              <p className="text-sm text-gray-600">Token</p>
              <p className="text-lg font-semibold">{checkedOrder.token}</p>
            </div>
            <div className="rounded-2xl bg-gray-100 p-4">
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={checkedOrder.status === "processing" ? "bg-yellow-500" : "bg-emerald-500"}>
                {checkedOrder.status === "processing" ? "Your order is being prepared" : "Your order is confirmed, collect at counter"}
              </Badge>
            </div>
            <div className="rounded-2xl bg-gray-100 p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-semibold">₹{checkedOrder.total}</p>
            </div>
            <div className="rounded-2xl bg-gray-100 p-4">
              <p className="text-sm text-gray-600">Items</p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                {checkedOrder.items.map((oi: any, index: number) => (
                  <li key={index}>{oi.item.name} ×{oi.quantity} — ₹{oi.item.price * oi.quantity}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button className="w-full mt-6" onClick={() => { setCheckedOrder(null); setCheckIdentifier(""); }}>
            Check Another Order
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6 shadow-xl">
          <h1 className="text-3xl font-bold text-center">Welcome to Outdoor Delivery</h1>
          <p className="text-center text-gray-600 mt-2">Place your order, upload payment screenshot, and receive your ticket.</p>
        </Card>

        <Card className="p-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <h2 className="font-semibold text-lg">📱 Phone Number</h2>
              <Input
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
              {phone && !validatePhone(phone) ? <p className="text-sm text-red-500 mt-2">Only numbers, 10 digits required.</p> : null}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">🔍 Check Status</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Token or phone"
                  value={checkIdentifier}
                  onChange={e => setCheckIdentifier(e.target.value)}
                />
                <Button onClick={checkStatus} disabled={getOrderMutation.isPending}>
                  {getOrderMutation.isPending ? "Checking..." : "Check"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3">🟡 Menu</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTERS.map(item => (
                <Button
                  key={item}
                  size="sm"
                  variant={filter === item ? "default" : "outline"}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">₹{item.price}</p>
                    </div>
                    <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setQty(item.id, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{quantities[item.id] || 0}</span>
                      <Button size="sm" variant="outline" onClick={() => setQty(item.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-gray-700">Qty</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {selectedItems.length > 0 ? (
            <div className="space-y-6">
              <Card className="p-5 bg-blue-50 border border-blue-100">
                <h2 className="font-semibold text-lg mb-3">🧾 Order Ticket</h2>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Phone:</strong> {phone || 'Not provided'}</p>
                  <p><strong>Token:</strong> {token || 'Will be generated'}</p>
                  <div>
                    <strong>Items:</strong>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      {selectedItems.map(entry => (
                        <li key={entry.item.id}>{entry.item.name} ×{entry.quantity} — ₹{entry.item.price * entry.quantity}</li>
                      ))}
                    </ul>
                  </div>
                  <p><strong>Total:</strong> ₹{total}</p>
                  <p><strong>Status:</strong> Processing</p>
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-5">
                  <h2 className="font-semibold text-lg mb-3">📸 Screenshot Upload</h2>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {screenshot ? 'Screenshot ready' : 'Upload screenshot'}
                  </Button>
                  {screenshot ? <p className="text-sm text-emerald-600 mt-2">Screenshot uploaded.</p> : null}
                </Card>
                <Card className="p-5 text-center">
                  <QrCode className="mx-auto h-16 w-16 text-gray-400 mb-3" />
                  <p className="font-semibold">Scan & Pay Manually</p>
                  <p className="text-sm text-gray-600 mt-1">Pay the total amount and upload your screenshot.</p>
                </Card>
              </div>

              <Button className="w-full h-14 text-lg" onClick={confirmOrder} disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? 'Placing Order...' : `Confirm Order - ₹${total}`}
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">Choose items above to build your order.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
