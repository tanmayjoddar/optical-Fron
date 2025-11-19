import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ShopAdminAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type RegisterFormInputs = {
  // Admin info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Shop info
  shopName: string;
  shopAddress: string;
  shopPhone: string; // REQUIRED - Changed from optional
  shopEmail: string; // REQUIRED - Changed from optional
};

export default function ShopAdminRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    mode: "onBlur",
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      // Validate before submitting
      if (!data.name?.trim()) {
        throw new Error("Admin name is required");
      }
      if (!data.email?.trim()) {
        throw new Error("Admin email is required");
      }
      if (!data.password) {
        throw new Error("Password is required");
      }
      if (data.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
        throw new Error(
          "Password must contain at least one lowercase letter, one uppercase letter, and one number"
        );
      }
      if (!data.shopName?.trim()) {
        throw new Error("Shop name is required");
      }
      if (!data.shopAddress?.trim()) {
        throw new Error("Shop address is required");
      }
      if (!data.shopPhone?.trim()) {
        throw new Error("Shop phone is required");
      }
      if (!data.shopEmail?.trim()) {
        throw new Error("Shop email is required");
      }

      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        shop: {
          name: data.shopName.trim(),
          address: data.shopAddress.trim(),
          phone: data.shopPhone.trim(),
          email: data.shopEmail.trim().toLowerCase(),
        },
      };

      console.log("Submitting registration with payload:", payload);
      const response = await ShopAdminAPI.auth.register(payload);

      console.log("Registration response:", response);
      setSuccess(true);

      // Store token if provided
      if (response?.token) {
        localStorage.setItem("shopAdminToken", response.token);
      }

      // Redirect to login after success
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err) {
      let errorMsg = "Registration failed";

      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "object" && err !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorObj = err as any;
        // Check for axios error response with detailed validation errors
        if (errorObj.response?.data?.details) {
          // Array of validation errors
          if (Array.isArray(errorObj.response.data.details)) {
            errorMsg = errorObj.response.data.details
              .map((detail: string | { field?: string; message?: string }) => {
                if (typeof detail === "string") return detail;
                return `${detail.field}: ${detail.message}`;
              })
              .join("\n");
          } else {
            errorMsg = JSON.stringify(errorObj.response.data.details);
          }
        } else if (errorObj.response?.data?.message) {
          errorMsg = errorObj.response.data.message;
        } else if (errorObj.response?.data?.error) {
          errorMsg = errorObj.response.data.error;
        } else if (errorObj.response?.data) {
          errorMsg = JSON.stringify(errorObj.response.data);
        }
      }

      console.error("Registration error:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="relative min-h-screen"
        style={{
          backgroundImage: `url('/src/assets/gls.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 sm:p-8 space-y-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-brand-gradient">
                Registration Successful!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your shop admin account has been created successfully.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: `url('/src/assets/gls.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <form
          className="w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-brand-gradient">
              Create Shop Admin Account
            </h2>
            <p className="text-sm text-muted-foreground">
              Register your shop and create an admin account
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Admin Section */}
            <div className="space-y-3 pb-4 border-b">
              <h3 className="text-sm font-semibold">Admin Information</h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Name must not exceed 100 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z\s'-]+$/,
                      message:
                        "Name can only contain letters, spaces, hyphens, and apostrophes",
                    },
                  })}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@shop.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address format",
                    },
                    minLength: {
                      value: 5,
                      message: "Email must be at least 5 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Email must not exceed 100 characters",
                    },
                  })}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Password must not exceed 50 characters",
                    },
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]+$/,
                      message:
                        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                    },
                  })}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-1"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => {
                      if (!value) return "Confirm password is required";
                      if (value !== password) return "Passwords do not match";
                      return true;
                    },
                  })}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Shop Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Shop Information</h3>

              <div>
                <label
                  htmlFor="shopName"
                  className="block text-sm font-medium mb-1"
                >
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="Your Optical Shop Name"
                  {...register("shopName", {
                    required: "Shop name is required",
                    minLength: {
                      value: 2,
                      message: "Shop name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Shop name must not exceed 100 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9\s&'-]+$/,
                      message:
                        "Shop name can only contain letters, numbers, spaces, &, hyphens, and apostrophes",
                    },
                  })}
                  className={errors.shopName ? "border-red-500" : ""}
                />
                {errors.shopName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.shopName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="shopAddress"
                  className="block text-sm font-medium mb-1"
                >
                  Shop Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="shopAddress"
                  type="text"
                  placeholder="123 Main Street, City, State, 12345"
                  {...register("shopAddress", {
                    required: "Shop address is required",
                    minLength: {
                      value: 10,
                      message: "Shop address must be at least 10 characters",
                    },
                    maxLength: {
                      value: 200,
                      message: "Shop address must not exceed 200 characters",
                    },
                  })}
                  className={errors.shopAddress ? "border-red-500" : ""}
                />
                {errors.shopAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.shopAddress.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="shopPhone"
                  className="block text-sm font-medium mb-1"
                >
                  Shop Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  id="shopPhone"
                  type="tel"
                  placeholder="+1234567890"
                  {...register("shopPhone", {
                    required: "Shop phone is required",
                    validate: (value) => {
                      if (!value) return "Phone number is required";
                      if (value.length < 7) {
                        return "Phone number must be at least 7 characters";
                      }
                      if (value.length > 15) {
                        return "Phone number must not exceed 15 digits";
                      }
                      if (
                        !/^\+?[1-9]\d{0,14}$/.test(value.replace(/[^\d+]/g, ""))
                      ) {
                        return "Please provide a valid phone number";
                      }
                      return true;
                    },
                  })}
                  className={errors.shopPhone ? "border-red-500" : ""}
                />
                {errors.shopPhone && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.shopPhone.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Format: +1234567890 (7-15 digits)
                </p>
              </div>

              <div>
                <label
                  htmlFor="shopEmail"
                  className="block text-sm font-medium mb-1"
                >
                  Shop Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="shopEmail"
                  type="email"
                  placeholder="shop@example.com"
                  {...register("shopEmail", {
                    required: "Shop email is required",
                    validate: (value) => {
                      if (!value) return "Shop email is required";
                      if (value.length < 5) {
                        return "Email must be at least 5 characters";
                      }
                      if (value.length > 100) {
                        return "Email must not exceed 100 characters";
                      }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        return "Invalid email address format";
                      }
                      return true;
                    },
                  })}
                  className={errors.shopEmail ? "border-red-500" : ""}
                />
                {errors.shopEmail && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.shopEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full clay-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm underline hover:text-foreground"
            >
              Go to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
