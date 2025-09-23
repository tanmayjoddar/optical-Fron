import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Link } from "react-router";
import { StaffAPI } from "@/lib/staffApi";

const PrescriptionsList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  interface PrescriptionRow { id: number; patientId?: number; patient?: { name?: string } | null; createdAt: string }
  const [list, setList] = useState<{ prescriptions: PrescriptionRow[]; total?: number; page?: number }>({ prescriptions: [], total: 0, page: 1 });
  const [patientId, setPatientId] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await StaffAPI.listPrescriptions({ page: 1, limit: 10, patientId: patientId ? Number(patientId) : undefined });
      setList((res as { prescriptions: PrescriptionRow[]; total?: number; page?: number }) || { prescriptions: [] });
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Failed to load");
    } finally { setLoading(false); }
  };

  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; });
  useEffect(() => { fetchRef.current(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600">Manage patient prescriptions and medical records</p>
        </div>
        <Link to="/staff-dashboard/prescriptions/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Prescription
          </Button>
        </Link>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Prescription List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex gap-2 items-center">
            <Input placeholder="Filter by Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            <Button variant="outline" onClick={fetchData}>Apply</Button>
          </div>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Patient</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(list.prescriptions ?? []).map((p: PrescriptionRow) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-4">{p.id}</td>
                      <td className="py-2 pr-4">{p.patient?.name || p.patientId}</td>
                      <td className="py-2 pr-4">{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionsList;