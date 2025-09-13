import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Link } from "react-router";
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

const PatientCreate = () => {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PatientFormData>();

  const selectedGender = watch("gender");

  const onSubmit = async (data: PatientFormData) => {
    if (!shopId) {
      setError("Shop ID not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepare data with shopId
      const patientData = {
        ...data,
        age: parseInt(data.age.toString()),
        shopId: shopId
      };

      const response = await api.patients.create(patientData);
      
      setSuccess(true);
      
      // Show success message briefly, then navigate
      setTimeout(() => {
        if (response.data?.id) {
          navigate(`/staff-dashboard/patients/${response.data.id}`, { 
            replace: true,
            state: { message: "Patient created successfully!" }
          });
        } else {
          // Fallback to patients list if no ID returned
          navigate("/staff-dashboard/patients", { 
            replace: true,
            state: { message: "Patient created successfully!" }
          });
        }
      }, 1500);
      
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.message ||
        "Failed to create patient. Please try again."
      );
      console.error("Error creating patient:", err);
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: "Male", label: "Male", color: "bg-blue-100 text-blue-800" },
    { value: "Female", label: "Female", color: "bg-pink-100 text-pink-800" },
    { value: "Other", label: "Other", color: "bg-purple-100 text-purple-800" },
    { value: "Prefer not to say", label: "Prefer not to say", color: "bg-gray-100 text-gray-800" }
  ];

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/staff-dashboard/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          </Link>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Patient Created Successfully!
              </h3>
              <p className="text-gray-500 mb-4">
                Redirecting to patient details...
              </p>
              <div className="animate-spin mx-auto">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/staff-dashboard/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
          <p className="text-gray-600">Create a new patient record</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  {...register("name", { 
                    required: "Patient name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" }
                  })}
                  placeholder="Enter patient's full name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Age and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <Input
                    type="number"
                    {...register("age", { 
                      required: "Age is required",
                      min: { value: 0, message: "Age must be a positive number" },
                      max: { value: 150, message: "Please enter a valid age" }
                    })}
                    placeholder="Enter age"
                    className={errors.age ? "border-red-500" : ""}
                  />
                  {errors.age && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.age.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {genderOptions.map((option) => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          {...register("gender", { required: "Please select gender" })}
                          value={option.value}
                          className="sr-only"
                        />
                        <div className={`
                          p-2 rounded-lg border text-center text-sm transition-all
                          ${selectedGender === option.value 
                            ? `${option.color} border-current` 
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }
                        `}>
                          {option.label}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <Input
                  {...register("phone", { 
                    required: "Phone number is required",
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: "Please enter a valid phone number"
                    }
                  })}
                  placeholder="+1234567890"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <Textarea
                  {...register("address", { 
                    required: "Address is required",
                    minLength: { value: 10, message: "Please provide a complete address" }
                  })}
                  placeholder="Enter complete address"
                  rows={3}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.address.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical History
                  <span className="text-gray-400 font-normal"> (Optional)</span>
                </label>
                <Textarea
                  {...register("medicalHistory")}
                  placeholder="Enter any relevant medical history, allergies, or conditions..."
                  rows={4}
                />
                <p className="text-gray-500 text-sm mt-1">
                  Include any allergies, chronic conditions, or important medical notes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error creating patient</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Patient...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Create Patient
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={loading}
            >
              Clear Form
            </Button>
            
            <Link to="/staff-dashboard/patients">
              <Button variant="ghost" disabled={loading}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientCreate;