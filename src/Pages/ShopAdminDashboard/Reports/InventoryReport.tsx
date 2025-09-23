import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";

type InventorySummaryItem = {
  product: { id: number; name: string; sku: string; category: string };
  type: string;
  totalQuantity: number;
  movements: Array<{ id: number; quantity: number; notes: string; date: string }>;
};
type InventoryDetailItem = { id: number; productId: number; type: string; quantity: number; notes: string; createdAt: string };
type InventoryResponse = { summary: InventorySummaryItem[]; details: InventoryDetailItem[] };

export default function InventoryReport() {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    axios.get("https://staff-production-c6d9.up.railway.app/shop-admin/reports/inventory?type=all&startDate=2025-09-01&endDate=2025-09-30", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setInventory(res.data));
  }, []);

  if (!inventory) return <div>Loading...</div>;

  const paginated = inventory.summary.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(inventory.summary.length / pageSize);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-4">
        <h2 className="font-bold mb-2">Inventory Summary</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Type</th>
              <th>Total Quantity</th>
              <th>Movements</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item: InventorySummaryItem) => (
              <tr key={item.product.id} className="border-b">
                <td>{item.product.name}</td>
                <td>{item.product.sku}</td>
                <td>{item.product.category}</td>
                <td>{item.type}</td>
                <td>{item.totalQuantity}</td>
                <td>
                  {item.movements.map((move) => (
                    <div key={move.id} className="text-xs">
                      {move.quantity} ({move.notes}) on {new Date(move.date).toLocaleDateString()}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Inventory Details</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product ID</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Notes</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {inventory.details.map((detail: InventoryDetailItem) => (
              <tr key={detail.id} className="border-b">
                <td>{detail.id}</td>
                <td>{detail.productId}</td>
                <td>{detail.type}</td>
                <td>{detail.quantity}</td>
                <td>{detail.notes}</td>
                <td>{new Date(detail.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
