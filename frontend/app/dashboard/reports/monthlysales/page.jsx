"use client"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axiosInstance from "@/lib/axios"
import { useEffect, useState } from "react"
import { getColumns } from "./features/columns"
// import { New } from "./features/new"
import { toast } from "sonner"



const Page = () => {
   const [sales, setSales] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filters, setFilters] = useState({ name: "", description: "" });
   const [setSheetOpen] = useState(false);
   const [setSelectedItem] = useState(null);


   //pagination states
   const [meta, setMeta] = useState({});
   const [page, setPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

   const handleFilterChange = (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
   };

   // Url query builder
   const buildQuery = () => {
      const query = new URLSearchParams();
      query.set("pagination[page]", page);
      query.set("pagination[pageSize]", pageSize);

      if (filters.invoice_number) {
         query.set("filters[invoice_number][$eqi]", filters.invoice_number);
      }
      if (filters.customer_name) {
         query.set("filters[customer_name][$containsi]", filters.customer_name);
      }
      if (filters.customer_email) {
         query.set("filters[customer_email][$eqi]", filters.customer_email);
      }
      if (filters.date) {
         query.set("filters[date][$eqi]", filters.date);
      }
      if (filters.customer_phone) {
         query.set("filters[customer_phone][$eqi]", filters.customer_phone);
      }

      //This month sales query
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1); //first day of next month

      query.set("filters[date][$gte]", startOfMonth.toISOString());
      query.set("filters[date][$lt]", endOfMonth.toISOString());


      return query.toString();
   }

   //fetch data function can be called anytime we need
   const fetchData = () => {
      setLoading(true);
      axiosInstance
         .get(`/api/sales?${buildQuery()}`)
         .then(response => {
            setSales(response.data.data);
            setMeta(response.data.meta.pagination);
         })
         .catch(error => {
            console.log("Failed to fetch sales:", error);
         }).finally(() => {
            setLoading(false);
         });
   }

   //call fetchData when page or pageSize changes
   useEffect(() => {
      fetchData();
   }, [page, pageSize, filters]);

   const handlePageSizeChange = (newPageSize) => {
      setPageSize(Number(newPageSize));
      setPage(1); // Reset to first page when page size changes
   }

   const handleDelete = async (item) => {
      // if (!confirm(`Are you sure you want to delete "${item.name}" sale?`)) return;
      try {
         await axiosInstance.delete(`/api/sales/${item.documentId}`);
         await fetchData();
         toast.success("Sale deleted successfully!");
      } catch (error) {
         console.log("Failed to delete sale:", error);
         toast.error("Failed to delete sale!");
      }
   }

   const columns = getColumns(
      filters,
      handleFilterChange,
      handleDelete);

   return (
      <div className="p-4 md:py-6 px-4 lg:px-6">
         <Card className="@container/card">
            <CardHeader>
               <CardTitle>Monthly Sales</CardTitle>
               <CardDescription>
                  <span >
                     List of monthly sales.
                  </span>
               </CardDescription>
            </CardHeader>
            <CardContent>
               {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
               ) : (
                  <DataTable columns={columns} data={sales} />
               )}
               <div className="flex items-center justify-between space-x-2 pt-4">
                  {/* Display current page info */}
                  {meta && (
                     <>
                        {sales.length === 0
                           ? "No rows"
                           : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${(meta.page - 1) * meta.pageSize + sales.length
                           } of ${meta.total} rows`}
                     </>
                  )}
                  <div className="flex items-center gap-2">
                     <Select
                        value={String(pageSize)}
                        onValueChange={handlePageSizeChange}
                     >
                        <SelectTrigger className="w-20 h-8">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="10">10</SelectItem>
                           <SelectItem value="25">25</SelectItem>
                           <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                     </Select>
                     <span className="text-sm">Rows per page</span>
                  </div>
                  <span className="whitespace-nowrap text-sm text-muted-foreground">
                     Page {meta?.page} of {meta?.pageCount}
                  </span>
                  {/* Pagination controls */}
                  <div className="flex gap-1">
                     <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                     >
                        {'<<'}
                     </Button>
                     <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage((old) => Math.max(old - 1, 1))}
                        disabled={page === 1}
                     >
                        {'<'}
                     </Button>
                     <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage((old) => Math.min(old + 1, meta?.pageCount || 1))}
                        disabled={page === meta?.pageCount}
                     >
                        {'>'}
                     </Button>
                     <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(meta?.pageCount || 1)}
                        disabled={page === meta?.pageCount}
                     >
                        {'>>'}
                     </Button>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
   )
}
export default Page
