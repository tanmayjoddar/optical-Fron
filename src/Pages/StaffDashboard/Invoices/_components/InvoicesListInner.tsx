import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StaffAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import {
  RefreshCcw,
  Filter,
  Download,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router";

interface InvoiceRow {
  id: string | number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  total?: number;
  paidAmount?: number;
  subtotal?: number;
  totalDiscount?: number;
  totalCgst?: number;
  totalSgst?: number;
  patientId?: number;
  customerId?: number;
  staffId?: number;
  prescriptionId?: number;
  patient?: { id: number; name?: string; phone?: string };
  customer?: { id: number; name?: string; phone?: string };
  staff?: { id: number; name?: string; email?: string; role?: string };
  items?: Array<{ productId: number; quantity: number; unitPrice: number }>;
  transactions?: Array<{ id: number; amount: number; paymentMethod: string }>;
}

type StatusOption = { value: string; label: string; color: string };
const STATUS_OPTIONS: StatusOption[] = [
  { value: "paid", label: "Paid", color: "bg-green-600 text-white" },
  { value: "unpaid", label: "Unpaid", color: "bg-orange-500 text-white" },
  { value: "pending", label: "Pending", color: "bg-blue-500 text-white" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-600 text-white" },
  {
    value: "partially_paid",
    label: "Partially Paid",
    color: "bg-amber-500 text-white",
  },
];
const pageSizeOptions = [10, 20, 50];

const InvoicesListInner: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>("");
  const [patientId, setPatientId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<"date" | "total" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { page, limit };
      if (status) params.status = status;
      if (patientId) params.patientId = Number(patientId);
      if (customerId) params.customerId = Number(customerId);
      if (staffId) params.staffId = Number(staffId);
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await StaffAPI.invoices.getAll(params);
      if (Array.isArray(res)) {
        setInvoices(res as InvoiceRow[]);
        setTotal(res.length);
      } else {
        setInvoices(res?.items || []);
        setTotal(res?.total || res?.items?.length || 0);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, patientId, customerId, staffId, startDate, endDate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((inv) => String(inv.id).toLowerCase().includes(q));
    }
    if (partySearch.trim()) {
      const q2 = partySearch.trim().toLowerCase();
      list = list.filter((inv) =>
        (inv.patient?.name || inv.customer?.name || "")
          .toLowerCase()
          .includes(q2)
      );
    }
    list.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "date") {
        av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (sortKey === "total") {
        av = a.total ?? 0;
        bv = b.total ?? 0;
      } else {
        av = a.status || "";
        bv = b.status || "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [invoices, search, partySearch, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const analytics = useMemo(() => {
    const count = filtered.length;
    let totalAmount = 0;
    let paid = 0;
    let unpaid = 0;
    filtered.forEach((inv) => {
      if (inv.total != null) totalAmount += inv.total;
      else if (inv.paidAmount != null) totalAmount += inv.paidAmount;
      const st = (inv.status || "").toLowerCase();
      if (st === "paid") paid++;
      else if (st === "unpaid" || st === "pending" || st === "partially_paid")
        unpaid++;
    });
    const avg = count > 0 ? totalAmount / count : 0;
    return { count, totalAmount, paid, unpaid, avg };
  }, [filtered]);

  const exportCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Status",
      "Total",
      "Paid",
      "PatientId",
      "CustomerId",
    ];
    const rows = filtered.map((i) => [
      i.id,
      i.createdAt || "",
      i.status || "",
      i.total ?? "",
      i.paidAmount ?? "",
      i.patientId ?? "",
      i.customerId ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (st?: string) => {
    if (!st) return <Badge variant="secondary">—</Badge>;
    const lower = st.toLowerCase();
    const found = STATUS_OPTIONS.find((o) => o.value === lower);
    const cls = found ? found.color : "bg-gray-300 text-gray-800";
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
        {found ? found.label : st}
      </span>
    );
  };

  const sortIndicator = (key: typeof sortKey) => (
    <ArrowUpDown
      className={`inline h-3 w-3 ml-1 ${
        sortKey === key ? "text-foreground" : "opacity-40"
      }`}
    />
  );

  const resetFilters = () => {
    setStatus("");
    setPatientId("");
    setCustomerId("");
    setStaffId("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPartySearch("");
    setPage(1);
  };

  const preset = (type: "today" | "7d" | "month") => {
    const now = new Date();
    let s: Date;
    const e = new Date();
    if (type === "today") {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (type === "7d") {
      s = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
    } else {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setStartDate(fmt(s));
    setEndDate(fmt(e));
    setPage(1);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage invoices with filters & analytics
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button
            size="sm"
            onClick={() => navigate("/staff-dashboard/invoices/create")}
          >
            <Plus className="h-4 w-4 mr-1" /> New Invoice
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("/staff-dashboard/invoices/payment")}
          >
            Process Payment
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchInvoices()}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <Card className="p-3 space-y-1 text-center">
          <div className="text-xs text-muted-foreground">Invoices</div>
          <div className="text-lg font-semibold">{analytics.count}</div>
        </Card>
        <Card className="p-3 space-y-1 text-center">
          <div className="text-xs text-muted-foreground">Total Amount</div>
          <div className="text-lg font-semibold">
            {formatCurrency(analytics.totalAmount)}
          </div>
        </Card>
        <Card className="p-3 space-y-1 text-center">
          <div className="text-xs text-muted-foreground">Paid</div>
          <div className="text-lg font-semibold">{analytics.paid}</div>
        </Card>
        <Card className="p-3 space-y-1 text-center">
          <div className="text-xs text-muted-foreground">Unpaid/Pending</div>
          <div className="text-lg font-semibold">{analytics.unpaid}</div>
        </Card>
        <Card className="p-3 space-y-1 text-center">
          <div className="text-xs text-muted-foreground">Avg Value</div>
          <div className="text-lg font-semibold">
            {formatCurrency(analytics.avg)}
          </div>
        </Card>
      </div>
      <Card className="p-4 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        <div
          className="flex flex-wrap gap-3 items-end"
          aria-label="Invoice Filters"
        >
          <div className="space-y-1">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="invSearchId"
            >
              Search (ID)
            </label>
            <div className="flex gap-2">
              <Input
                id="invSearchId"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const v = search.trim();
                    if (!v) return;
                    const n = Number(v);
                    if (Number.isFinite(n)) {
                      try {
                        setLoading(true);
                        setError(null);
                        const inv = await StaffAPI.invoices.getById(String(v));
                        if (inv && inv.id)
                          navigate(`/staff-dashboard/invoices/${inv.id}`);
                      } catch (err: unknown) {
                        const error = err as {
                          response?: { data?: { message?: string } };
                        };
                        setError(
                          error?.response?.data?.message || "Invoice not found"
                        );
                      } finally {
                        setLoading(false);
                      }
                    }
                  }
                }}
                placeholder="Invoice ID"
                className="w-40"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const v = search.trim();
                  if (!v) return;
                  const n = Number(v);
                  if (!Number.isFinite(n)) {
                    setError("Enter a valid invoice id");
                    return;
                  }
                  try {
                    setLoading(true);
                    setError(null);
                    const inv = await StaffAPI.invoices.getById(String(v));
                    if (inv && inv.id)
                      navigate(`/staff-dashboard/invoices/${inv.id}`);
                  } catch (err: unknown) {
                    const error = err as {
                      response?: { data?: { message?: string } };
                    };
                    setError(
                      error?.response?.data?.message || "Invoice not found"
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Go
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="invPartySearch"
            >
              Party Name
            </label>
            <Input
              id="invPartySearch"
              value={partySearch}
              onChange={(e) => {
                setPartySearch(e.target.value);
                setPage(1);
              }}
              placeholder="Patient/Customer"
              className="w-44"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="border rounded-md h-9 px-2 text-sm bg-background w-40"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Start
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> End
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => preset("today")}>
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={() => preset("7d")}>
              Last 7d
            </Button>
            <Button size="sm" variant="outline" onClick={() => preset("month")}>
              This Month
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAdvanced((a) => !a)}
            aria-expanded={showAdvanced}
          >
            <Filter className="h-4 w-4 mr-1" />
            Advanced
          </Button>
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Reset
          </Button>
        </div>
        {showAdvanced && (
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Patient ID
              </label>
              <Input
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  setPage(1);
                }}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Customer ID
              </label>
              <Input
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPage(1);
                }}
                className="w-32"
              />
            </div>
          </div>
        )}
        <Separator />
        <div className="overflow-x-auto">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No invoices found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("date")}
                  >
                    Date {sortIndicator("date")}
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("status")}
                  >
                    Status {sortIndicator("status")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("total")}
                  >
                    Total {sortIndicator("total")}
                  </TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => {
                  const date = inv.createdAt
                    ? new Date(inv.createdAt).toLocaleString()
                    : "—";
                  return (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-muted/40 focus-within:bg-muted/60"
                    >
                      <TableCell>{date}</TableCell>
                      <TableCell className="font-medium">{inv.id}</TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell>
                        {inv.total != null
                          ? formatCurrency(inv.total)
                          : inv.paidAmount != null
                          ? formatCurrency(inv.paidAmount)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {inv.paidAmount != null
                          ? formatCurrency(inv.paidAmount)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {inv.customer?.name ||
                          inv.patient?.name ||
                          inv.customerId ||
                          inv.patientId ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/staff-dashboard/invoices/${inv.id}`)
                            }
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const blob = await StaffAPI.invoices.getPdf(
                                  String(inv.id)
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `invoice-${inv.id}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch {
                                /* silent */
                              }
                            }}
                          >
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex items-center justify-between text-sm pt-3">
          <div className="flex items-center gap-3">
            <span>Page Size:</span>
            <select
              className="border rounded px-2 py-1 bg-background"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">Total: {total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages })
                .slice(0, 7)
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-2 py-1 rounded text-xs ${
                      page === i + 1
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              {totalPages > 7 && <span className="text-xs px-1">…</span>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvoicesListInner;
