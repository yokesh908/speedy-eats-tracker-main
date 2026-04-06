import { useState, useRef, useCallback } from "react";
import { MENU_ITEMS, generateToken, getCategoryColor } from "@/lib/store";
import type { MenuItem, OrderItem, Category } from "@/lib/store";
import { useCreateOrder, useGetOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShoppingCart, QrCode, Upload, CheckCircle2, ChefHat, Trash2, Search } from "lucide-react";

type Filter = "All" | Category;
const FILTERS: Filter[] = ["All", "Veg", "Non-Veg", "Egg", "Biryani"];

export default function Index() {
  const [filter, setFilter] = useState<Filter>("All");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [token, setToken] = useState("");
  const [showTicket, setShowTicket] = useState(false);
  const [checkIdentifier, setCheckIdentifier] = useState("");
  const [checkedOrder, setCheckedOrder] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createOrderMutation = useCreateOrder();
  const getOrderMutation = useGetOrder();

  const filtered = filter === "All" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === filter);

  const setQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const val = Math.max(0, (prev[id] || 0) + delta);
      return { ...prev, [id]: val };
    });
  };

  const selectedItems: OrderItem[] = MENU_ITEMS
    .filter(i => (quantities[i.id] || 0) > 0)
    .map(i => ({ item: i, quantity: quantities[i.id] }));

  const total = selectedItems.reduce((sum, oi) => sum + oi.item.price * oi.quantity, 0);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const confirmOrder = async () => {
    if (selectedItems.length === 0) {
      toast({ title: "No items selected", description: "Please add items to your order.", variant: "destructive" });
      return;
    }
    if (!screenshot) {
      toast({ title: "Screenshot required", description: "Please upload your payment screenshot.", variant: "destructive" });
      return;
    }
    if (!validatePhone(phone)) {
      toast({ title: "Invalid phone number", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
      return;
    }
    const t = generateToken();
    try {
      await createOrderMutation.mutateAsync({
        token: t,
        items: selectedItems,
        total,
        screenshot,
        timestamp: Date.now(),
        status: "processing",
        phone: phone.trim()
      });
      setToken(t);
      setOrderPlaced(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    }
  };

  const checkStatus = async () => {
    if (!checkIdentifier.trim()) {
      toast({ title: "Identifier required", description: "Please enter token or phone number.", variant: "destructive" });
      return;
    }
    try {
      const order = await getOrderMutation.mutateAsync(checkIdentifier.trim());
      setCheckedOrder(order);
    } catch (error) {
      toast({ title: "Order not found", description: "Please check your token or phone number.", variant: "destructive" });
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-lg">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="font-bold text-3xl text-gray-800">Order Placed!</h1>
          <p className="text-gray-600">Waiting for Confirmation.</p>
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-gray-500">Token Number</p>
            <p className="text-2xl font-bold text-blue-600">{token}</p>
          </div>
          <Button className="w-full" onClick={() => { setOrderPlaced(false); setQuantities({}); setScreenshot(null); setPhone(""); setShowTicket(false); }}>
            Place Another Order
          </Button>
        </Card>
      </div>
    );
  }

  if (checkedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full p-6 space-y-4 shadow-lg">
          <h1 className="font-bold text-2xl text-center text-gray-800">Order Status</h1>
          <div className="space-y-2">
            <p><strong>Token:</strong> {checkedOrder.token}</p>
            <p><strong>Phone:</strong> {checkedOrder.phone}</p>
            <p><strong>Status:</strong> 
              <Badge className={checkedOrder.status === 'processing' ? 'bg-yellow-500' : 'bg-green-500'}>
                {checkedOrder.status === 'processing' ? 'Your order is being prepared' : 'Your order is confirmed, collect at counter'}
              </Badge>
            </p>
            <p><strong>Total:</strong> ₹{checkedOrder.total}</p>
            <div>
              <strong>Items:</strong>
              <ul className="list-disc list-inside">
                {checkedOrder.items.map((oi: any, idx: number) => (
                  <li key={idx}>{oi.item.name} x{oi.quantity} - ₹{oi.item.price * oi.quantity}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button className="w-full" onClick={() => { setCheckedOrder(null); setCheckIdentifier(""); }}>
            Check Another Order
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Check Section */}
        <Card className="p-6 shadow-lg">
          <h2 className="font-bold text-xl mb-4 flex items-center"><Search className="mr-2" /> Check Order Status</h2>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter Token or Phone Number"
              value={checkIdentifier}
              onChange={(e) => setCheckIdentifier(e.target.value)}
            />
            <Button onClick={checkStatus} disabled={getOrderMutation.isPending}>
              {getOrderMutation.isPending ? 'Checking...' : 'Check'}
            </Button>
          </div>
        </Card>

        {/* Main Order Form */}
        <Card className="p-6 shadow-lg">
          <h1 className="font-bold text-3xl text-center mb-6 text-gray-800">Welcome to Outdoor Delivery</h1>

          {/* Customer Details */}
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2">📱 Customer Details</h2>
            <Input
              type="tel"
              placeholder="Phone Number (10 digits)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className={!validatePhone(phone) && phone ? 'border-red-500' : ''}
            />
            {!validatePhone(phone) && phone && <p className="text-red-500 text-sm mt-1">Please enter a valid 10-digit phone number.</p>}
          </div>

          {/* Menu Section */}
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-4">🟡 Menu</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTERS.map(f => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  size="sm"
                >
                  {f}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">₹{item.price}</p>
                    </div>
                    <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setQty(item.id, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{quantities[item.id] || 0}</span>
                      <Button size="sm" variant="outline" onClick={() => setQty(item.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Calculator Section */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-4">🧮 Order Summary</h2>
              <div className="space-y-2">
                {selectedItems.map(oi => (
                  <div key={oi.item.id} className="flex justify-between">
                    <span>{oi.item.name} x{oi.quantity}</span>
                    <span>₹{oi.item.price * oi.quantity}</span>
                  </div>
                ))}
                <div className="border-t pt-2 font-bold flex justify-between">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>
          )}

          {/* QR Section */}
          {selectedItems.length > 0 && (
            <div className="mb-6 text-center">
              <h2 className="font-semibold text-lg mb-4">💳 Payment</h2>
              <div className="bg-gray-100 p-8 rounded-lg inline-block">
                <QrCode className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Scan & Pay Manually</p>
              </div>
            </div>
          )}

          {/* Screenshot Upload */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-4">📸 Upload Payment Screenshot</h2>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <Button onClick={() => fileRef.current?.click()} variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {screenshot ? 'Screenshot Uploaded' : 'Upload Screenshot'}
              </Button>
              {screenshot && <p className="text-green-600 text-sm mt-2">Screenshot uploaded successfully.</p>}
            </div>
          )}

          {/* Ticket View */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-4">🎫 Order Ticket</h2>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-bold text-center mb-4">Welcome to Outdoor Delivery</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>📱 Phone:</strong> {phone || 'Not provided'}</p>
                  <p><strong>🎫 Token:</strong> {token || 'Will be generated'}</p>
                  <div>
                    <strong>🧾 Items:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {selectedItems.map(oi => (
                        <li key={oi.item.id}>{oi.item.name} x{oi.quantity} - ₹{oi.item.price * oi.quantity}</li>
                      ))}
                    </ul>
                  </div>
                  <p><strong>💰 Total:</strong> ₹{total}</p>
                  <p><strong>📊 Status:</strong> Processing</p>
                </div>
                <Button className="w-full mt-4" onClick={confirmOrder} disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? 'Placing Order...' : '✅ Confirm Order'}
                </Button>
              </Card>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
    if (selectedItems.length === 0) {
      toast({ title: "No items selected", description: "Please add items to your order.", variant: "destructive" });
      return;
    }
    if (!screenshot) {
      toast({ title: "Screenshot required", description: "Please upload your payment screenshot.", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Phone number required", description: "Please enter your phone number.", variant: "destructive" });
      return;
    }
    const t = generateToken();
    try {
      await createOrderMutation.mutateAsync({
        token: t,
        items: selectedItems,
        total,
        screenshot,
        timestamp: Date.now(),
        status: "processing",
        phone: phone.trim()
      });
      setToken(t);
      setOrderPlaced(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6" style={{ boxShadow: "var(--shadow-elevated)" }}>
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
          <h1 className="font-display text-3xl font-bold text-foreground">Order Confirmed!</h1>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Your Token Number</p>
            <p className="text-3xl font-bold font-body tracking-widest text-primary">{token}</p>
          </div>
          <p className="text-muted-foreground text-sm">Total: <span className="font-semibold text-foreground">₹{total}</span></p>
          <p className="text-muted-foreground text-xs">Save this token for your reference</p>
          <Button className="w-full" onClick={() => { setOrderPlaced(false); setQuantities({}); setScreenshot(null); setPhone(""); }}>
            Place Another Order
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">Outdoor Delivery</h1>
          </div>
          <Link to="/admin">
            <Badge variant="outline" className="cursor-pointer text-xs">Admin</Badge>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-6 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-1">
          <h2 className="font-display text-2xl font-bold text-foreground">Welcome to Outdoor Delivery</h2>
          <p className="text-muted-foreground text-sm">Fresh food, delivered with love 🍛</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="shrink-0 rounded-full text-xs"
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Menu */}
        <div className="space-y-3">
          {filtered.map(item => {
            const qty = quantities[item.id] || 0;
            return (
              <Card key={item.id} className="flex items-center justify-between p-4 gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getCategoryColor(item.category)}`} />
                    <span className="font-medium text-sm text-foreground truncate">{item.name}</span>
                  </div>
                  <p className="text-primary font-semibold text-sm mt-0.5 ml-[18px]">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  {qty > 0 && (
                    <>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setQty(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-semibold text-sm">{qty}</span>
                    </>
                  )}
                  <Button size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty(item.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Calculator */}
        {selectedItems.length > 0 && (
          <Card className="p-5 space-y-4" style={{ boxShadow: "var(--shadow-elevated)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-bold">Your Order</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => { setQuantities({}); setScreenshot(null); setPhone(""); }}>
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
            <div className="space-y-2">
              {selectedItems.map(oi => (
                <div key={oi.item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{oi.item.name} × {oi.quantity}</span>
                  <span className="font-medium text-foreground">₹{oi.item.price * oi.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">₹{total}</span>
            </div>
          </Card>
        )}

        {/* QR Section */}
        {selectedItems.length > 0 && (
          <Card className="p-5 text-center space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="w-40 h-40 mx-auto bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <span className="text-muted-foreground text-xs">QR Code Here</span>
            </div>
            <p className="text-sm font-medium text-foreground">Scan & Pay Manually</p>
            <p className="text-xs text-muted-foreground">Pay ₹{total} and upload screenshot below</p>
          </Card>
        )}

        {/* Screenshot Upload */}
        {selectedItems.length > 0 && (
          <Card className="p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold">Payment Screenshot</h3>
            </div>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} className="hidden" />
            {screenshot ? (
              <div className="space-y-2">
                <img src={screenshot} alt="Payment screenshot" className="w-full rounded-lg max-h-48 object-contain bg-secondary" />
                <Button variant="outline" size="sm" onClick={() => { setScreenshot(null); if (fileRef.current) fileRef.current.value = ""; }}>
                  Remove
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full h-24 border-dashed" onClick={() => fileRef.current?.click()}>
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Tap to upload screenshot</span>
                </div>
              </Button>
            )}
          </Card>
        )}

        {/* Phone Number */}
        {selectedItems.length > 0 && (
          <Card className="p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-display text-lg font-bold">Phone Number</h3>
            <Input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full"
            />
          </Card>
        )}

        {/* Confirm */}
        {selectedItems.length > 0 && (
          <Button className="w-full h-14 text-lg font-semibold rounded-xl" onClick={confirmOrder}>
            Confirm Order — ₹{total}
          </Button>
        )}
      </main>
    </div>
  );
}
