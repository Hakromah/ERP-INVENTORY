"use client"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet } from "@/components/ui/sheet"
import axiosInstance from "@/lib/axios"
import { useEffect, useState } from "react"
import { getColumns } from "./features/columns"
import { DataTable } from "@/components/data-table"
import { New } from "./features/new"
import { toast } from "sonner"



const Page = () => {
   const [products, setProducts] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filters, setFilters] = useState({ name: "", barcode: "", category: "", description: "", price: "" });
   const [sheetOpen, setSheetOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState(null);

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
      query.set("populate[0]", "category");
      query.set("populate[1]", "image");

      if (filters.name) {
         query.set("filters[name][$containsi]", filters.name);
      }
      if (filters.price) {
         query.set("filters[price][$containsi]", filters.price);
      }

      if (filters.barcode) {
         query.set("filters[barcode][$eqi]", filters.barcode);
      }

      if (filters.category) {
         query.set("filters[category][name][$containsi]", filters.category);
      }


      if (filters.description) {
         query.set("filters[description][$containsi]", filters.description);
      }

      return query.toString();
   }


   //fetch data function can be called anytime we need
   const fetchData = () => {
      setLoading(true);
      axiosInstance
         .get(`/api/products?${buildQuery()}`)
         .then(response => {
            setProducts(response.data.data);
            setMeta(response.data.meta.pagination);
         })
         .catch(error => {
            console.log("Failed to fetch products:", error);
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
      if (!confirm(`Are you sure you want to delete "${item.name}" product?`)) return;
      try {
         await axiosInstance.delete(`/api/products/${item.documentId}`);
         await fetchData();
         toast.success("Product deleted successfully!");
      } catch (error) {
         console.log("Failed to delete product:", error);
         toast.error("Failed to delete product!");
      }
   }

   const columns = getColumns(filters, handleFilterChange, (item) => {
      setSelectedItem(item);
      setSheetOpen(true);
   }, handleDelete);

   console.dir(products, { depth: null });

   return (
      <div className="p-4 md:py-6 px-4 lg:px-6">
         <Card className="@container/card">
            <CardHeader>
               <CardTitle>Products</CardTitle>
               <CardDescription>
                  <span >
                     List of all products in the stock.
                  </span>
               </CardDescription>
               <CardAction >
                  <Button
                     onClick={() => {
                        setSelectedItem(null);
                        setSheetOpen(true);
                     }}
                  >
                     Add a new record
                  </Button>
                  {/* sheet component for edit and delete */}
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                     <New
                        item={selectedItem}
                        isOpen={sheetOpen}
                        onSuccess={() => {
                           setSheetOpen(false);
                           fetchData();
                        }}
                     />
                  </Sheet>
               </CardAction>
            </CardHeader>
            <CardContent>
               {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
               ) : (
                  <DataTable columns={columns} data={products} />
               )}
               <div className="flex items-center justify-between space-x-2 pt-4">
                  {/* Display current page info */}
                  {meta && (
                     <>
                        {products.length === 0
                           ? "No rows"
                           : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${(meta.page - 1) * meta.pageSize + products.length
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
