"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
   Form
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
   SheetContent,
   SheetHeader,
   SheetTitle
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import axiosInstance from "@/lib/axios"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useController } from "react-hook-form";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

const formSchema = z.object({
   name: z.string().min(1, "Name is required").max(50, "Name is too long"),
   description: z.string().optional().or(z.literal("")),
   price: z.coerce.number().gt(0, "Price is required"),
   stock: z.coerce.number().gt(0, "Stock is required"),
   barcode: z.string().min(1, "Barcode is required").max(50, "Barcode is too long"),
   category: z.string().min(1, "Category is required"),
})

export const New = ({ item = null, onSuccess, isOpen }) => {
   const [loading, setLoading] = useState(false);
   const [categories, setCategories] = useState([]);
   const [categoryLoading, setCategoryLoading] = useState(false);
   //Image upload states
   const [uploading, setUploading] = useState(false);
   const [uploadProgress, setUploadProgress] = useState(0);
   const [imagePreview, setImagePreview] = useState(null);
   const [imageId, setImageId] = useState(null);


   const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
         name: item?.name ?? "",
         description: item?.description ?? "",
         price: item?.price ?? 0,
         stock: item?.stock ?? 0,
         barcode: item?.barcode ?? "",
         category: "",
      },
   })

   //load the data of selected item on the product table for editing
   useEffect(() => {
      if (!isOpen) return;
      if (item) {
         form.reset({
            name: item.name || "",
            description: item.description || "",
            price: item.price || 0,
            stock: item.stock || 0,
            barcode: item.barcode || "",
            category: item.category?.documentId || "",
         });

         if (item.image) {
            setImagePreview(item.image.url);
            setImageId(item.image.id);
         } else {
            setImagePreview(null);
            setImageId(null);
         }
      } else {
         form.reset({
            name: "",
            description: "",
            price: 0,
            stock: 0,
            barcode: "",
            category: "",
         });

         setImagePreview(null);
         setImageId(null);
      }
   }, [isOpen, item]);

   //handle image upload method
   const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("files", file);

      setUploading(true);
      setUploadProgress(0);

      try {
         const res = await axiosInstance.post("/api/upload", formData, {
            headers: {
               "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
               const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
               );
               setUploadProgress(progress);
            },
         });
         const uploadedImage = res.data[0];
         setImagePreview(uploadedImage.url);
         setImageId(uploadedImage.id);
         toast.success("Image uploaded successfully!");
      } catch (error) {
         toast.error("Image upload failed");
         console.log(error);
      } finally {
         setUploading(false);
      }
   }

   async function onSubmit(values) {
      setLoading(true);
      try {
         if (item?.id) {
            await axiosInstance.put(`/api/products/${item.documentId}`, {
               data: {
                  ...values,
                  category: values.category,
                  image: imageId ? imageId : null,
               }
            });
            toast.success("Product updated successfully!");
            //Strapi v5 uses documentId instead of id for updating & deleting
         } else {
            await axiosInstance.post("/api/products", {
               data: {
                  ...values,
                  category: values.category,
                  image: imageId ? imageId : null,
               }
            });
            toast.success("Product created successfully!");
         }
         if (onSuccess) onSuccess();
      } catch (error) {
         console.error("Error saving product:", error);
         toast.error("There was an error saving the product.");
      } finally {
         setLoading(false);
      }
   }

   //fetch categories for the select input
   useEffect(() => {
      const fetchCategories = async () => {
         setCategoryLoading(true);
         try {
            const response = await axiosInstance.get("/api/categories");
            setCategories(response.data.data);
         } catch (error) {
            toast.error("Failed to fetch categories:", error);
         } finally {
            setCategoryLoading(false);
         }
      }

      if (isOpen) fetchCategories();

   }, [isOpen]);

   const {
      field: { onChange, value },
   } = useController({
      name: "category",
      control: form.control,
   });

   return (
      <SheetContent className="flex flex-col h-full sm:max-w-106.25">
         <SheetHeader>
            <SheetTitle>{item?.id ? "Edit " : "Add new "}Product</SheetTitle>
         </SheetHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-6 overflow-y-scroll pb-10">
               <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                     id="name"
                     placeholder="Product name"
                     {...form.register("name")}
                  />
                  <FieldError>{form.formState.errors.name?.message}</FieldError>
               </Field>

               {/* Custom Category Selection Field */}
               <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  {categoryLoading ? (
                     <div className="flex items-center space-x-2 text-muted-foreground h-10">
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        <span>Loading categories...</span>
                     </div>
                  ) : (
                     <Select onValueChange={onChange} value={value}>
                        <SelectTrigger id="category" className="w-full">
                           <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                           {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.documentId}>
                                 {cat.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  )}
                  <FieldError>{form.formState.errors.category?.message}</FieldError>
               </Field>

               <Field>
                  <FieldLabel htmlFor="price">Price</FieldLabel>
                  <Input
                     id="price"
                     placeholder="Product price"
                     type="number"
                     step="0.01"
                     {...form.register("price")}
                  />
                  <FieldError>{form.formState.errors.price?.message}</FieldError>
               </Field>

               <Field>
                  <FieldLabel htmlFor="stock">Stock</FieldLabel>
                  <Input
                     id="stock"
                     placeholder="Product stock"
                     type="number"
                     {...form.register("stock")}
                  />
                  <FieldError>{form.formState.errors.stock?.message}</FieldError>
               </Field>

               <Field>
                  <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
                  <Input
                     id="barcode"
                     placeholder="Product barcode"
                     {...form.register("barcode")}
                  />
                  <FieldError>{form.formState.errors.barcode?.message}</FieldError>
               </Field>

               <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                     id="description"
                     placeholder="Product description"
                     {...form.register("description")}
                  />
                  <FieldError>{form.formState.errors.description?.message}</FieldError>
               </Field>

                  {/* Product Image upload */}
               <div className="space-y2">
                  <FieldLabel>Product Image</FieldLabel>
                  {imagePreview && (
                     <div className="relative w-full max-w-xs">
                        <Image
                           src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${imagePreview}`}
                           alt="Product preview"
                           width={500}
                           height={500}
                           unoptimized
                           className="object-cover rounded-md"
                        />
                        <button
                           type="button"
                           onClick={() => {
                              setImagePreview(null);
                              setImageId(null);
                           }}
                           className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow-md hover:bg-gray-100"
                        >
                           <X className="h-4 w-4 text-red-500" />
                        </button>
                     </div>
                  )}

                  <div>
                     <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
                        <UploadCloud className="h-4 w-4" />
                        Upload Image
                        <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleImageUpload}
                        />
                     </label>
                  </div>
                  {uploading && (
                     <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading... {uploadProgress}%
                     </div>
                  )}
               </div>
               <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            </form>
         </Form>
      </SheetContent>

   )
}
