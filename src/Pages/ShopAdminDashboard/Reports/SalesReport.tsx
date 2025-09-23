import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";

type SalesSummary = { totalSales: number; totalOrders: number; avgOrderValue: number; totalTax: number; subtotal: number };
type SalesDetail = { id: number; date: string; staff: string; patient: string; amount: number; items: number };
type SalesReportResponse = { summary: SalesSummary; details: SalesDetail[] };

export default function SalesReport() {
  const [report, setReport] = useState<SalesReportResponse | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
      axios.get("https://staff-production-c6d9.up.railway.app/shop-admin/reports/sales?period=monthly", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setReport(res.data));
  }, []);

  if (!report) return <div>Loading...</div>;

  const paginated = report.details.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(report.details.length / pageSize);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-4">
        <h2 className="font-bold mb-2">Sales Summary</h2>
        <div>Total Sales: ₹{report.summary.totalSales}</div>
        <div>Total Orders: {report.summary.totalOrders}</div>
        <div>Avg Order Value: ₹{report.summary.avgOrderValue}</div>
        <div>Total Tax: ₹{report.summary.totalTax}</div>
        <div>Subtotal: ₹{report.summary.subtotal}</div>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Sales Details</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice</th>
              <th>Staff</th>
              <th>Patient</th>
              <th>Amount</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item: SalesDetail) => (
              <tr key={item.id} className="border-b">
                <td>{new Date(item.date).toLocaleDateString()}</td>
                <td>{item.id}</td>
                <td>{item.staff}</td>
                <td>{item.patient}</td>
                <td>₹{item.amount}</td>
                <td>{item.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
