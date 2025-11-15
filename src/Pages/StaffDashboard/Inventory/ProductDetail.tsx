import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { StaffAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit3, ArrowLeft, RefreshCcw } from "lucide-react";

interface ProductData {
  id: number;
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
  basePrice?: number;
  currentStock?: number;
  eyewearType?: string;
  material?: string;
  color?: string;
  size?: string;
  model?: string;
  imageUrl?: string;
  company?: { id: number; name: string };
}

const statusColor = (qty: number | undefined) => {
  if (qty == null) return "bg-gray-300 text-gray-700";
  if (qty <= 0) return "bg-red-600 text-white";
  if (qty < 5) return "bg-orange-500 text-white";
  return "bg-green-600 text-white";
};

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);
  const [loading, setLoading] = useState(true);
  // Removed inline edit saving state; editing now handled on dedicated page
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  // Inline editing state removed (edit now happens on /inventory/products/:id/edit)

  const fetchProduct = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const data = await StaffAPI.inventory.getProductById(productId);
      setProduct(data);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  // Editing logic removed; dedicated ProductEdit page handles diff + save

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Inventory / Products / {productId}
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && error && <Alert variant="destructive">{error}</Alert>}

      {!loading && !error && product && (
        <>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image & Gallery Placeholder */}
            <div className="w-full md:w-80 space-y-4">
              <div className="aspect-square w-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-contain max-w-full max-h-full"
                  />
                ) : (
                  "Primary Image"
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground"
                  >
                    Img {i + 1}
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline">
                Upload Images (Future)
              </Button>
            </div>

            {/* Core Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold">{product.name}</h1>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {product.barcode && (
                      <span className="px-2 py-0.5 bg-muted rounded">
                        BARCODE: {product.barcode}
                      </span>
                    )}
                    {product.sku && (
                      <span className="px-2 py-0.5 bg-muted rounded">
                        SKU: {product.sku}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded ${statusColor(
                        product.currentStock
                      )}`}
                    >
                      Stock: {product.currentStock ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/staff-dashboard/inventory/products/${product.id}/edit`
                      )
                    }
                  >
                    <Edit3 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={fetchProduct}>
                    <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {product.eyewearType && (
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    {product.eyewearType}
                  </div>
                )}
                {product.material && (
                  <div>
                    <span className="font-medium">Material:</span>{" "}
                    {product.material}
                  </div>
                )}
                {product.color && (
                  <div>
                    <span className="font-medium">Color:</span> {product.color}
                  </div>
                )}
                {product.size && (
                  <div>
                    <span className="font-medium">Size:</span> {product.size}
                  </div>
                )}
                {product.model && (
                  <div>
                    <span className="font-medium">Model:</span> {product.model}
                  </div>
                )}
                {product.company?.name && (
                  <div>
                    <span className="font-medium">Company:</span>{" "}
                    {product.company.name}
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex flex-wrap gap-6 items-end">
                <div className="space-y-1">
                  <div className="text-xs uppercase text-muted-foreground">
                    Base Price
                  </div>
                  <div className="text-lg font-medium">
                    {product.basePrice != null
                      ? `₹${product.basePrice.toFixed(2)}`
                      : "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase text-muted-foreground">
                    Stock Status
                  </div>
                  <div className="text-sm">
                    {product.currentStock != null
                      ? product.currentStock <= 0
                        ? "Out of Stock"
                        : product.currentStock < 5
                        ? "Low Stock"
                        : "In Stock"
                      : "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase text-muted-foreground">
                    Next Action
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/staff-dashboard/inventory/stock-in?productId=${product.id}`
                        )
                      }
                    >
                      Stock In
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate("/staff-dashboard/inventory/quick-stock")
                      }
                    >
                      Stock Update
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate("/staff-dashboard/inventory/stock-out")
                      }
                    >
                      Stock Out
                    </Button>
                  </div>
                </div>
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground max-w-prose pt-2">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          {/* Tabs for deeper data */}
          <Tabs defaultValue="history" className="w-full mt-6">
            <TabsList>
              <TabsTrigger value="history">Stock History</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">
                  Stock movement timeline placeholder. Future: fetch
                  /api/inventory/stock-movements?productId={product.id}
                </p>
              </Card>
            </TabsContent>
            <TabsContent value="pricing">
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Price history placeholder. Future: display historical pricing
                  changes and margin analysis.
                </p>
                <div className="flex gap-2">
                  <Input placeholder="New price" className="w-40" disabled />
                  <Button size="sm" disabled>
                    Update (Future)
                  </Button>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="performance">
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Performance metrics placeholder. Future: sales velocity,
                  turnover rate, last sale date.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {[
                    "Sales 30d",
                    "Turnover",
                    "Avg Daily Sales",
                    "Days Since Last Sale",
                  ].map((k) => (
                    <div
                      key={k}
                      className="p-3 bg-muted rounded flex flex-col gap-1"
                    >
                      <span className="font-medium">{k}</span>
                      <span className="text-muted-foreground">—</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="related">
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Related products placeholder. Future: similar
                  material/color/company or frequently bought together.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-3 border rounded text-xs">
                      Related {i + 1}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
