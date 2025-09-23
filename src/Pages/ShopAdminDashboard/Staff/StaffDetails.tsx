import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { Card } from "@/components/ui/card";

type Attendance = { id: number; checkIn: string; checkOut?: string | null };
type Invoice = { id: number; totalAmount: number; patient: { name: string } ; createdAt: string };
type Prescription = { id: number; patient: { name: string }; createdAt: string };
type StaffDetail = { id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string; attendance: Attendance[]; invoices: Invoice[]; prescriptions: Prescription[] };

export default function StaffDetails() {
  const { staffId } = useParams();
  const [details, setDetails] = useState<StaffDetail | null>(null);

  useEffect(() => {
    if (!staffId) return;
    axios.get(`https://staff-production-c6d9.up.railway.app/shop-admin/staff/${staffId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setDetails(res.data));
  }, [staffId]);

  if (!details) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="mb-4">
        <h2 className="font-bold mb-2">Staff Details</h2>
        <div>Name: {details.name}</div>
        <div>Email: {details.email}</div>
        <div>Role: {details.role}</div>
        <div>Status: {details.isActive ? "Active" : "Inactive"}</div>
        <div>Joined: {new Date(details.createdAt).toLocaleDateString()}</div>
      </Card>
      <Card className="mb-4">
        <h2 className="font-bold mb-2">Attendance</h2>
        <ul>
          {details.attendance.map((att: Attendance) => (
            <li key={att.id} className="mb-1">
              Check-in: {new Date(att.checkIn).toLocaleString()} | Check-out: {att.checkOut ? new Date(att.checkOut).toLocaleString() : "-"}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mb-4">
        <h2 className="font-bold mb-2">Invoices</h2>
        <ul>
          {details.invoices.map((inv: Invoice) => (
            <li key={inv.id} className="mb-1">
              Invoice #{inv.id} - ₹{inv.totalAmount} ({inv.patient.name}) on {new Date(inv.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Prescriptions</h2>
        <ul>
          {details.prescriptions.map((pres: Prescription) => (
            <li key={pres.id} className="mb-1">
              Prescription #{pres.id} ({pres.patient.name}) on {new Date(pres.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
