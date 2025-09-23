import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";

type StaffActivity = {
  id?: number;
  type: string;
  description: string;
  amount?: number;
  timestamp: string;
};

export default function StaffActivities() {
  const { staffId } = useParams();
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!staffId) return;
    axios.get(`https://staff-production-c6d9.up.railway.app/shop-admin/staff/activities?staffId=${staffId}&startDate=2025-09-01&endDate=2025-09-30`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setActivities(res.data));
  }, [staffId]);

  const paginated = activities.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(activities.length / pageSize);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h2 className="font-bold mb-2">Staff Activities</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((act: StaffActivity, idx: number) => (
              <tr key={idx} className="border-b">
                <td>{act.type}</td>
                <td>{act.description}</td>
                <td>{act.amount ? `₹${act.amount}` : "-"}</td>
                <td>{new Date(act.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
