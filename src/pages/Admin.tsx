import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOrders, useUpdateOrderStatus, useDeleteOrder, useClearAllOrders } from "@/lib/api";
import { MENU_ITEMS } from "@/lib/store";
import type { Category, Order } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, BarChart3, Tag, Lock, ShieldCheck, Trash2, XCircle, CheckCircle2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_PIN = "1432";

type FilterType = "All" | Category;
const FILTERS: FilterType[] = ["All", "Veg", "Non-Veg", "Egg", "Biryani"];

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [tab, setTab] = useState<"orders" | "summary">("orders");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const { data: orders = [], isLoading, error } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();
  const clearAllMutation = useClearAllOrders();

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MENU_ITEMS.forEach(i => (counts[i.id] = 0));
    orders.forEach(o => o.items.forEach(oi => {
      counts[oi.item.id] = (counts[oi.item.id] || 0) + oi.quantity;
    }));
    return counts;
  }, [orders]);

  const categoryCounts = useMemo(() => {
    const cats: Record<Category, number> = { Veg: 0, "Non-Veg": 0, Egg: 0, Biryani: 0 };
    orders.forEach(o => o.items.forEach(oi => {
      cats[oi.item.category] += oi.quantity;
    }));
    return cats;
  }, [orders]);

  const filteredItems = filter === "All" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === filter);
  const filteredOrders = filter === "All" ? orders : orders.filter(o => o.items.some(oi => oi.item.category === filter));
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
    } else {
      toast({ title: "Wrong PIN", description: "Please enter the correct admin PIN.", variant: "destructive" });
      setPin("");
    }
  };

  const handleDelete = async (token: string) => {
    try {
      await deleteOrderMutation.mutateAsync(token);
      toast({ title: "Order deleted", description: `Order ${token} removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllMutation.mutateAsync();
      toast({ title: "All orders cleared", description: "Order history has been reset." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to clear orders.", variant: "destructive" });
    }
  };

  const handleComplete = (order: Order) => {
    setViewingOrder(order);
  };

  const confirmComplete = async () => {
    if (!viewingOrder) return;
    try {
      await updateStatusMutation.mutateAsync({ token: viewingOrder.token, status: "confirmed" });
      setViewingOrder(null);
      toast({ title: "Order confirmed", description: `Order ${viewingOrder.token} marked as confirmed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-8 space-y-6 text-center" style={{ boxShadow: "var(--shadow-elevated)" }}>
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter PIN to continue</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="text-center text-2xl tracking-[0.5em] font-bold h-14"
              autoFocus
            />
            <Button className="w-full h-12 text-base font-semibold" type="submit">
              <ShieldCheck className="h-5 w-5 mr-2" />
              Unlock Admin
            </Button>
          </form>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Menu
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Order completion confirmation view
  if (viewingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 space-y-5" style={{ boxShadow: "var(--shadow-elevated)" }}>
          <div className="text-center space-y-2">
            <Eye className="h-10 w-10 mx-auto text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">Verify & Complete Order</h2>
          </div>

          <div className="rounded-lg bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">Token Number</p>
            <p className="text-2xl font-bold font-body tracking-widest text-primary">{viewingOrder.token}</p>
          </div>

          <div className="space-y-2">
            {viewingOrder.items.map(oi => (
              <div key={oi.item.id} className="flex justify-between text-sm">
                <span className="text-foreground">{oi.item.name} × {oi.quantity}</span>
                <span className="font-medium text-foreground">₹{oi.item.price * oi.quantity}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">₹{viewingOrder.total}</span>
            </div>
          </div>

          <div className="rounded-lg bg-secondary p-3 text-center">
            <p className="text-xs text-muted-foreground">Phone Number</p>
            <p className="text-lg font-semibold text-foreground">{viewingOrder.phone || "Not provided"}</p>
          </div>

          {viewingOrder.screenshot && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Payment Screenshot</p>
              <img src={viewingOrder.screenshot} alt="Payment" className="w-full rounded-lg bg-secondary max-h-64 object-contain" />
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setViewingOrder(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button className="flex-1" onClick={confirmComplete}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button size="icon" variant="ghost" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAuthenticated(false)} className="text-xs">
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <Package className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </Card>
          <Card className="p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <BarChart3 className="h-6 w-6 mx-auto text-accent mb-1" />
            <p className="text-2xl font-bold text-foreground">₹{totalRevenue}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(categoryCounts) as [Category, number][]).map(([cat, count]) => (
            <Card key={cat} className="p-3 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className={`w-3 h-3 rounded-full ${cat === "Veg" ? "bg-veg" : cat === "Non-Veg" ? "bg-nonveg" : cat === "Egg" ? "bg-egg" : "bg-biryani"}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{cat}</p>
                <p className="text-xs text-muted-foreground">{count} items sold</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant={tab === "summary" ? "default" : "outline"} size="sm" onClick={() => setTab("summary")} className="rounded-full">
              📊 Summary
            </Button>
            <Button variant={tab === "orders" ? "default" : "outline"} size="sm" onClick={() => setTab("orders")} className="rounded-full">
              📋 Orders
            </Button>
          </div>
          {orders.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearAll} className="rounded-full text-xs">
              <Trash2 className="h-3 w-3 mr-1" /> Clear All
            </Button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="shrink-0 rounded-full text-xs">
              {f}
            </Button>
          ))}
        </div>

        {tab === "summary" && (
          <div className="space-y-2">
            {filteredItems.map(item => (
              <Card key={item.id} className="flex items-center justify-between p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.category === "Veg" ? "bg-veg" : item.category === "Non-Veg" ? "bg-nonveg" : item.category === "Egg" ? "bg-egg" : "bg-biryani"}`} />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <Badge variant="secondary" className="text-sm font-bold">{itemCounts[item.id] || 0}</Badge>
              </Card>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-4">
            {isLoading && (
              <p className="text-center text-muted-foreground py-8">Loading orders...</p>
            )}
            {error && (
              <p className="text-center text-destructive py-8">Error loading orders. Please try again.</p>
            )}
            {!isLoading && !error && filteredOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            )}
            {filteredOrders.map((order) => (
              <Card key={order.token} className="p-4 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="font-bold font-body tracking-wider text-primary">{order.token}</span>
                    <Badge variant={order.status === "confirmed" ? "default" : "secondary"} className="text-[10px]">
                      {order.status === "confirmed" ? "✅ Confirmed" : "⏳ Processing"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(order.timestamp).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  {order.items.map(oi => (
                    <div key={oi.item.id} className="flex justify-between text-sm">
                      <span className="text-foreground">{oi.item.name} × {oi.quantity}</span>
                      <span className="text-muted-foreground">₹{oi.item.price * oi.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold text-sm">Total</span>
                  <span className="font-bold text-primary">₹{order.total}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Phone: {order.phone || "Not provided"}
                </div>
                {order.screenshot && (
                  <img src={order.screenshot} alt="Payment" className="w-full max-h-32 object-contain rounded-lg bg-secondary" />
                )}
                <div className="flex gap-2 pt-1">
                  {order.status !== "confirmed" && (
                    <Button size="sm" className="flex-1 text-xs" onClick={() => handleComplete(order)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm Order
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" className="text-xs" onClick={() => handleDelete(order.token)}>
                    <XCircle className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
