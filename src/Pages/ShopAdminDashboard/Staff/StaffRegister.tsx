import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopAdminAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, CheckCircle } from "lucide-react";

const STAFF_ROLES = [
  { value: "SALES_STAFF", label: "Sales Staff" },
  { value: "OPTOMETRIST", label: "Optometrist" },
  { value: "MANAGER", label: "Manager" },
];

export default function StaffRegister() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "SALES_STAFF",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return "Email is required";
    if (!formData.email.includes("@")) return "Invalid email format";
    if (!formData.password.trim()) return "Password is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    if (!formData.name.trim()) return "Name is required";
    if (!formData.role) return "Role is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ShopAdminAPI.staff.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        shopId: shopId || 0,
      });

      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        role: "SALES_STAFF",
      });

      // Show success message and redirect after 2 seconds
      setTimeout(() => {
        navigate("/shop-admin-dashboard/staff");
      }, 2000);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      setError(
        error?.response?.data?.message ||
          "Failed to register staff member. Please try again."
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Register New Staff</h1>
          <p className="text-muted-foreground">
            Add a new staff member to your shop
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-green-50 p-4 text-green-700 border border-green-200">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Success!</p>
              <p className="text-sm">
                Staff member registered successfully. Redirecting...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name *
            </label>
            <Input
              type="text"
              placeholder="Staff member's full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address *
            </label>
            <Input
              type="email"
              placeholder="staff@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange("role", value)}
            >
              <SelectTrigger
                className={loading ? "opacity-50 cursor-not-allowed" : ""}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 6 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password *
            </label>
            <Input
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              disabled={loading}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Registering..." : "Register Staff"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shop-admin-dashboard/staff")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Help text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> Staff members will
            receive their login credentials via email. They can change their
            password on first login.
          </p>
        </div>
      </Card>
    </div>
  );
}
