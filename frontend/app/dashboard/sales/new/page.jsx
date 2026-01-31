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
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const schema = z.object({
   customer_name: z.string().min(1, "Customer name is required"),
   invoice_number: z.string().min(1, "Invoice number is required"),
   customer_phone: z.string().min(1, "Phone number is required"),
   customer_email: z.string().min(1, "Email is required"),
   date: z.coerce.date(),
   notes: z.string().optional(),
   // Dynamic Rates (0 to 100)
   discount_rate: z.coerce.number().min(0).max(100),
   tax_rate: z.coerce.number().min(0).max(100),
   products: z.array(
      z.object({
         productId: z.string().min(1),
         name: z.string().min(1),
         quantity: z.coerce.number().min(1),
         price: z.number().min(0),
         stock: z.number(),
      })
   ),
});

export default function NewInvoicePage() {
   const router = useRouter();
   const [searchTerm, setSearchTerm] = useState("");
   const searchTimeout = useRef(null);
   const [loading, setLoading] = useState(false);
   const [searchResults, setSearchResults] = useState([]);
   const [saving, setSaving] = useState(false);

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
         discount_rate: 10, // Default 10%
         tax_rate: 8,       // Default 8%
      },
   });

   const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "products",
   });

   // 1. WATCH EVERYTHING NEEDED FOR CALCULATION
   const watchedValues = useWatch({
      control: form.control,
      name: ["products", "discount_rate", "tax_rate"],
   });

   // Destructure with fallbacks to avoid errors
   const [products, discountRateInput, taxRateInput] = watchedValues || [[], 0, 0];

   // 2. DYNAMIC CALCULATION
   const totals = useMemo(() => {
      const sub = (products || []).reduce((acc, curr) => {
         const q = Number(curr.quantity) || 0;
         const p = Number(curr.price) || 0;
         return acc + (q * p);
      }, 0);

      // Convert Percentage to Decimal
      const discountRate = (Number(discountRateInput) || 0) / 100;
      const taxRate = (Number(taxRateInput) || 0) / 100;

      const discount = sub * discountRate;
      const taxableAmount = sub - discount;
      const tax = taxableAmount * taxRate;
      const final = taxableAmount + tax;

      return {
         subtotal: sub,
         discountAmount: discount,
         taxAmount: tax,
         total: final
      };
   }, [products, discountRateInput, taxRateInput]);

   function formatDateTimeLocal(date) {
      const pad = (n) => String(n).padStart(2, "0");
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
   }

   // ... Search Logic (kept exactly the same as before) ...
   useEffect(() => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (!searchTerm.trim()) {
         setSearchResults([]);
         return;
      }
      searchTimeout.current = setTimeout(async () => {
         try {
            setLoading(true);
            const res = await axiosInstance.get(
               `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?filters[name][$containsi]=${searchTerm}&pagination[pageSize]=25`
            );
            const data = res.data?.data || [];
            const products = data.map((item) => ({
               id: item.id,
               name: item.attributes ? item.attributes.name : item.name,
               price: item.attributes ? item.attributes.price : item.price,
               stock: item.attributes ? item.attributes.stock : item.stock,
            }));
            setSearchResults(products);
         } catch (error) {
            console.error("Error searching products", error);
         } finally {
            setLoading(false);
         }
      }, 400);
   }, [searchTerm]);

   const handleSelectProduct = (product) => {
      const currentProducts = form.getValues("products");
      const productExists = currentProducts.find((p) => p.productId === product.id.toString());
      if (productExists) {
         toast.error("Product already added");
      } else {
         append({
            productId: product.id.toString(),
            name: product.name,
            quantity: 1,
            price: Number(product.price),
            stock: product.stock,
         });
         setSearchTerm("");
         setSearchResults([]);
      }
   };

   async function onSubmit(data) {
      // 1. Prevent submission if no products
      if (data.products.length === 0) {
         toast.error("Please add at least one product.");
         return;
      }

      setSaving(true);

      try {
         // 2. Construct Payload
         // We merge Form Data (data) with Calculated Math (totals)
         const selectPayload = {
            customer_name: data.customer_name,
            invoice_number: data.invoice_number,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            date: data.date,
            notes: data.notes,

            // Send the rates so you know how you calculated it later
            discount_rate: data.discount_rate,
            tax_rate: data.tax_rate,

            // Map products to the format Strapi expects (usually relations need IDs)
            products: data.products.map((item) => ({
               product: item.productId, // Assuming 'product' is the relation field name in Strapi
               quantity: item.quantity,
               price: item.price,
               name: item.name // Optional: store snapshot of name in case product changes later
            })),

            // 3. Access the calculated totals from the useMemo hook
            subtotal: totals.subtotal,
            discount_amount: totals.discountAmount,
            tax_amount: totals.taxAmount,
            total: totals.total,
         };

         // 4. Send to Strapi
         const saleResponse = await axiosInstance.post(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/sale-transactions`,
            { data: selectPayload }
         );

         if (!saleResponse.data.data?.id) {
            throw new Error("Failed to create sale: No ID returned.");
         }

         toast.success("Sale created successfully!");
         router.push('/dashboard/sales');

      } catch (error) {
         console.error("Transaction Failed:", error);
         // specific error message from Strapi or generic fallback
         const errorMsg = error.response?.data?.error?.message || error.message || "An error occurred.";
         toast.error(`Transaction Failed: ${errorMsg}`);
      } finally {
         setSaving(false);
      }
   }

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="w-full p-4 space-y-6">
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center">
                     <Link href="/dashboard/sales">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                     </Link>
                     Create New Invoice
                  </CardTitle>
               </CardHeader>

               <CardContent className="space-y-4">
                  {/* ... Customer Details Section (Identical to previous) ... */}
                  <Label className="mb-4 text-lg text-primary">Invoice Number</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <FormField control={form.control} name="invoice_number" render={({ field }) => (
                        <FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>Date & Time</FormLabel><FormControl><Input type="datetime-local" className="w-fit" {...field} value={field.value ? formatDateTimeLocal(new Date(field.value)) : ""} onChange={(e) => field.onChange(new Date(e.target.value))} /></FormControl><FormMessage /></FormItem>
                     )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="customer_name" render={({ field }) => (<FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="customer_email" render={({ field }) => (<FormItem><FormLabel>Customer Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="customer_phone" render={({ field }) => (<FormItem><FormLabel>Customer Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>

                  <Separator />

                  {/* ... Product Search & List (Identical to previous) ... */}
                  <Label className="mb-4 text-lg text-primary">Products Details</Label>
                  <div className="relative">
                     <Label className="mb-2">Search Products</Label>
                     <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search products by name..." />
                     {loading && <p className="text-sm text-muted-foreground my-2">Searching...</p>}
                     {searchResults.length > 0 && (
                        <ScrollArea className="absolute z-10 w-full bg-white border rounded p-2 max-h-60 mt-2 shadow-md">
                           {searchResults.map((product) => (
                              <div key={product.id} className="cursor-pointer p-2 hover:bg-muted rounded" onClick={() => handleSelectProduct(product)}>
                                 {product.name} - ${product.price} (Stock: {product.stock})
                              </div>
                           ))}
                        </ScrollArea>
                     )}
                  </div>

                  {fields.map((item, index) => {
                     const currentVal = products?.[index] || item;
                     const rowTotal = (Number(currentVal.quantity || 0) * Number(currentVal.price || 0)).toFixed(2);
                     return (
                        <div key={item.id} className="border p-3 rounded mb-2 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                           <div><Label className="mb-2">Product</Label><Input value={item.name} readOnly /></div>
                           <div><Label className="mb-2">Quantity</Label><Input type="number" {...form.register(`products.${index}.quantity`, { valueAsNumber: true, min: 1 })} /></div>
                           <div><Label className="mb-2">Price</Label><Input type="number" {...form.register(`products.${index}.price`, { valueAsNumber: true, min: 0 })} /></div>
                           <div><Label className="mb-2">Amount</Label><Input className="text-primary font-bold" value={rowTotal} readOnly /></div>
                           <div className="pt-6"><Button variant="destructive" type="button" onClick={() => remove(index)}>Remove</Button></div>
                        </div>
                     );
                  })}

                  <Separator />

                  {/* === UPDATED INVOICE SUMMARY === */}
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
                                    <Textarea placeholder="Additional notes" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <div className="col-span-2 flex flex-col justify-end space-y-3">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Subtotal:</span>
                           <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                        </div>

                        {/* Editable Discount */}
                        <FormField
                           control={form.control}
                           name="discount_rate"
                           render={({ field }) => (
                              <FormItem className="flex justify-between items-center space-y-0">
                                 <FormLabel className="font-normal text-muted-foreground">
                                    Discount (%):
                                 </FormLabel>
                                 <div className="flex items-center gap-2">
                                    <FormControl>
                                       <Input
                                          {...field}
                                          className="w-16 h-8 text-right px-2"
                                          type="number"
                                          min="0"
                                          max="100"
                                       />
                                    </FormControl>
                                    <span className="w-20 text-right text-red-500">
                                       -${totals.discountAmount.toFixed(2)}
                                    </span>
                                 </div>
                              </FormItem>
                           )}
                        />

                        {/* Editable Tax */}
                        <FormField
                           control={form.control}
                           name="tax_rate"
                           render={({ field }) => (
                              <FormItem className="flex justify-between items-center space-y-0">
                                 <FormLabel className="font-normal text-muted-foreground">
                                    Tax Rate (%):
                                 </FormLabel>
                                 <div className="flex items-center gap-2">
                                    <FormControl>
                                       <Input
                                          {...field}
                                          className="w-16 h-8 text-right px-2"
                                          type="number"
                                          min="0"
                                          max="100"
                                       />
                                    </FormControl>
                                    <span className="w-20 text-right">
                                       +${totals.taxAmount.toFixed(2)}
                                    </span>
                                 </div>
                              </FormItem>
                           )}
                        />

                        <Separator />

                        <div className="flex justify-between font-bold text-lg">
                           <span>Total:</span>
                           <span>${totals.total.toFixed(2)}</span>
                        </div>

                        <div className="flex gap-2 w-full items-center mt-4">
                           <Button
                              type="submit"
                              className="flex-1"
                              disabled={saving}>
                              {saving ? "Submitting..." : "Submit Invoice"}</Button>
                           <Button type="button" variant="outline" onClick={() => router.push('/dashboard/sales')}>Cancel</Button>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </form>
      </Form>
   );
}
