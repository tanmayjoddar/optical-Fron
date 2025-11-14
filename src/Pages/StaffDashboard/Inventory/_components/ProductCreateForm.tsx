import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { StaffAPI } from "@/lib/api";

interface ProductFormState {
  name: string;
  description: string;
  basePrice: string;
  eyewearType: string;
  companyId: string;
  material: string;
  color: string;
  size: string;
  model: string;
  barcode: string;
  sku: string;
  frameType: string;
}
const initialState: ProductFormState = {
  name: "",
  description: "",
  basePrice: "",
  eyewearType: "SUNGLASSES",
  companyId: "",
  material: "",
  color: "",
  size: "",
  model: "",
  barcode: "",
  sku: "",
  frameType: "RECTANGULAR",
};
interface Props {
  onCreated?: (product: any) => void;
}

const ProductCreateForm: React.FC<Props> = ({ onCreated }) => {
  const [form, setForm] = useState<ProductFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<any | null>(null);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (
      !form.basePrice ||
      isNaN(Number(form.basePrice)) ||
      Number(form.basePrice) < 0
    )
      e.basePrice = "Valid base price required";
    if (!form.companyId || isNaN(Number(form.companyId)))
      e.companyId = "Company required";
    if (!form.eyewearType) e.eyewearType = "Type required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const suggestSku = () => {
    if (form.name) {
      const base = form.name
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase()
        .slice(0, 6);
      setForm((f) => ({
        ...f,
        sku:
          base + "-" + Math.random().toString(36).substring(2, 5).toUpperCase(),
      }));
    }
  };
  const suggestBarcode = () => {
    setForm((f) => ({
      ...f,
      barcode: "BC" + Date.now().toString().slice(-10),
    }));
  };
  const reset = () => {
    setForm(initialState);
    setErrors({});
    setCreated(null);
    setServerError(null);
  };
  const submit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setServerError(null);
      const payload: Parameters<typeof StaffAPI.inventory.addProduct>[0] = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        basePrice: Number(form.basePrice),
        eyewearType: form.eyewearType,
        companyId: Number(form.companyId),
        material: form.material || undefined,
        color: form.color || undefined,
        size: form.size || undefined,
        model: form.model || undefined,
        barcode: form.barcode || undefined,
        sku: form.sku || undefined,
        frameType: form.frameType || undefined,
      };
      const product = await StaffAPI.inventory.addProduct(payload);
      setCreated(product);
      onCreated?.(product);
    } catch (e: any) {
      setServerError(e?.response?.data?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  function navigateToDetail(id: number) {
    window.location.href = `/staff-dashboard/inventory/products/${id}`;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>New Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          {created && (
            <Alert>
              <AlertDescription>Product created successfully.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Base Price</label>
              <Input
                type="number"
                value={form.basePrice}
                onChange={(e) =>
                  setForm({ ...form, basePrice: e.target.value })
                }
              />
              {errors.basePrice && (
                <p className="text-xs text-red-500">{errors.basePrice}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Company ID</label>
              <Input
                type="number"
                value={form.companyId}
                onChange={(e) =>
                  setForm({ ...form, companyId: e.target.value })
                }
              />
              {errors.companyId && (
                <p className="text-xs text-red-500">{errors.companyId}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Eyewear Type</label>
              <select
                className="border rounded-md p-2 w-full"
                value={form.eyewearType}
                onChange={(e) =>
                  setForm({ ...form, eyewearType: e.target.value })
                }
              >
                <option value="GLASSES">GLASSES</option>
                <option value="SUNGLASSES">SUNGLASSES</option>
                <option value="LENSES">LENSES</option>
              </select>
              {errors.eyewearType && (
                <p className="text-xs text-red-500">{errors.eyewearType}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Frame Type</label>
              <select
                className="border rounded-md p-2 w-full"
                value={form.frameType}
                onChange={(e) =>
                  setForm({ ...form, frameType: e.target.value })
                }
              >
                <option value="RECTANGULAR">RECTANGULAR</option>
                <option value="OVAL">OVAL</option>
                <option value="ROUND">ROUND</option>
                <option value="SQUARE">SQUARE</option>
                <option value="AVIATOR">AVIATOR</option>
                <option value="WAYFARER">WAYFARER</option>
                <option value="CAT_EYE">CAT_EYE</option>
                <option value="CLUBMASTER">CLUBMASTER</option>
                <option value="RIMLESS">RIMLESS</option>
                <option value="SEMI_RIMLESS">SEMI_RIMLESS</option>
                <option value="WRAP_AROUND">WRAP_AROUND</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium">Description</label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Material</label>
              <Input
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Color</label>
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Size</label>
              <Input
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Model</label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center justify-between">
                SKU{" "}
                <button
                  type="button"
                  onClick={suggestSku}
                  className="text-[10px] underline"
                >
                  Suggest
                </button>
              </label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center justify-between">
                Barcode{" "}
                <button
                  type="button"
                  onClick={suggestBarcode}
                  className="text-[10px] underline"
                >
                  Generate
                </button>
              </label>
              <Input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <label className="text-xs font-medium">Images</label>
            <div className="border rounded-md p-6 text-center text-xs text-muted-foreground bg-muted/20">
              Drag & drop images or click to upload (future implementation).
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {!created && (
              <Button disabled={submitting} onClick={submit}>
                {submitting ? "Creating..." : "Create Product"}
              </Button>
            )}
            {created && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigateToDetail(created.id)}
                >
                  View Product
                </Button>
                <Button variant="outline" onClick={() => reset()}>
                  Create Another
                </Button>
                <Button
                  onClick={() =>
                    (window.location.href =
                      "/staff-dashboard/inventory/products")
                  }
                >
                  Go to Catalog
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCreateForm;
