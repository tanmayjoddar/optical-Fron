import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StaffAPI } from "@/lib/staffApi";

const PrescriptionCreate = () => {
  const [patientId, setPatientId] = useState<string>("");
  const [right, setRight] = useState<{ sph: string; cyl: string; axis: string; add: string }>({ sph: "", cyl: "", axis: "", add: "" });
  const [left, setLeft] = useState<{ sph: string; cyl: string; axis: string; add: string }>({ sph: "", cyl: "", axis: "", add: "" });
  const [result, setResult] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!patientId) return;
    try {
      setLoading(true); setError(null);
      const res = await StaffAPI.createPrescription({ patientId: Number(patientId), rightEye: right, leftEye: left });
      setResult(res);
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Create failed");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Prescription</h1>
        <p className="text-gray-600">Create new prescription for patient</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div>
            <label className="text-xs text-muted-foreground">Patient ID</label>
            <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-medium">Right Eye</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input placeholder="SPH" value={right.sph} onChange={(e) => setRight({ ...right, sph: e.target.value })} />
                <Input placeholder="CYL" value={right.cyl} onChange={(e) => setRight({ ...right, cyl: e.target.value })} />
                <Input placeholder="AXIS" value={right.axis} onChange={(e) => setRight({ ...right, axis: e.target.value })} />
                <Input placeholder="ADD" value={right.add} onChange={(e) => setRight({ ...right, add: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="font-medium">Left Eye</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input placeholder="SPH" value={left.sph} onChange={(e) => setLeft({ ...left, sph: e.target.value })} />
                <Input placeholder="CYL" value={left.cyl} onChange={(e) => setLeft({ ...left, cyl: e.target.value })} />
                <Input placeholder="AXIS" value={left.axis} onChange={(e) => setLeft({ ...left, axis: e.target.value })} />
                <Input placeholder="ADD" value={left.add} onChange={(e) => setLeft({ ...left, add: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading}>Create Prescription</Button>
          </div>
          {result != null && (
            <div className="text-sm mt-4">
              <pre className="bg-muted/50 p-3 rounded-lg overflow-auto max-h-80">{typeof result === "string" ? result : JSON.stringify(result as Record<string, unknown>, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionCreate;