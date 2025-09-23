import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  AlertCircle,
  Edit,
  Clock,
  Trash2
} from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../hooks/useAuth";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  medicalHistory?: string;
  createdAt: string;
  updatedAt: string;
}

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { shopId } = useAuth();

  const handleDelete = async () => {
    if (!id || !patient || !shopId) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patient.name}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.patients.delete(parseInt(id), shopId);
      
      // Navigate back to patients list with success message
      navigate("/staff-dashboard/patients", {
        replace: true,
        state: { message: `${patient.name} has been deleted successfully.` }
      });
    } catch (err) {
      const message = (() => {
        if (typeof err === "object" && err && "response" in err) {
          const resp = (err as { response?: { data?: unknown } }).response;
          const data = resp?.data as { error?: string; message?: string } | undefined;
          return data?.error || data?.message;
        }
        return undefined;
      })();
      alert(message || "Failed to delete patient");
      console.error("Error deleting patient:", err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id || !shopId) {
        if (!id) setError("Patient ID not found");
        // Keep loading true until both are available
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.patients.getById(parseInt(id), shopId);
        setPatient(response.data);
      } catch (err) {
        const message = (() => {
          if (typeof err === "object" && err && "response" in err) {
            const resp = (err as { response?: { data?: unknown } }).response;
            const data = resp?.data as { error?: string; message?: string } | undefined;
            return data?.error || data?.message;
          }
          return undefined;
        })();
        setError(message || "Failed to fetch patient details");
        console.error("Error fetching patient:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, shopId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getGenderColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case "male": return "bg-blue-100 text-blue-800";
      case "female": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
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

        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</h3>
              <p className="text-gray-500 mb-4">{error || "The requested patient could not be found."}</p>
              <Link to="/staff-dashboard/patients">
                <Button>Return to Patients List</Button>
              </Link>
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
          <Link to="/staff-dashboard/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
            <p className="text-gray-600">View and manage patient information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/staff-dashboard/patients/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Patient
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete Patient"}
          </Button>
        </div>
      </div>

      {/* Patient Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                <Badge className={getGenderColor(patient.gender)}>
                  {patient.gender}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{patient.age} years old</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Added {formatDate(patient.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="demographics" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="medical">Medical History</TabsTrigger>
              <TabsTrigger value="visits">Visit History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="demographics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <p className="text-gray-900">{patient.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <p className="text-gray-900">{patient.age} years old</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <Badge className={getGenderColor(patient.gender)}>
                        {patient.gender}
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <p className="text-gray-900">{patient.phone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-gray-900">{patient.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.medicalHistory ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{patient.medicalHistory}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No medical history recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="visits">
              <Card>
                <CardHeader>
                  <CardTitle>Visit History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No visits recorded yet</p>
                    <p className="text-sm mt-1">Visit history will appear here once appointments are made</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <Edit className="mr-2 h-4 w-4" />
                Edit Patient
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Create Prescription
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Record Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Created</label>
                <p className="text-gray-600">{formatDate(patient.createdAt)}</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Last Updated</label>
                <p className="text-gray-600">{formatDate(patient.updatedAt)}</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Patient ID</label>
                <p className="text-gray-600">#{patient.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;