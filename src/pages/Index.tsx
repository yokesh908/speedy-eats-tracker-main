import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MENU_ITEMS, MenuItem, OrderItem, Category, generateToken } from "@/lib/store";
import { useCreateOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShoppingCart, QrCode, Upload, CheckCircle2, ChefHat, Trash2 } from "lucide-react";

type Filter = "All" | Category;
const FILTERS: Filter[] = ["All", "Veg", "Non-Veg", "Egg", "Biryani"];

export default function Index() {
  const [filter, setFilter] = useState<Filter>("All");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [token, setToken] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createOrderMutation = useCreateOrder();

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

  const confirmOrder = async () => {
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
