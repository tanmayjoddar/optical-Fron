import React, { useEffect, useMemo, useState } from "react";
import { StaffAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpDown, Plus, RefreshCcw } from "lucide-react";

interface Company {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  active?: boolean;
  productCount?: number;
}
type SortKey = "name" | "products" | "created";
type SortDir = "asc" | "desc";

const CompaniesList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StaffAPI.inventory.getCompanies();
      setCompanies(Array.isArray(data) ? data : data?.items || []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = useMemo(() => {
    let list = [...companies];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => {
        const active = c.active !== false;
        return statusFilter === "active" ? active : !active;
      });
    }
    list.sort((a, b) => {
      let av: any;
      let bv: any;
      switch (sortKey) {
        case "products":
          av = a.productCount ?? -1;
          bv = b.productCount ?? -1;
          break;
        case "created":
          av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          av = (a.name || "").toLowerCase();
          bv = (b.name || "").toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [companies, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const sortIndicator = (key: SortKey) =>
    key !== sortKey ? (
      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    ) : (
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${sortDir === "asc" ? "rotate-180" : ""}`}
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg font-semibold">Companies</h1>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCompanies}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              window.location.href = "/staff-dashboard/inventory/companies/new";
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> New Company
          </Button>
        </div>
      </div>
      <Card className="p-3 space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <Input
            placeholder="Search companies"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded-md h-9 px-2 text-sm bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="text-xs text-muted-foreground">
            {filtered.length} / {companies.length} shown
          </div>
        </div>
        <Separator />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-1/4 cursor-pointer"
                  onClick={() => toggleSort("name")}
                >
                  Name {sortIndicator("name")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("products")}
                >
                  Products {sortIndicator("products")}
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("created")}
                >
                  Created {sortIndicator("created")}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-sm text-muted-foreground"
                  >
                    Loading companies...
                  </TableCell>
                </TableRow>
              )}
              {error && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-sm text-red-600"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-sm">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        No companies found.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href =
                            "/staff-dashboard/inventory/companies/new";
                        }}
                      >
                        Create First Company
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                filtered.map((c) => {
                  const active = c.active !== false;
                  const created = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString()
                    : "—";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.productCount ?? "—"}</TableCell>
                      <TableCell
                        className="max-w-xs truncate"
                        title={c.description}
                      >
                        {c.description || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{created}</TableCell>
                      <TableCell>
                        <Badge
                          variant={active ? "default" : "secondary"}
                          className={active ? "" : "opacity-60"}
                        >
                          {active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `/staff-dashboard/inventory/companies/${c.id}/products`;
                          }}
                        >
                          View Products
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `/staff-dashboard/inventory/products/create?companyId=${c.id}`;
                          }}
                        >
                          Add Product
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default CompaniesList;
