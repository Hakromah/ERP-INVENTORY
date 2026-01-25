"use client"

import ColumnFilter from "@/components/ColumnFilter"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IconDotsVertical } from "@tabler/icons-react"
import Image from "next/image"

export const getColumns = (filters, handleFilterChange, onEdit, onDelete) => [
   {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
         const thumbnailUrl = row.original.image?.formats?.thumbnail?.url;
         const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
         return (
            <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted">
               {thumbnailUrl ? (
                  <Image
                     src={`${baseUrl}${thumbnailUrl}`}
                     alt={row.original.name || "Product"}
                     width={80}
                     height={80}
                     unoptimized//to prevent nextjs from optimizing the image
                     className="object-cover h-full w-full"
                  />
               ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-[10px]">
                     No Img
                  </div>
               )}
            </div>
         );
      },
   },
   {
      accessorKey: "barcode",
      header: () => <ColumnFilter
         label="Barcode"
         placeholder="Filter barcode..."
         value={filters.barcode || ""}
         onChange={(val) => handleFilterChange("barcode", val)} />,
      cell: (info) => info.getValue(),
   },
   {
      accessorKey: "name",
      header: () => <ColumnFilter
         label="Name"
         placeholder="Filter name..."
         value={filters.name || ""}
         onChange={(val) => handleFilterChange("name", val)} />,
      cell: (info) => info.getValue(),

   },
   {
      accessorKey: "category.name",
      header: () => <ColumnFilter
         label="Category"
         placeholder="Filter category..."
         value={filters.category || ""}
         onChange={(val) => handleFilterChange("category", val)} />,
      cell: (info) => info.getValue(),

   },
   {
      accessorKey: "price",
      header: () => <ColumnFilter
         label="Price"
         placeholder="Filter price..."
         value={filters.price || ""}
         onChange={(val) => handleFilterChange("price", val)} />,
      cell: (info) => info.getValue(),

   },
   { accessorKey: "stock", header: "Stock", cell: (info) => info.getValue(), },

   { accessorKey: "description", header: "Description", cell: (info) => info.getValue(), },
   {
      id: "actions",
      cell: ({ row }) => (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button
                  variant="ghost"
                  className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                  size="icon">
                  <IconDotsVertical />
                  <span className="sr-only">Open menu</span>
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
               <DropdownMenuItem
                  onClick={() => {
                     onEdit(row.original);
                  }}
               >Edit
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               {/* <DropdownMenuItem onClick={() => onDelete(row.original)}>Delete</DropdownMenuItem> */}
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     {/* <Button variant="outline" onClick={() => onDelete(row.original)}>Delete</Button> */}
                     <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-red-500">Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This action cannot be undone. This will be deleted permanently
                           from the database.
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Continue</AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </DropdownMenuContent>
         </DropdownMenu>
      ),
   },
]
