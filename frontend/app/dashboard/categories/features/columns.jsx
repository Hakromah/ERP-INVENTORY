"use client"

import ColumnFilter from "@/components/ColumnFilter"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IconDotsVertical } from "@tabler/icons-react"

export const getColumns = (filters, handleFilterChange, onEdit, onDelete) => [
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
      accessorKey: "description",
      header: () => <ColumnFilter
         label="Description"
         placeholder="Filter description..."
         value={filters.description || ""}
         onChange={(val) => handleFilterChange("description", val)} />,
      cell: (info) => info.getValue(),

   },
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
