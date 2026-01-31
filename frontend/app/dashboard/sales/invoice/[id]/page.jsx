"use client"

import axiosInstance from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function InvoicePrint() {
   const [invoice, setInvoice] = useState(null);
   const router = useRouter();
   const usePrint = useRef();
   const { id } = useParams();

   useEffect(() => {
      const fetchInvoice = async () => {
         try {
            const res = await axiosInstance.get(
               `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/sales/${id}?populate[products][populate][product][populate]=image`
            );
            setInvoice(res.data.data);
         } catch (error) {
            console.error("Failed to fetch invoice:", error);
         }
      };
      fetchInvoice();
   }, [id]);

   const handlePrint = () => {
      window.print();
   };

   if (!invoice) {
      return <div>Loading...</div>;
   }

   return (
      <div className="invoice-print">
         <button onClick={handlePrint}>Print Invoice</button>
         <div className="invoice-content">
            <h1>Invoice Details</h1>
            <p>Invoice ID: {invoice.id}</p>
            <p>Customer: {invoice.customer?.name || "N/A"}</p>
            <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
         </div>
      </div>
   )
}
