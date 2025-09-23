import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";

type ProductSalesItem = {
  product: { id: number; name: string; sku: string; category: string; company: string };
  totalQuantitySold: number; totalRevenue: number; totalTransactions: number; avgPricePerUnit: number
};

export default function ProductSalesReport() {
  const [products, setProducts] = useState<ProductSalesItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
      axios.get("https://staff-production-c6d9.up.railway.app/shop-admin/reports/sales/products?startDate=2025-09-01&endDate=2025-09-30", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setProducts(res.data));
  }, []);

  const paginated = products.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(products.length / pageSize);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <h2 className="font-bold mb-2">Product Sales Report</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Company</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
              <th>Transactions</th>
              <th>Avg Price/Unit</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item: ProductSalesItem) => (
              <tr key={item.product.id} className="border-b">
                <td>{item.product.name}</td>
                <td>{item.product.sku}</td>
                <td>{item.product.category}</td>
                <td>{item.product.company}</td>
                <td>{item.totalQuantitySold}</td>
                <td>₹{item.totalRevenue}</td>
                <td>{item.totalTransactions}</td>
                <td>₹{item.avgPricePerUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
