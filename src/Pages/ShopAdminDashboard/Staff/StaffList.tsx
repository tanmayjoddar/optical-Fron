import { useEffect, useMemo, useState } from "react";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";
import { Link } from "react-router";
import { ShopAdminAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StaffMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  totalSales: number;
  totalOrders: number;
  isActive: boolean;
};

export default function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ShopAdminAPI.staff.getAll({
          page,
          limit: pageSize,
          status,
        });
        type DataResponse = { staff?: StaffMember[]; data?: StaffMember[] };
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as DataResponse)?.staff)
          ? (data as DataResponse).staff
          : Array.isArray((data as DataResponse)?.data)
          ? (data as DataResponse).data
          : [];
        if (!cancelled) setStaff(list as StaffMember[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, status]);

  // If server returns pagination meta in future, we can replace this calc.
  const totalPages = Math.max(1, Math.ceil(staff.length / pageSize));
  const paginated = useMemo(() => {
    // If server pagination is used (list already page-sized), just return staff
    if (staff.length <= pageSize) return staff;
    const start = (page - 1) * pageSize;
    return staff.slice(start, start + pageSize);
  }, [staff, page, pageSize]);

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Staff List</h2>
          <Button asChild variant="default" size="sm">
            <Link to="/shop-admin-dashboard/staff/register">+ Add Staff</Link>
          </Button>
        </div>
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                variant={status === "ALL" ? "default" : "outline"}
                onClick={() => {
                  setPage(1);
                  setStatus("ALL");
                }}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={status === "ACTIVE" ? "default" : "outline"}
                onClick={() => {
                  setPage(1);
                  setStatus("ACTIVE");
                }}
              >
                Active
              </Button>
              <Button
                size="sm"
                variant={status === "INACTIVE" ? "default" : "outline"}
                onClick={() => {
                  setPage(1);
                  setStatus("INACTIVE");
                }}
              >
                Inactive
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Page size</label>
            <Input
              className="w-24"
              type="number"
              min={5}
              max={100}
              value={pageSize}
              onChange={(e) =>
                setPageSize(
                  Math.min(
                    100,
                    Math.max(5, parseInt(e.target.value || "10", 10))
                  )
                )
              }
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Sales</th>
              <th>Orders</th>
              <th>Active</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((member: StaffMember) => (
                <tr key={member.id} className="border-b">
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.role}</td>
                  <td>₹{member.totalSales ?? 0}</td>
                  <td>{member.totalOrders}</td>
                  <td>{member.isActive ? "Yes" : "No"}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/shop-admin-dashboard/staff/${member.id}`}>
                          View
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link
                          to={`/shop-admin-dashboard/staff/${member.id}/activities`}
                        >
                          Activities
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && paginated.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-muted-foreground"
                >
                  No staff found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
