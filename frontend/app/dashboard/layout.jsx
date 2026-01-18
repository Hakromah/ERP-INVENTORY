"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
   SidebarInset,
   SidebarProvider,
} from "@/components/ui/sidebar";
import { IconLoader } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";


export default function Page({ children }) {
   const { status } = useSession();

   if (status === "loading") {
      return (
         <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
               <a href="#" className="flex items-center gap-2 self-center font-medium">
                  <div
                     className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                     <IconLoader className="size-10 animate-spin" />
                  </div>
                  Smart Inventory & POS
               </a>
            </div>
         </div>
      );
   }
   if (status === "unauthenticated") {
      redirect("/login");
   }
   return (
      <SidebarProvider
         style={
            {
               "--sidebar-width": "calc(var(--spacing) * 72)",
               "--header-height": "calc(var(--spacing) * 12)"
            }
         }>
         <AppSidebar variant="inset" />
         <SidebarInset>
            <SiteHeader />
            {children}
         </SidebarInset>
      </SidebarProvider>
   );
}
