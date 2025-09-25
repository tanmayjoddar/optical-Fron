import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShopAdminAPI } from "@/lib/api";

// Minimal type assumptions per docs; backend may return envelope { doctors: [] }
type Doctor = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  isActive?: boolean;
  createdAt?: string;
};

export default function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
    experience: "",
    password: "",
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ShopAdminAPI.doctors.getAll();
      const list: Doctor[] = Array.isArray(res)
        ? res as Doctor[]
        : Array.isArray((res as any)?.doctors)
          ? (res as any).doctors
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];
      setDoctors(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setError(null);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      };
      if (form.phone) payload.phone = form.phone.trim();
      if (form.qualification) payload.qualification = form.qualification.trim();
      if (form.specialization) payload.specialization = form.specialization.trim();
      if (form.experience) payload.experience = Number(form.experience);

      await ShopAdminAPI.doctors.add(payload);
      setForm({ name: "", email: "", phone: "", qualification: "", specialization: "", experience: "", password: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const toggleStatus = async (doctor: Doctor) => {
    setError(null);
    try {
      await ShopAdminAPI.doctors.updateStatus(doctor.id, !doctor.isActive);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return doctors.slice(start, start + pageSize);
  }, [doctors, page]);
  const totalPages = Math.max(1, Math.ceil(doctors.length / pageSize));

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="p-4 mb-4">
        <h2 className="font-bold mb-3">Doctors</h2>
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Name</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Doctor name" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="doctor@shop.com" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Phone</label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Qualification</label>
            <Input value={form.qualification} onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Specialization</label>
            <Input value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Experience (years)</label>
            <Input type="number" min={0} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Password</label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Password" />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <Button onClick={handleAdd} disabled={loading || !form.name.trim() || !form.email.trim() || !form.password}>
              {loading ? 'Saving…' : 'Add Doctor'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Qualification</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
              )}
              {!loading && paginated.map((doc) => (
                <tr key={doc.id} className="border-b">
                  <td>{doc.name}</td>
                  <td>{doc.email || '—'}</td>
                  <td>{doc.phone || '—'}</td>
                  <td>{doc.qualification || '—'}</td>
                  <td>{doc.specialization || '—'}</td>
                  <td>{doc.experience ?? '—'}</td>
                  <td>{doc.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="flex justify-end">
                      <Button variant={doc.isActive ? 'outline' : 'default'} size="sm" onClick={() => toggleStatus(doc)}>
                        {doc.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No doctors</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>Total: {doctors.length}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page<=1} onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</Button>
            <div>Page {page} / {totalPages}</div>
            <Button size="sm" variant="outline" disabled={page>=totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
