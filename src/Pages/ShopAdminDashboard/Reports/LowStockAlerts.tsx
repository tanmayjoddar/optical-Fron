import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";

type LowStockItem = {
  product: { id: number; name: string; sku: string; category: string };
  currentStock: number;
  alertLevel: number;
  lastUpdated: string;
};

export default function LowStockAlerts() {
  const [alerts, setAlerts] = useState<LowStockItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    axios.get("https://staff-production-c6d9.up.railway.app/shop-admin/reports/inventory/alerts", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setAlerts(res.data));
  }, []);

  const paginated = alerts.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(alerts.length / pageSize);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h2 className="font-bold mb-2">Low Stock Alerts</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Alert Level</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item: LowStockItem) => (
              <tr key={item.product.id} className="border-b">
                <td>{item.product.name}</td>
                <td>{item.product.sku}</td>
                <td>{item.product.category}</td>
                <td>{item.currentStock}</td>
                <td>{item.alertLevel}</td>
                <td>{new Date(item.lastUpdated).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
