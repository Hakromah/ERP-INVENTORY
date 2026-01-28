"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import z from "zod";


const schema = z.object({
   customer_name: z.string().min(1, "Customer name is required"),
   invoice_number: z.string().min(1, "Invoice number is required"),
   customer_phone: z.string().min(1, "Phone number is required"),
   customer_email: z.string().min(1, "Email is required"),
   date: z.coerce.date(),
   notes: z.string().optional(),
   products: z.array(
      z.object({
         productId: z.string().min(1),
         name: z.string().min(1),
         quantity: z.coerce.number().min(1),
         price: z.number().min(1),
         stock: z.number(),
      })
   ),
});

const DISCOUNT_RATE = 0.1; // 10% discount
const TAX_RATE = 0.08; // 8% tax
export default function NewInvoicePage() {
   const router = useRouter();
   const [searchTerm, setSearchTerm] = useState("");
   const searchTimeout = useRef(null);
   const [loading, setLoading] = useState(false);
   const [searchResults, setSearchResults] = useState([]);



   const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
         invoice_number: "",
         customer_name: "",
         customer_email: "",
         customer_phone: "",
         products: [],
         date: new Date(),
         notes: "",
      },
   });

   const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "products",
   });

   function formatDateTimeLocal(date) {
      const pad = (n) => String(n).padStart(2, "0");

      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
   }

   useEffect(() => {
      if (searchTimeout.current) {
         clearTimeout(searchTimeout.current);
      }

      if (!searchTerm.trim()) {
         setSearchResults([]);
         return;
      }

      searchTimeout.current = setTimeout(async () => {
         // Simulate search
         try {
            setLoading(true);
            // Replace with actual API call
            const res = await axiosInstance.get(
               `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?filters[name][$containsi]=${searchTerm}&pagination[pageSize]=25`);
            const products = res.data.data.map((item) => ({
               id: item.id,
               name: item.name,
               price: item.price,
               stock: item.stock,
            }));
            setSearchResults(products);
         } catch (error) {
            console.log("Error searching products");
            setLoading(false);
         }
      }, 400); // Debounce time

   }, [searchTerm]);

   async function onSubmit(data) {
      console.log(data);
   }

   return (
      <Form {...form} >
         <form onSubmit={form.handleSubmit(onSubmit)}
            className="w-full p-4 space-y-6">
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center">
                     <Link href="/dashboard/sales">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                     </Link>
                     Create New Invoice
                  </CardTitle>
               </CardHeader>

               {/* Form fields go here */}
               <CardContent className="space-y-4">
                  <Label className="mb-4 text-lg text-primary">Invoice Number</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <FormField
                        control={form.control}
                        name="invoice_number"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Invoice Number</FormLabel>
                              <FormControl>
                                 <Input placeholder="Invoice Number" type="" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Date & Time</FormLabel>
                              <FormControl>
                                 <Input placeholder="Date & time"
                                    type="datetime-local"
                                    {...field}
                                    className="w-fit"
                                    value={
                                       field.value ? formatDateTimeLocal(new Date(field.value)) : ""
                                    }
                                    onChange={(e) => field.onChange(new Date(e.target.value))}
                                 />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="customer_name"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Customer Name</FormLabel>
                              <FormControl>
                                 <Input placeholder="Customer name" type="" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="customer_email"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Customer Email</FormLabel>
                              <FormControl>
                                 <Input placeholder="Customer email" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="customer_phone"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Customer Phone</FormLabel>
                              <FormControl>
                                 <Input placeholder="Customer phone" type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>

                  <Separator />

                  <Label className="mb-4 text-lg text-primary">Products Details</Label>
                  <div>
                     <Label className="mb-2">Search Products</Label>
                     <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products by name..." />

                     {loading && <p className="text-sm text-muted-foreground my-2">Searching...</p>}

                     {searchResults.length > 0 && (
                        <ScrollArea className="border rounded max-h-48 mt-2">
                           {searchResults.map((product) => (
                              <div key={product.id}
                                 className="cursor-pointer p-2 hover:bg-muted rounded"
                                 onClick={() => handleSelectProduct(product)}
                              >
                                 {product.name} - ${product.price} (Stock: {product.stock})
                              </div>
                           ))}
                        </ScrollArea>
                     )}
                  </div>

                  <Separator />

                  <Label className="mb-4 text-lg text-primary">Invoice Summary</Label>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                     <div className="col-span-4">
                        <FormField
                           control={form.control}
                           name="notes"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Notes</FormLabel>
                                 <FormControl className="h-36">
                                    <Textarea placeholder="Additional notes"
                                       {...field}
                                       rows={10} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <div className="col-span-2 flex flex-col justify-end space-y-2">
                        <div className="flex justify-between">
                           <span>Subtotal:</span>
                           <span>${0}</span>
                        </div>
                        <div className="flex justify-between">
                           <span>Discount ({DISCOUNT_RATE * 100}%):</span>
                           <span>-${0}</span>
                        </div>
                        <div className="flex justify-between">
                           <span>Tax ({TAX_RATE * 100}%):</span>
                           <span>${0}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                           <span>Total:</span>
                           <span>${0}</span>
                        </div>
                        <div className="flex gap-2 w-full items-center">
                           <Button type="submit">Submit Invoice</Button>
                           <Button type="button"
                              variant="outline"
                              onClick={() => router.push('/dashboard/sales')}>
                              Cancel
                           </Button>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </form>
      </Form>
   )
}
