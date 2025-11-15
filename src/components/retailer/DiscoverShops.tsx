import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Plus, AlertCircle } from "lucide-react";

interface AvailableShop {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
}

interface DiscoverShopsProps {
  onShopsLoaded?: () => void;
}

export default function DiscoverShops({ onShopsLoaded }: DiscoverShopsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shops, setShops] = useState<AvailableShop[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShop, setSelectedShop] = useState<AvailableShop | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectForm, setConnectForm] = useState({
    partnershipType: "DEALER",
    commissionRate: "",
    creditLimit: "",
    paymentTerms: "NET_30",
  });

  const loadShops = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await RetailerAPI.shops.available();
      const availableShops = response?.availableShops || [];
      setShops(availableShops);
      onShopsLoaded?.();
    } catch (e) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as Record<string, unknown>).message)
          : "Failed to load available shops";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onShopsLoaded]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const filtered = useMemo(() => {
    if (!search) return shops;
    const q = search.toLowerCase();
    return shops.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    });
  }, [shops, search]);

  const handleConnect = async () => {
    if (!selectedShop) return;

    const errors: string[] = [];
    if (!connectForm.partnershipType) errors.push("Partnership type required");
    const commission = connectForm.commissionRate
      ? parseFloat(connectForm.commissionRate)
      : undefined;
    if (
      connectForm.commissionRate &&
      (isNaN(commission as number) ||
        (commission as number) < 0 ||
        (commission as number) > 100)
    ) {
      errors.push("Commission must be 0-100");
    }
    const credit = connectForm.creditLimit
      ? parseFloat(connectForm.creditLimit)
      : undefined;
    if (
      connectForm.creditLimit &&
      (isNaN(credit as number) || (credit as number) < 0)
    ) {
      errors.push("Credit limit must be positive");
    }

    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    try {
      setConnecting(true);
      await RetailerAPI.shops.add({
        shopId: selectedShop.id,
        partnershipType: connectForm.partnershipType as
          | "DEALER"
          | "FRANCHISE"
          | "DISTRIBUTOR",
        commissionRate: commission,
        creditLimit: credit,
        paymentTerms: connectForm.paymentTerms,
      });
      toast.success(`Connected to ${selectedShop.name}`);
      setConnectOpen(false);
      setSelectedShop(null);
      setConnectForm({
        partnershipType: "DEALER",
        commissionRate: "",
        creditLimit: "",
        paymentTerms: "NET_30",
      });
      // Reload available shops
      await loadShops();
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to connect shop";
      toast.error(errorMsg);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-brand-gradient">Discover Shops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-red-200">
        <CardHeader>
          <CardTitle className="text-brand-gradient">Discover Shops</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-brand-gradient">
              Discover Shops
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Find and connect with new shop partners
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={refreshing || loading}
            onClick={() => {
              setRefreshing(true);
              loadShops();
            }}
          >
            {refreshing ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Search shops by name, address, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {filtered.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {search
                ? "No shops match your search"
                : "No available shops to connect"}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((shop) => (
              <div
                key={shop.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors space-y-3"
              >
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    {shop.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {shop.id}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {shop.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{shop.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {shop.email}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Added: {new Date(shop.createdAt).toLocaleDateString()}
                </div>

                <Dialog
                  open={connectOpen && selectedShop?.id === shop.id}
                  onOpenChange={(open) => {
                    if (open) {
                      setSelectedShop(shop);
                      setConnectOpen(true);
                    } else {
                      setConnectOpen(false);
                      setSelectedShop(null);
                    }
                  }}
                >
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedShop(shop);
                      setConnectOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Connect
                  </Button>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect to {shop.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Partnership Type *
                          </label>
                          <select
                            className="w-full border rounded-md p-2"
                            value={connectForm.partnershipType}
                            onChange={(e) =>
                              setConnectForm((f) => ({
                                ...f,
                                partnershipType: e.target.value,
                              }))
                            }
                          >
                            {["DEALER", "FRANCHISE", "DISTRIBUTOR"].map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Commission Rate (%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100"
                            value={connectForm.commissionRate}
                            onChange={(e) =>
                              setConnectForm((f) => ({
                                ...f,
                                commissionRate: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Credit Limit
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={connectForm.creditLimit}
                            onChange={(e) =>
                              setConnectForm((f) => ({
                                ...f,
                                creditLimit: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Payment Terms
                          </label>
                          <select
                            className="w-full border rounded-md p-2"
                            value={connectForm.paymentTerms}
                            onChange={(e) =>
                              setConnectForm((f) => ({
                                ...f,
                                paymentTerms: e.target.value,
                              }))
                            }
                          >
                            {["NET_15", "NET_30", "NET_45", "NET_60"].map(
                              (t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setConnectOpen(false);
                            setSelectedShop(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={connecting}
                          onClick={handleConnect}
                        >
                          {connecting ? "Connecting..." : "Connect"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
