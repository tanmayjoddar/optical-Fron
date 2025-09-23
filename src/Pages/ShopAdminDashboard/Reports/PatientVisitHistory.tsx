import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";

type Visit = {
  id: number; visitDate: string; purpose: string; notes: string;
  patient: { name: string; age: number; phone: string }
};

export default function PatientVisitHistory() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    axios.get("https://staff-production-c6d9.up.railway.app/shop-admin/reports/patients/visits?patientId=1&startDate=2025-09-01&endDate=2025-09-30", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setVisits(res.data));
  }, []);

  const paginated = visits.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(visits.length / pageSize);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <h2 className="font-bold mb-2">Patient Visit History</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Date</th>
              <th>Purpose</th>
              <th>Notes</th>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((visit: Visit) => (
              <tr key={visit.id} className="border-b">
                <td>{new Date(visit.visitDate).toLocaleDateString()}</td>
                <td>{visit.purpose}</td>
                <td>{visit.notes}</td>
                <td>{visit.patient.name}</td>
                <td>{visit.patient.age}</td>
                <td>{visit.patient.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
