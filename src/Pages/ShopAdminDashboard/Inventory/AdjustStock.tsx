import { useState } from "react";
import { ShopAdminAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AdjustStock() {
  const [productId, setProductId] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [type, setType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      if (!productId && !barcode) {
        throw new Error("Provide either Product ID or Barcode");
      }
      const payload: any = { type, quantity };
      if (productId) payload.productId = Number(productId);
      if (barcode) payload.barcode = barcode;
      if (reason) payload.reason = reason;
      if (notes) payload.notes = notes;
      const res = await ShopAdminAPI.inventory.adjust(payload);
      setResult(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-4 mb-4">
        <h2 className="font-bold mb-3">Adjust Stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Product ID</label>
            <Input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Barcode</label>
            <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v: string) => setType((v as 'ADD' | 'REMOVE'))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADD">ADD</SelectItem>
                <SelectItem value="REMOVE">REMOVE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Quantity</label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional (e.g., Damage, Shrinkage, Correction)" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
        </div>
      </Card>

      {error && <Card className="p-4 mb-4 text-red-600">{error}</Card>}
      {result && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Result</h3>
          <pre className="text-sm whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}
