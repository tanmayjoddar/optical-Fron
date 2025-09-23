import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RetailerAPI } from "@/lib/retailerApi";

export default function RetailerProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type Profile = {
    name?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    gstNo?: string;
    licenseNo?: string;
  };
  const [profile, setProfile] = useState<Profile>({});
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await RetailerAPI.getProfile();
        if (!mounted) return;
        setProfile(data || {});
      } catch (e) {
        const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
        setError(message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveProfile = async () => {
    try {
      setError(null);
      const { name, companyName, phone, address, gstNo, licenseNo } = profile;
      const updated = await RetailerAPI.updateProfile({ name, companyName, phone, address, gstNo, licenseNo });
      setProfile(updated);
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Failed to update profile");
    }
  };

  const changePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) return;
    try {
      setError(null);
      await RetailerAPI.changePassword(pwd);
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Failed to change password");
    }
  };

  if (loading) {
    return <Card className="glass-card"><CardHeader><CardTitle>Profile</CardTitle></CardHeader><CardContent>Loading...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-gradient">Profile</h2>
        <p className="text-muted-foreground">Update your account and company details</p>
      </div>

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-brand-gradient">Account</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <Input value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone</label>
            <Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Address</label>
            <Input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Company</label>
            <Input value={profile.companyName || ""} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">GST No</label>
            <Input value={profile.gstNo || ""} onChange={(e) => setProfile({ ...profile, gstNo: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">License No</label>
            <Input value={profile.licenseNo || ""} onChange={(e) => setProfile({ ...profile, licenseNo: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={saveProfile}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-brand-gradient">Change Password</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Current Password</label>
            <Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">New Password</label>
            <Input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button variant="secondary" onClick={changePassword}>Update Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
