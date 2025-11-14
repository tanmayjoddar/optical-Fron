import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/useAuth";
import { login } from "../store/authSlice";
import type { AppDispatch } from "../store";
 
// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type LoginFormInputs = {
  email: string;
  password: string;
};

type LoginType = "staff" | "shopAdmin" | "retailer" | "doctor" | "admin";

function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { token, type, loading, error } = useAuth();

  const [selectedType, setSelectedType] = useState<LoginType>("staff");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const onSubmit = (data: LoginFormInputs) => {
    if (selectedType === "admin") return; // admin disabled
    dispatch(login({ ...data, type: selectedType }));
  };

  useEffect(() => {
    if (token && type) {
      if (type === "staff") navigate("/staff-dashboard", { replace: true });
      if (type === "shopAdmin") navigate("/shop-admin-dashboard", { replace: true });
  if (type === "retailer") navigate("/retailer-dashboard", { replace: true });
  if (type === "doctor") navigate("/doctor-dashboard", { replace: true });
    }
  }, [token, type, navigate]);

  const typeLabel = useMemo(() => {
    switch (selectedType) {
      case "staff":
        return "Staff";
      case "shopAdmin":
        return "Shop Admin";
      case "retailer":
        return "Retailer";
      case "doctor":
        return "Doctor";
      case "admin":
        return "Admin (Coming Soon)";
      default:
        return "Select Type";
    }
  }, [selectedType]);

  // (Removed legacy auto-redirect logic)

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: `url('/src/assets/gls.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <form className="w-full max-w-md glass-card rounded-2xl p-6 sm:p-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-brand-gradient">Sign In</h2>
          <p className="text-sm text-muted-foreground">Choose a role and enter your credentials</p>
        </div>

        {/* Type selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Login as</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between clay">
                {typeLabel}
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuLabel>Select role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSelectedType("staff")}>Staff</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedType("shopAdmin")}>Shop Admin</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedType("retailer")}>Retailer</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedType("doctor")}>Doctor</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="opacity-60 pointer-events-none">Admin (Coming Soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" },
              })}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <Button type="submit" className="w-full clay-button" disabled={loading || selectedType === "admin"}>
            {loading ? "Signing in..." : `Sign in as ${typeLabel}`}
          </Button>
          {/* Quick direct links (optional) */}
          <div className="pt-2 text-center space-x-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Direct:</span>
            <button type="button" onClick={() => navigate('/staff-login')} className="underline hover:text-foreground">Staff</button>
            <button type="button" onClick={() => navigate('/shop-admin-login')} className="underline hover:text-foreground">Shop Admin</button>
            <button type="button" onClick={() => navigate('/retailer-login')} className="underline hover:text-foreground">Retailer</button>
            <button type="button" onClick={() => navigate('/doctor-login')} className="underline hover:text-foreground">Doctor</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
