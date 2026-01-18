"use client";
import { RegisterForm } from "@/components/register-form";
import { IconBrandSketch, IconLoader3 } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {

   // Redirect to dashboard if already logged in and session exists
   const { data: session, status } = useSession();

   useEffect(() => {
      if (session && status === "authenticated") {
         redirect("/dashboard");
      }
   }, [session]);

   if (status === "loading") {
      return (
         <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
               <a href="#" className="flex items-center gap-2 self-center font-medium">
                  <div
                     className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                     <IconLoader3 className="size-10 animate-spin" />
                  </div>
                  Smart Inventory & POS
               </a>
            </div>
         </div>
      );
   }
   return (
      <div
         className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
         <div className="flex w-full max-w-sm flex-col gap-6">
            <a href="#" className="flex items-center gap-2 self-center font-medium">
               <div
                  className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                  <IconBrandSketch className="size-4" />
               </div>
               Smart Inventory & POS
            </a>
            <RegisterForm />
         </div>
      </div>
   );
}
