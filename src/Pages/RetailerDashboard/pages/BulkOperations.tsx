import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RetailerAPI } from "@/lib/api";
import type { RetailerShopRecord } from "@/lib/types/retailer";
import { toast } from "sonner";

interface BulkDistributionItem {
  retailerShopId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BulkProductItem {
  sku: string;
  name: string;
  description: string;
  companyName: string;
  companyDescription: string;
  eyewearType: string;
  frameType?: string | null;
  material: string;
  color: string;
  size?: string | null;
  model: string;
  barcode: string;
  basePrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
}

interface BulkInventoryUpdate {
  sku: string;
  quantity?: number;
  sellingPrice?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
}

interface BulkDistributionResponse {
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  distributions: Array<{
    distributionId: number;
    shopId: number;
    productId: number;
    quantity: number;
    status: string;
  }>;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

interface BulkUploadResponse {
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  products: Array<{
    id: number;
    name: string;
    sku: string;
    company: string;
    quantity: number;
    sellingPrice: number;
  }>;
  errors: Array<{
    row: number;
    product: string;
    errors: string[];
  }>;
  hasMoreProducts: boolean;
  hasMoreErrors: boolean;
}

interface BulkInventoryResponse {
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  errors: Array<{
    row: number;
    sku: string;
    error: string;
  }>;
}

interface Shop {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  basePrice?: number;
}

export default function BulkOperations() {
  const [activeTab, setActiveTab] = useState("distributions");
  const prodFileInputRef = useRef<HTMLInputElement>(null);
  const invFileInputRef = useRef<HTMLInputElement>(null);

  // Distributions state
  const [distLoading, setDistLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [distItems, setDistItems] = useState<BulkDistributionItem[]>([
    {
      retailerShopId: 0,
      productId: 0,
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);
  const [distResult, setDistResult] = useState<BulkDistributionResponse | null>(
    null
  );
  const [showDistResult, setShowDistResult] = useState(false);

  // Products upload state
  const [prodLoading, setProdLoading] = useState(false);
  const [prodItems, setProdItems] = useState<BulkProductItem[]>([]);
  const [prodResult, setProdResult] = useState<BulkUploadResponse | null>(null);
  const [showProdResult, setShowProdResult] = useState(false);

  // Inventory update state
  const [invLoading, setInvLoading] = useState(false);
  const [invItems, setInvItems] = useState<BulkInventoryUpdate[]>([]);
  const [invResult, setInvResult] = useState<BulkInventoryResponse | null>(
    null
  );
  const [showInvResult, setShowInvResult] = useState(false);

  // Load shops and products
  useEffect(() => {
    (async () => {
      try {
        setShopsLoading(true);
        const shopsData = await RetailerAPI.shops.getAll({});
        setShops(
          (shopsData as unknown as RetailerShopRecord[])?.map((s) => ({
            id: s.shopId,
            name: s.shop?.name || "Unknown",
          })) || []
        );
      } catch {
        toast.error("Failed to load shops");
      } finally {
        setShopsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setProductsLoading(true);
        const productsData = await RetailerAPI.inventory.myProducts({
          limit: 1000,
        });
        setProducts((productsData?.products || []) as unknown as Product[]);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  // ============= DISTRIBUTIONS HANDLERS =============
  const handleDistAddRow = () => {
    setDistItems([
      ...distItems,
      {
        retailerShopId: 0,
        productId: 0,
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleDistRemoveRow = (index: number) => {
    setDistItems(distItems.filter((_, i) => i !== index));
  };

  const handleDistItemChange = (
    index: number,
    field: keyof BulkDistributionItem,
    value: string | number
  ) => {
    const newItems = [...distItems];
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    
    console.log(`Updating row ${index} field ${field} with value:`, numValue);
    
    newItems[index] = { ...newItems[index], [field]: numValue };

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice =
        (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }

    console.log(`Updated item row ${index}:`, newItems[index]);
    setDistItems(newItems);
  };

  const validateDistItems = (): boolean => {
    console.log("Validating dist items:", distItems);
    
    if (distItems.length === 0) {
      toast.error("Add at least one item");
      return false;
    }

    for (let i = 0; i < distItems.length; i++) {
      const item = distItems[i];
      console.log(`Validating row ${i}:`, item);
      
      if (!item.retailerShopId || item.retailerShopId === 0) {
        toast.error(`Row ${i + 1}: Select a shop`);
        console.log(`Row ${i + 1} failed: retailerShopId is ${item.retailerShopId}`);
        return false;
      }
      if (!item.productId || item.productId === 0) {
        toast.error(`Row ${i + 1}: Select a product`);
        console.log(`Row ${i + 1} failed: productId is ${item.productId}`);
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error(`Row ${i + 1}: Enter valid quantity`);
        console.log(`Row ${i + 1} failed: quantity is ${item.quantity}`);
        return false;
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        toast.error(`Row ${i + 1}: Enter valid unit price`);
        console.log(`Row ${i + 1} failed: unitPrice is ${item.unitPrice}`);
        return false;
      }
    }
    console.log("All validations passed");
    return true;
  };

  const handleDistSubmit = async () => {
    console.log("Distribution submit clicked. distItems:", distItems);
    
    if (!validateDistItems()) {
      console.log("Validation failed");
      return;
    }

    try {
      setDistLoading(true);
      console.log("Sending bulk distribution request with:", distItems);
      
      const response = (await RetailerAPI.bulk.distribute({
        distributions: distItems,
      })) as unknown as BulkDistributionResponse;

      console.log("Distribution response:", response);
      
      setDistResult(response);
      setShowDistResult(true);

      if (response.summary.successful > 0) {
        toast.success(
          `${response.summary.successful} distributions created successfully`
        );
      }

      if (response.summary.failed > 0) {
        toast.error(`${response.summary.failed} distributions failed`);
      }

      if (response.summary.failed === 0) {
        setDistItems([
          {
            retailerShopId: 0,
            productId: 0,
            quantity: 0,
            unitPrice: 0,
            totalPrice: 0,
          },
        ]);
      }
    } catch (e) {
      console.error("Distribution error:", e);
      toast.error(
        String((e as Record<string, unknown>).message) ||
          "Failed to create bulk distributions"
      );
    } finally {
      setDistLoading(false);
    }
  };

  // ============= PRODUCTS UPLOAD HANDLERS =============
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Only .json files are supported");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (Array.isArray(data)) {
        setProdItems(data as BulkProductItem[]);
        toast.success(`Loaded ${data.length} products from file`);
      } else if (data.products && Array.isArray(data.products)) {
        setProdItems(data.products as BulkProductItem[]);
        toast.success(`Loaded ${data.products.length} products from file`);
      } else {
        toast.error("Invalid JSON format");
      }
    } catch (e) {
      toast.error("Failed to parse JSON file");
      console.error(e);
    }

    if (prodFileInputRef.current) {
      prodFileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = await RetailerAPI.bulk.getTemplate();
      const json = JSON.stringify(template, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bulk-upload-template.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (e) {
      toast.error("Failed to download template");
      console.error(e);
    }
  };

  const handleProdSubmit = async () => {
    if (prodItems.length === 0) {
      toast.error("Add products first");
      return;
    }

    // Check for duplicate SKUs
    const skus = prodItems.map((item) => item.sku);
    const duplicateSKUs = skus.filter(
      (sku, index) => skus.indexOf(sku) !== index
    );
    if (duplicateSKUs.length > 0) {
      toast.warning(
        `Duplicate SKUs detected: ${[...new Set(duplicateSKUs)].join(
          ", "
        )}. Backend may handle these as updates.`
      );
    }

    try {
      setProdLoading(true);
      const response = (await RetailerAPI.bulk.uploadProducts({
        products: prodItems,
      })) as unknown as BulkUploadResponse;

      setProdResult(response);
      setShowProdResult(true);

      if (response.summary.successful > 0) {
        toast.success(
          `${response.summary.successful} products uploaded successfully`
        );
        // Refresh products list after successful upload
        try {
          const updatedProducts = await RetailerAPI.inventory.myProducts({
            limit: 1000,
          });
          setProducts(
            (updatedProducts?.products || []) as unknown as Product[]
          );
        } catch {
          // If refresh fails, just continue
        }
      }

      if (response.summary.failed > 0) {
        toast.error(`${response.summary.failed} products failed`);
      }

      if (response.summary.failed === 0) {
        setProdItems([]);
      }
    } catch (e) {
      toast.error(
        String((e as Record<string, unknown>).message) ||
          "Failed to upload products"
      );
    } finally {
      setProdLoading(false);
    }
  };

  // ============= INVENTORY UPDATE HANDLERS =============
  const handleInvFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Only .json files are supported");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (Array.isArray(data)) {
        setInvItems(data as BulkInventoryUpdate[]);
        toast.success(`Loaded ${data.length} updates from file`);
      } else if (data.updates && Array.isArray(data.updates)) {
        setInvItems(data.updates as BulkInventoryUpdate[]);
        toast.success(`Loaded ${data.updates.length} updates from file`);
      } else {
        toast.error("Invalid JSON format");
      }
    } catch (e) {
      toast.error("Failed to parse JSON file");
      console.error(e);
    }

    if (invFileInputRef.current) {
      invFileInputRef.current.value = "";
    }
  };

  const handleInvSubmit = async () => {
    if (invItems.length === 0) {
      toast.error("Add inventory updates first");
      return;
    }

    try {
      setInvLoading(true);
      const response = (await RetailerAPI.bulk.updateInventory({
        updates: invItems,
      })) as unknown as BulkInventoryResponse;

      setInvResult(response);
      setShowInvResult(true);

      if (response.summary.successful > 0) {
        toast.success(
          `${response.summary.successful} inventory items updated successfully`
        );
      }

      if (response.summary.failed > 0) {
        toast.error(`${response.summary.failed} inventory updates failed`);
      }

      if (response.summary.failed === 0) {
        setInvItems([]);
      }
    } catch (e) {
      toast.error(
        String((e as Record<string, unknown>).message) ||
          "Failed to update inventory"
      );
    } finally {
      setInvLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "—";
  };

  const getShopName = (shopId: number) => {
    const shop = shops.find((s) => s.id === shopId);
    return shop?.name || "—";
  };

  const distTotalAmount = distItems.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-gradient">
          Bulk Operations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload, manage, and distribute products in bulk with JSON file support
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distributions">Bulk Distribute</TabsTrigger>
          <TabsTrigger value="products">Upload Products</TabsTrigger>
          <TabsTrigger value="inventory">Update Inventory</TabsTrigger>
        </TabsList>

        {/* ============= DISTRIBUTIONS TAB ============= */}
        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribute to Multiple Shops</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-semibold">
                        Shop
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Product
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Quantity
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Unit Price
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Total
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {distItems.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <select
                            value={item.retailerShopId}
                            onChange={(e) =>
                              handleDistItemChange(
                                idx,
                                "retailerShopId",
                                parseInt(e.target.value, 10)
                              )
                            }
                            className="w-full border rounded px-2 py-1 text-xs"
                            disabled={shopsLoading}
                          >
                            <option value={0}>Select shop...</option>
                            {shops.map((shop) => (
                              <option key={shop.id} value={shop.id}>
                                {shop.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.productId}
                            onChange={(e) =>
                              handleDistItemChange(
                                idx,
                                "productId",
                                parseInt(e.target.value, 10)
                              )
                            }
                            className="w-full border rounded px-2 py-1 text-xs"
                            disabled={productsLoading}
                          >
                            <option value={0}>Select product...</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handleDistItemChange(
                                idx,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            className="text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || ""}
                            onChange={(e) =>
                              handleDistItemChange(
                                idx,
                                "unitPrice",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            className="text-xs"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ₹{(item.totalPrice || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {distItems.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDistRemoveRow(idx)}
                              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            >
                              ✕
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={handleDistAddRow}
                variant="outline"
                className="w-full"
                disabled={distLoading || shopsLoading || productsLoading}
              >
                + Add Row
              </Button>

              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Items
                    </div>
                    <div className="text-2xl font-bold">{distItems.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Quantity
                    </div>
                    <div className="text-2xl font-bold">
                      {distItems.reduce(
                        (sum, item) => sum + (item.quantity || 0),
                        0
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Amount
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{distTotalAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDistSubmit}
                  disabled={distLoading || distItems.length === 0}
                  className="flex-1"
                  size="lg"
                >
                  {distLoading ? "Processing..." : "Create Bulk Distribution"}
                </Button>
                {showDistResult && distResult && (
                  <Dialog
                    open={showDistResult}
                    onOpenChange={setShowDistResult}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">View Result</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Bulk Distribution Result</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Alert
                          variant={
                            distResult.summary.failed === 0
                              ? "default"
                              : "destructive"
                          }
                        >
                          <AlertDescription>
                            {distResult.message}
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              Total
                            </div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {distResult.summary.total}
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                            <div className="text-xs text-green-700 dark:text-green-300">
                              Successful
                            </div>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                              {distResult.summary.successful}
                            </div>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                            <div className="text-xs text-red-700 dark:text-red-300">
                              Failed
                            </div>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                              {distResult.summary.failed}
                            </div>
                          </div>
                        </div>

                        {distResult.distributions.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">
                              Successful Distributions
                            </h4>
                            <div className="overflow-x-auto border rounded">
                              <table className="w-full text-xs">
                                <thead className="bg-muted/40">
                                  <tr className="border-b">
                                    <th className="px-2 py-2 text-left">ID</th>
                                    <th className="px-2 py-2 text-left">
                                      Shop
                                    </th>
                                    <th className="px-2 py-2 text-left">
                                      Product
                                    </th>
                                    <th className="px-2 py-2 text-right">
                                      Qty
                                    </th>
                                    <th className="px-2 py-2 text-left">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {distResult.distributions.map((dist, i) => (
                                    <tr key={i} className="border-b">
                                      <td className="px-2 py-2 font-mono">
                                        #{dist.distributionId}
                                      </td>
                                      <td className="px-2 py-2">
                                        {getShopName(dist.shopId)}
                                      </td>
                                      <td className="px-2 py-2">
                                        {getProductName(dist.productId)}
                                      </td>
                                      <td className="px-2 py-2 text-right font-semibold">
                                        {dist.quantity}
                                      </td>
                                      <td className="px-2 py-2">
                                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">
                                          {dist.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {distResult.errors.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm text-red-600 dark:text-red-400">
                              Errors
                            </h4>
                            <div className="space-y-2">
                              {distResult.errors.map((err, i) => (
                                <Alert key={i} variant="destructive">
                                  <AlertDescription>
                                    <strong>Row {err.row}:</strong> {err.error}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============= PRODUCTS UPLOAD TAB ============= */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Products via JSON</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
                  JSON File Upload
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  Upload a .json file with product data. Format must match the
                  template provided below.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => prodFileInputRef.current?.click()}
                  >
                    Select .json File
                  </Button>
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="secondary"
                    className="flex-1"
                  >
                    Download Template
                  </Button>
                </div>
                <input
                  ref={prodFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {prodItems.length > 0 && (
                  <div className="mt-3 p-2 bg-white dark:bg-slate-950 rounded border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {prodItems.length} products loaded
                    </div>
                  </div>
                )}
              </div>

              {prodItems.length > 0 && (
                <>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr className="border-b">
                          <th className="px-2 py-2 text-left">SKU</th>
                          <th className="px-2 py-2 text-left">Name</th>
                          <th className="px-2 py-2 text-left">Company</th>
                          <th className="px-2 py-2 text-left">Type</th>
                          <th className="px-2 py-2 text-right">Price</th>
                          <th className="px-2 py-2 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodItems.slice(0, 5).map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-2 py-2 font-mono text-[10px]">
                              {item.sku}
                            </td>
                            <td className="px-2 py-2 truncate">{item.name}</td>
                            <td className="px-2 py-2 truncate">
                              {item.companyName}
                            </td>
                            <td className="px-2 py-2">{item.eyewearType}</td>
                            <td className="px-2 py-2 text-right">
                              ₹{item.sellingPrice}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {prodItems.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      ... and {prodItems.length - 5} more products
                    </div>
                  )}

                  <Button
                    onClick={handleProdSubmit}
                    disabled={prodLoading}
                    className="w-full"
                    size="lg"
                  >
                    {prodLoading ? "Uploading..." : "Upload Products"}
                  </Button>

                  {showProdResult && prodResult && (
                    <Dialog
                      open={showProdResult}
                      onOpenChange={setShowProdResult}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          View Upload Result
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Product Upload Result</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert
                            variant={
                              prodResult.summary.failed === 0
                                ? "default"
                                : "destructive"
                            }
                          >
                            <AlertDescription>
                              {prodResult.message}
                            </AlertDescription>
                          </Alert>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                              <div className="text-xs text-blue-700 dark:text-blue-300">
                                Total
                              </div>
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {prodResult.summary.total}
                              </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                              <div className="text-xs text-green-700 dark:text-green-300">
                                Successful
                              </div>
                              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {prodResult.summary.successful}
                              </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                              <div className="text-xs text-red-700 dark:text-red-300">
                                Failed
                              </div>
                              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {prodResult.summary.failed}
                              </div>
                            </div>
                          </div>

                          {prodResult.products.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">
                                Uploaded Products
                              </h4>
                              <div className="overflow-x-auto border rounded">
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/40">
                                    <tr className="border-b">
                                      <th className="px-2 py-2 text-left">
                                        ID
                                      </th>
                                      <th className="px-2 py-2 text-left">
                                        SKU
                                      </th>
                                      <th className="px-2 py-2 text-left">
                                        Name
                                      </th>
                                      <th className="px-2 py-2 text-left">
                                        Company
                                      </th>
                                      <th className="px-2 py-2 text-right">
                                        Qty
                                      </th>
                                      <th className="px-2 py-2 text-right">
                                        Price
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prodResult.products.map((prod, i) => (
                                      <tr key={i} className="border-b">
                                        <td className="px-2 py-2 font-mono">
                                          #{prod.id}
                                        </td>
                                        <td className="px-2 py-2 font-mono text-[10px]">
                                          {prod.sku}
                                        </td>
                                        <td className="px-2 py-2 truncate">
                                          {prod.name}
                                        </td>
                                        <td className="px-2 py-2 truncate">
                                          {prod.company}
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                          {prod.quantity}
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                          ₹{prod.sellingPrice}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {prodResult.errors.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-sm text-red-600 dark:text-red-400">
                                Upload Errors
                              </h4>
                              <div className="space-y-2">
                                {prodResult.errors.slice(0, 5).map((err, i) => (
                                  <Alert key={i} variant="destructive">
                                    <AlertDescription>
                                      <strong>
                                        Row {err.row} - {err.product}:
                                      </strong>{" "}
                                      {err.errors.join(", ")}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                              {prodResult.errors.length > 5 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  ... and {prodResult.errors.length - 5} more
                                  errors
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}

              {prodItems.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Click "Select .json File" above to upload products, or
                    download the template to see the required format.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============= INVENTORY UPDATE TAB ============= */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Inventory via JSON</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold mb-3 text-purple-900 dark:text-purple-100">
                  JSON File Upload
                </h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                  Upload a .json file to update inventory levels, prices, and
                  stock thresholds by SKU.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => invFileInputRef.current?.click()}
                >
                  Select .json File
                </Button>
                <input
                  ref={invFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleInvFileSelect}
                  className="hidden"
                />
                {invItems.length > 0 && (
                  <div className="mt-3 p-2 bg-white dark:bg-slate-950 rounded border border-purple-200 dark:border-purple-800">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {invItems.length} inventory updates loaded
                    </div>
                  </div>
                )}
              </div>

              {invItems.length > 0 && (
                <>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr className="border-b">
                          <th className="px-2 py-2 text-left">SKU</th>
                          <th className="px-2 py-2 text-right">Quantity</th>
                          <th className="px-2 py-2 text-right">
                            Selling Price
                          </th>
                          <th className="px-2 py-2 text-right">Min Stock</th>
                          <th className="px-2 py-2 text-right">Max Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invItems.slice(0, 5).map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-2 py-2 font-mono text-[10px]">
                              {item.sku}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.quantity || "—"}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.sellingPrice
                                ? `₹${item.sellingPrice}`
                                : "—"}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.minStockLevel || "—"}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.maxStockLevel || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {invItems.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      ... and {invItems.length - 5} more updates
                    </div>
                  )}

                  <Button
                    onClick={handleInvSubmit}
                    disabled={invLoading}
                    className="w-full"
                    size="lg"
                  >
                    {invLoading ? "Updating..." : "Update Inventory"}
                  </Button>

                  {showInvResult && invResult && (
                    <Dialog
                      open={showInvResult}
                      onOpenChange={setShowInvResult}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          View Update Result
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Inventory Update Result</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert
                            variant={
                              invResult.summary.failed === 0
                                ? "default"
                                : "destructive"
                            }
                          >
                            <AlertDescription>
                              {invResult.message}
                            </AlertDescription>
                          </Alert>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                              <div className="text-xs text-blue-700 dark:text-blue-300">
                                Total
                              </div>
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {invResult.summary.total}
                              </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                              <div className="text-xs text-green-700 dark:text-green-300">
                                Successful
                              </div>
                              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {invResult.summary.successful}
                              </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                              <div className="text-xs text-red-700 dark:text-red-300">
                                Failed
                              </div>
                              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {invResult.summary.failed}
                              </div>
                            </div>
                          </div>

                          {invResult.errors.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-sm text-red-600 dark:text-red-400">
                                Update Errors
                              </h4>
                              <div className="space-y-2">
                                {invResult.errors.slice(0, 5).map((err, i) => (
                                  <Alert key={i} variant="destructive">
                                    <AlertDescription>
                                      <strong>{err.sku}:</strong> {err.error}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                              {invResult.errors.length > 5 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  ... and {invResult.errors.length - 5} more
                                  errors
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}

              {invItems.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Click "Select .json File" above to upload inventory updates.
                    Format: SKU, quantity, sellingPrice, minStockLevel,
                    maxStockLevel.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
