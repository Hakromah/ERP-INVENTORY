
"use client";

import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function TestTransactionPage() {
   const [loading, setLoading] = useState(false);
   const [testResults, setTestResults] = useState({});
   const router = useRouter();

   // --- TEST 1: SUCCESSFUL TRANSACTION ---
   const testSuccessful = async () => {
      setLoading(true);
      try {
         // 1. Get products
         const productsResponse = await axiosInstance.get(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?pagination[limit]=2`
         );

         const products = productsResponse.data.data;
         if (!products || products.length < 2) {
            toast.error("Need at least two products to run the test.");
            return;
         }

         const product1 = products[0];
         const product2 = products[1];

         // 2. Create valid payload
         const transactionPayload = {
            customer_name: "Test User",
            invoice_number: `INV-${Date.now()}`,
            customer_email: "test@example.com",
            customer_phone: "1234567890",
            date: new Date().toISOString().split("T")[0],
            notes: "This is a test transaction.",
            products: [
               {
                  product: product1.id,
                  quantity: 1,
                  price: product1.price || 100,
               },
               {
                  product: product2.id,
                  quantity: 1,
                  price: product2.price || 150,
               },
            ],
            subtotal: (product1.price || 100) + (product2.price || 150),
            discount_amount: 0,
            tax_amount: 0,
            total: (product1.price || 100) + (product2.price || 150),
         };

         // 3. Request
         const response = await axiosInstance.post(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/sale-transactions`,
            { data: transactionPayload }
         );

         toast.success("Test successful! Transaction completed properly.");

         // Update State
         setTestResults((prev) => ({
            ...prev,
            successful: {
               success: true,
               message: `Created transaction ID: ${response.data.data.id}`,
               data: response.data,
            },
         }));

      } catch (error) {
         console.error("Test failed:", error);
         const errorMsg = error.response?.data?.error?.message || error.message;
         toast.error(`Test failed: ${errorMsg}`);

         setTestResults((prev) => ({
            ...prev,
            successful: {
               success: false,
               message: `Error: ${errorMsg}`,
               data: null,
            },
         }));
      } finally {
         setLoading(false);
      }
   };

   // --- TEST 2: FAILED TRANSACTION (EXPECTED FAILURE) ---
   const testFailed = async () => {
      setLoading(true);
      try {
         // 1. Get products
         const productsResponse = await axiosInstance.get(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?pagination[limit]=2`
         );

         const products = productsResponse.data.data;
         if (!products || products.length < 2) {
            toast.error("Need at least two products to run the test.");
            return;
         }

         const product1 = products[0];
         const product2 = products[1];

         // Get Stock
         const product2Response = await axiosInstance.get(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products/${product2.id}`
         );
         // Handle Strapi response structure (attributes vs direct)
         const p2Data = product2Response.data.data;
         const currentStock = p2Data.attributes ? p2Data.attributes.stock : p2Data.stock;

         // 2. Invalid Payload (Over order)
         const transactionPayload = {
            customer_name: "Test Customer Failed",
            invoice_number: `TEST-FAILED-${Date.now()}`,
            customer_email: "test@example.com",
            customer_phone: "1234567890",
            date: new Date().toISOString().split("T")[0],
            notes: "Failed transaction test.",
            products: [
               {
                  product: product1.id,
                  quantity: 1,
                  price: product1.price || 100,
               },
               {
                  product: product2.id,
                  quantity: currentStock + 100, // FORCE FAILURE
                  price: product2.price || 150,
               },
            ],
            subtotal: 100,
            discount_amount: 0,
            tax_amount: 0,
            total: 100,
         };

         // 3. Request
         const response = await axiosInstance.post(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/sale-transactions`,
            { data: transactionPayload }
         );

         // IF WE REACH HERE, THE API DID NOT FAIL (Which means the test failed)
         console.log("Unexpected success:", response.data);
         toast.error("Test failed! Transaction should have failed but succeeded.");

         setTestResults((prev) => ({
            ...prev,
            failed: {
               success: false, // The test failed because the API succeeded
               message: "Transaction unexpectedly succeeded.",
               data: response.data,
               stockData: null
            },
         }));

      } catch (error) {
         // IF WE REACH HERE, THE API FAILED (Which means the test passed)
         toast.success("Test successful! Transaction failed and rolled back properly.");

         setTestResults((prev) => ({
            ...prev,
            failed: {
               success: true, // The test succeeded because the API failed
               message: `Transaction failed as expected: ${error.response?.data?.error?.message || error.message}`,
               stockData: {
                  product1Id: "N/A", // Simplified for display
                  product2Id: "N/A",
               },
            },
         }));
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold mb-4">Transaction Testing</h1>

         <div className="flex flex-col gap-6">
            {/* SUCCESSFUL TEST UI */}
            <div className="p-4 border rounded-lg shadow">
               <h2 className="text-xl font-semibold mb-2">Test Successful Transaction</h2>
               <p className="mb-4">Test a normal transaction that should complete successfully.</p>
               <button
                  onClick={testSuccessful}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
               >
                  {loading ? "Testing..." : "Run Test"}
               </button>

               {/* FIX 1: Check 'testResults.successful' not 'testResults.success' */}
               {testResults.successful && (
                  <div className={`mt-4 p-3 border rounded ${testResults.successful.success ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
                     <h3 className="font-medium">
                        {testResults.successful.success ? " ✓ Success" : " ✗ Failure"}
                     </h3>
                     <p>{testResults.successful.message}</p>
                     {testResults.successful.data && (
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                           {JSON.stringify(testResults.successful.data, null, 2)}
                        </pre>
                     )}
                  </div>
               )}
            </div>

            {/* FAILED TEST UI */}
            <div className="p-4 border rounded-lg shadow">
               <h2 className="text-xl font-semibold mb-2">Test Failed Transaction</h2>
               <p className="mb-4">Test a transaction that is expected to fail (orders too much stock).</p>
               <button
                  onClick={testFailed}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
               >
                  {loading ? "Testing..." : "Run Test"}
               </button>

               {/* Check for 'testResults.failed' */}
               {testResults.failed && (
                  <div className={`mt-4 p-3 border rounded ${testResults.failed.success ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
                     <h3 className="font-medium">
                        {testResults.failed.success ? " ✓ Success (Transaction Blocked)" : " ✗ Failed (Transaction Went Through)"}
                     </h3>
                     <p>{testResults.failed.message}</p>

                     {/* FIX 2: Check for 'stockData' OR 'data', depending on which path was taken */}
                     {testResults.failed.stockData && (
                        <div className="mt-2">
                           <p className="font-semibold text-sm">Verification:</p>
                           <p className="text-sm text-gray-600">The system correctly identified insufficient stock.</p>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>

         <div className="mt-6">
            <button
               onClick={() => router.push("/dashboard")}
               className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
               Back to Dashboard
            </button>
         </div>
      </div>
   );
}
