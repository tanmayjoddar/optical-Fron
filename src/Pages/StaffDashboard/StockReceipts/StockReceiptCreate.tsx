import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StaffAPI } from "@/lib/api";
import { ArrowLeft, PackageCheck, Loader2 } from "lucide-react";

type Product = {
  id: number;
  name: string;
  sku?: string;
  company?: { name?: string };
  currentStock?: number;
};

type FormData = {
  productId: number | null;
  receivedQuantity: number;
  supplierName: string;
  deliveryNote: string;
  batchNumber: string;
  expiryDate: string;
};

export default function StockReceiptCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    productId: null,
    receivedQuantity: 0,
    supplierName: "",
    deliveryNote: "",
    batchNumber: "",
    expiryDate: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await StaffAPI.inventory.getProducts({ limit: 1000 });
      setProducts(response.products || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load products";
      setError(msg);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductSelect = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);
    setFormData({ ...formData, productId });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.productId) {
      setError("Please select a product");
      return;
    }

    if (formData.receivedQuantity <= 0) {
      setError("Received quantity must be greater than 0");
      return;
    }

    try {
      setLoading(true);

      // Prepare data - only send fields that have values
      const data: any = {
        productId: formData.productId,
        receivedQuantity: formData.receivedQuantity,
      };

      if (formData.supplierName.trim()) {
        data.supplierName = formData.supplierName.trim();
      }

      if (formData.deliveryNote.trim()) {
        data.deliveryNote = formData.deliveryNote.trim();
      }

      if (formData.batchNumber.trim()) {
        data.batchNumber = formData.batchNumber.trim();
      }

      if (formData.expiryDate) {
        data.expiryDate = formData.expiryDate;
      }

      await StaffAPI.stockReceipts.create(data);

      setSuccess(true);
      
      // Reset form
      setFormData({
        productId: null,
        receivedQuantity: 0,
        supplierName: "",
        deliveryNote: "",
        batchNumber: "",
        expiryDate: "",
      });
      setSelectedProduct(null);

      // Navigate back after a short delay
      setTimeout(() => {
        navigate("/staff-dashboard/stock-receipts");
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create stock receipt";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.sku?.toLowerCase().includes(searchLower) ||
      p.company?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/staff-dashboard/stock-receipts")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Stock Receipt</h1>
          <p className="text-gray-600">Record incoming stock from suppliers</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Stock receipt created successfully! Waiting for shop admin approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Selection */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Product Information
            </CardTitle>
            <CardDescription>Select the product received from supplier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Products */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Product <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Search by name, SKU, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadingProducts}
              />
            </div>

            {/* Product Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Product <span className="text-red-500">*</span>
              </label>
              <select
                name="productId"
                value={formData.productId || ""}
                onChange={(e) => handleProductSelect(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loadingProducts}
              >
                <option value="">-- Select Product --</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` (${product.sku})` : ""}
                    {product.company?.name ? ` - ${product.company.name}` : ""}
                  </option>
                ))}
              </select>
              {loadingProducts && (
                <p className="text-sm text-gray-500 mt-1">Loading products...</p>
              )}
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Selected Product</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedProduct.name}</span>
                  </div>
                  {selectedProduct.sku && (
                    <div>
                      <span className="text-gray-600">SKU:</span>
                      <span className="ml-2 font-medium">{selectedProduct.sku}</span>
                    </div>
                  )}
                  {selectedProduct.company?.name && (
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <span className="ml-2 font-medium">{selectedProduct.company.name}</span>
                    </div>
                  )}
                  {selectedProduct.currentStock !== undefined && (
                    <div>
                      <span className="text-gray-600">Current Stock:</span>
                      <span className="ml-2 font-medium">{selectedProduct.currentStock}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Received Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Quantity <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="receivedQuantity"
                value={formData.receivedQuantity || ""}
                onChange={handleInputChange}
                min="1"
                required
                placeholder="Enter quantity received"
              />
            </div>
          </CardContent>
        </Card>

        {/* Supplier & Delivery Details */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Supplier & Delivery Details</CardTitle>
            <CardDescription>Additional information about the delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name
              </label>
              <Input
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleInputChange}
                placeholder="e.g., Vision Supplies Co."
              />
            </div>

            {/* Batch Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <Input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                placeholder="e.g., BATCH-202511"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <Input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
              />
            </div>

            {/* Delivery Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Note
              </label>
              <Textarea
                name="deliveryNote"
                value={formData.deliveryNote}
                onChange={handleInputChange}
                placeholder="Add any notes about this delivery..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/staff-dashboard/stock-receipts")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PackageCheck className="h-4 w-4 mr-2" />
                Create Stock Receipt
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
