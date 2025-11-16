import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StaffAPI } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const LENS_TYPES = ["Progressive", "Bifocal", "Single Vision", "Trifocal"];

interface EyePrescription {
  type: string;
  sph: string;
  cyl: string;
  axis: string;
  add: string;
  pd: string;
  bc: string;
  remarks: string;
}

const PrescriptionCreate = () => {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState<string>("");
  const [rightEye, setRightEye] = useState<EyePrescription>({
    type: "Progressive",
    sph: "",
    cyl: "",
    axis: "",
    add: "",
    pd: "",
    bc: "",
    remarks: "",
  });
  const [leftEye, setLeftEye] = useState<EyePrescription>({
    type: "Progressive",
    sph: "",
    cyl: "",
    axis: "",
    add: "",
    pd: "",
    bc: "",
    remarks: "",
  });
  const [notes, setNotes] = useState<string>("");
  const [result, setResult] = useState<{ id?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const updateRightEye = (field: keyof EyePrescription, value: string) => {
    setRightEye((prev) => ({ ...prev, [field]: value }));
  };

  const updateLeftEye = (field: keyof EyePrescription, value: string) => {
    setLeftEye((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async () => {
    if (!patientId || !patientId.trim()) {
      setError("Patient ID is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setShowSuccess(false);

      // Helper function to clean empty strings to empty string (not undefined)
      const cleanValue = (value: string) => {
        return value.trim();
      };

      const payload = {
        patientId: Number(patientId),
        rightEye: {
          type: cleanValue(rightEye.type),
          sph: cleanValue(rightEye.sph),
          cyl: cleanValue(rightEye.cyl),
          axis: cleanValue(rightEye.axis),
          add: cleanValue(rightEye.add),
          pd: cleanValue(rightEye.pd),
          bc: cleanValue(rightEye.bc),
          remarks: cleanValue(rightEye.remarks),
        },
        leftEye: {
          type: cleanValue(leftEye.type),
          sph: cleanValue(leftEye.sph),
          cyl: cleanValue(leftEye.cyl),
          axis: cleanValue(leftEye.axis),
          add: cleanValue(leftEye.add),
          pd: cleanValue(leftEye.pd),
          bc: cleanValue(leftEye.bc),
          remarks: cleanValue(leftEye.remarks),
        },
        notes: cleanValue(notes),
      };

      console.log(
        "📤 Sending prescription payload:",
        JSON.stringify(payload, null, 2)
      );
      const res = await StaffAPI.prescriptions.create(payload);
      console.log("✅ Prescription created:", res);
      setResult(res);
      setShowSuccess(true);

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        navigate("/staff-dashboard/prescriptions");
      }, 2000);
    } catch (e) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Create failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  const reset = () => {
    setPatientId("");
    setRightEye({
      type: "Progressive",
      sph: "",
      cyl: "",
      axis: "",
      add: "",
      pd: "",
      bc: "",
      remarks: "",
    });
    setLeftEye({
      type: "Progressive",
      sph: "",
      cyl: "",
      axis: "",
      add: "",
      pd: "",
      bc: "",
      remarks: "",
    });
    setNotes("");
    setError(null);
    setShowSuccess(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Prescription
          </h1>
          <p className="text-gray-600">Create new prescription for patient</p>
        </div>
      </div>

      {showSuccess && result && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            ✓ Prescription created successfully (ID: {result.id}).
            Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Prescription Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Patient ID */}
          <div>
            <label className="text-sm font-medium">Patient ID *</label>
            <Input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter patient ID"
              disabled={loading}
            />
          </div>

          {/* Right Eye Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Right Eye (OD)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium">Type</label>
                <Select
                  value={rightEye.type}
                  onValueChange={(value) => updateRightEye("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Sphere (SPH)</label>
                <Input
                  value={rightEye.sph}
                  onChange={(e) => updateRightEye("sph", e.target.value)}
                  placeholder="+1.50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Cylinder (CYL)</label>
                <Input
                  value={rightEye.cyl}
                  onChange={(e) => updateRightEye("cyl", e.target.value)}
                  placeholder="-0.75"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Axis</label>
                <Input
                  value={rightEye.axis}
                  onChange={(e) => updateRightEye("axis", e.target.value)}
                  placeholder="90"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Add Power</label>
                <Input
                  value={rightEye.add}
                  onChange={(e) => updateRightEye("add", e.target.value)}
                  placeholder="+2.00"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">
                  Pupil Distance (PD)
                </label>
                <Input
                  value={rightEye.pd}
                  onChange={(e) => updateRightEye("pd", e.target.value)}
                  placeholder="62"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Base Curve (BC)</label>
                <Input
                  value={rightEye.bc}
                  onChange={(e) => updateRightEye("bc", e.target.value)}
                  placeholder="8.4"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Remarks</label>
                <Input
                  value={rightEye.remarks}
                  onChange={(e) => updateRightEye("remarks", e.target.value)}
                  placeholder="For reading"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Left Eye Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Left Eye (OS)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium">Type</label>
                <Select
                  value={leftEye.type}
                  onValueChange={(value) => updateLeftEye("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Sphere (SPH)</label>
                <Input
                  value={leftEye.sph}
                  onChange={(e) => updateLeftEye("sph", e.target.value)}
                  placeholder="+1.25"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Cylinder (CYL)</label>
                <Input
                  value={leftEye.cyl}
                  onChange={(e) => updateLeftEye("cyl", e.target.value)}
                  placeholder="-0.50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Axis</label>
                <Input
                  value={leftEye.axis}
                  onChange={(e) => updateLeftEye("axis", e.target.value)}
                  placeholder="180"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Add Power</label>
                <Input
                  value={leftEye.add}
                  onChange={(e) => updateLeftEye("add", e.target.value)}
                  placeholder="+2.00"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">
                  Pupil Distance (PD)
                </label>
                <Input
                  value={leftEye.pd}
                  onChange={(e) => updateLeftEye("pd", e.target.value)}
                  placeholder="62"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Base Curve (BC)</label>
                <Input
                  value={leftEye.bc}
                  onChange={(e) => updateLeftEye("bc", e.target.value)}
                  placeholder="8.4"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Remarks</label>
                <Input
                  value={leftEye.remarks}
                  onChange={(e) => updateLeftEye("remarks", e.target.value)}
                  placeholder="For reading"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              Additional Information
            </h3>
            <div>
              <label className="text-sm font-medium">Doctor's Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Patient prefers progressive lenses"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6 flex gap-2 flex-wrap">
            <Button onClick={submit} disabled={loading}>
              {loading ? "Creating..." : "Create Prescription"}
            </Button>
            <Button variant="outline" onClick={reset} disabled={loading}>
              Reset
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionCreate;
