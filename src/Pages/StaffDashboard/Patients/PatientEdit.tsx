import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { AlertCircle, Save, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../hooks/useAuth";

interface PatientFormData {
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  medicalHistory?: string;
}


const PatientEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<PatientFormData>();

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      if (!id || !shopId) {
        if (!id) setError("Patient ID is required");
        // Keep loading true until both are available
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.patients.getById(parseInt(id), shopId);
        const patientData = response.data;
        
        // Populate form with existing data
        setValue("name", patientData.name);
        setValue("age", patientData.age);
        setValue("gender", patientData.gender);
        setValue("phone", patientData.phone);
        setValue("address", patientData.address);
        setValue("medicalHistory", patientData.medicalHistory || "");
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch patient details");
        console.error("Error fetching patient:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, setValue, shopId]);

  const onSubmit = async (data: PatientFormData) => {
    if (!id || !shopId) return;

    try {
      setSaving(true);
      setError(null);
      
      await api.patients.update(parseInt(id), data, shopId);
      
      // Success feedback
      navigate(`/staff-dashboard/patients/${id}`, { 
        replace: true,
        state: { message: "Patient updated successfully!" }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update patient");
      console.error("Error updating patient:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/staff-dashboard/patients")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Button>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading patient details...</span>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/staff-dashboard/patients")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Error Loading Patient</h3>
              <p className="text-gray-500">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/staff-dashboard/patients/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Patient</h1>
            <p className="text-gray-600">Update patient information</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name *</label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="Enter patient's full name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age */}
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Age *</label>
                <Input
                  id="age"
                  type="number"
                  {...register("age", { 
                    required: "Age is required",
                    min: { value: 1, message: "Age must be at least 1" },
                    max: { value: 150, message: "Age must be less than 150" }
                  })}
                  placeholder="Enter age"
                />
                {errors.age && (
                  <p className="text-sm text-red-600">{errors.age.message}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label htmlFor="gender" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Gender *</label>
                <select
                  {...register("gender", { required: "Gender is required" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Phone Number *</label>
              <Input
                id="phone"
                type="tel"
                {...register("phone", { required: "Phone number is required" })}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Address *</label>
              <Textarea
                id="address"
                {...register("address", { required: "Address is required" })}
                placeholder="Enter complete address"
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            {/* Medical History */}
            <div className="space-y-2">
              <label htmlFor="medicalHistory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Medical History</label>
              <Textarea
                id="medicalHistory"
                {...register("medicalHistory")}
                placeholder="Enter any relevant medical history (optional)"
                rows={4}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Updating..." : "Update Patient"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/staff-dashboard/patients/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientEdit;