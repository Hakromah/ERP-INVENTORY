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
import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axios"
import { toast } from "sonner"

const formSchema = z.object({
   name: z.string().min(1, "Name is required").max(50, "Name is too long"),
   description: z.string().optional().or(z.literal("")),
})

export const New = ({ item = null, onSuccess, isOpen }) => {
   const [loading, setLoading] = useState(false);

   const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
         name: item?.name ?? "",
         description: item?.description ?? "",
      },
   })

   async function onSubmit(values) {
      setLoading(true);

      if (item?.id) {
         await axiosInstance.put(`/api/products/${item.documentId}`, { data: values });
         toast.success("Product updated successfully!");
         //Strapi v5 uses documentId instead of id for updating & deleting
      } else {
         await axiosInstance.post("/api/products", { data: values });
         toast.success("Product saved successfully!");
      }
      if (onSuccess) onSuccess();
      setLoading(false);
   }

   //load the data of selected item on the product table for editing
   useEffect(() => {
      if (!isOpen) return;
      if (item) {
         form.reset({
            name: item.name || "",
            description: item.description || "",
         });
      } else {
         form.reset({
            name: "",
            description: "",
         });
      }
   }, [isOpen, item]);

   return (
      <SheetContent className="flex flex-col h-full sm:max-w-106.25">
         <SheetHeader>
            <SheetTitle>{item?.id ? "Edit " : "Add new "}Product</SheetTitle>
         </SheetHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-6">
               <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                     id="name"
                     placeholder="Product name"

                     {...form.register("name")}
                  />

                  <FieldError>{form.formState.errors.name?.message}</FieldError>
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
               <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            </form>
         </Form>
      </SheetContent>

   )
}

