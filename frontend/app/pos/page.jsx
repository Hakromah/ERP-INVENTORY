"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import axiosInstance from "@/lib/axios";
import { IconLoader2 } from "@tabler/icons-react";
import { Minus, MinusIcon, PlusIcon, Trash2Icon, TrashIcon, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { de } from "zod/v4/locales";



export default function POS() {
   const [cartVisible, setCartVisible] = useState(false);
   const [selectedCategory, setSelectedCategory] = useState(null);
   const [search, setSearch] = useState("");
   const [cart, setCart] = useState([]);
   const [discount, setDiscount] = useState(5);
   const [taxRate, setTaxRate] = useState(0.1);
   const [categories, setCategories] = useState([]);
   const [loadingCategories, setLoadingCategories] = useState(false);
   const [products, setProducts] = useState([]);
   const [loadingProducts, setLoadingProducts] = useState(false);
   const [debouncedSearch, setDebouncedSearch] = useState("");

   const { status } = useSession();

   const fetchCategories = async () => {
      setLoadingCategories(true);
      try {

         const res = await axiosInstance.get("/api/categories");
         setCategories(res.data.data);
      } catch (error) {
         console.error("Failed to fetch categories:", error);
         toast.error("Failed to fetch categories");
      } finally {
         setLoadingCategories(false);
      }
   }

   // Fetch products
   const fetchProducts = async () => {
      setLoadingProducts(true);
      try {

         const params = new URLSearchParams();

         params.append("populate[0]", "image");

         if (debouncedSearch) {
            params.append("filters[name][$containsi]", debouncedSearch);
         }

         if (selectedCategory !== null) {
            params.append("filters[category][id][$eqi]", selectedCategory);
         }

         const res = await axiosInstance.get(`/api/products?${params.toString()}`);

         setProducts(res.data.data);
      } catch (error) {
         console.error("Failed to fetch products:", error);
         toast.error("Failed to fetch products");
      } finally {
         setLoadingProducts(false);
      }
   }

   //Debounce search
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(search);
      }, 500);
      return () => clearTimeout(timer);
   }, [search]);

   // fetch categories when user is authenticated
   useEffect(() => {
      if (status === "authenticated") {
         fetchCategories();

      }
   }, [status]);

   useEffect(() => {
      if (status === "authenticated") {
         fetchProducts();
      }
   }, [debouncedSearch, selectedCategory, status]);


   if (status === "loading")
      return (
         <IconLoader2 className="size-10 animate-spain mx-auto h-screen
         text-gray-500"/>
      );

   if (status === "unauthenticated") {
      redirect("/login");
   }

   const addToCart = (product) => {
      setCart((prev) => {
         const existing = prev.find((item) => item.id === product.id);
         if (existing) {
            return prev.map((item) =>
               item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 } : item
            );
         } else {
            return [...prev, { ...product, quantity: 1 }];
         }
      });
   };

   const removeFromCart = (id) => {
      setCart((prev) => prev.filter((item) => item.id !== id));
   };

   const updateQuantity = (id, qty) => {
      if (qty < 1) {
         return removeFromCart(id);
      };

      setCart((prev) =>
         prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
      );
   }

   const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
   const tax = (subtotal - discount) * taxRate;
   const total = subtotal - discount + tax;

   const handleCheckout = () => {
      // Handle checkout logic here
      console.log("Checkout:", cart);
      setCart([]);
      setCartVisible(false);
   };


   return (
      <div className="flex flex-col md:flex-row h-screen relative bg-background text-foreground">
         {/* Cart Toggle Button for small screen */}
         <Button
            onClick={() => setCartVisible(true)}
            className="md:hidden fixed bottom-4 right-4 z-50 "
         >
            View Cart
         </Button>

         {/* Main Content */}
         <div className="flex-1 p-4 pt-0 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background z-20 pb-2 mb-2 pt-2">
               <div className="flex justify-between items-center mb-2">
                  <h1 className="text-xl font-bold">Point of Sale</h1>
                  <div className="flex items-center gap-2">
                     <Link href="/dashboard">
                        <Button size="icon" variant="ghost">
                           <X className="w-5 h-5" />
                        </Button>
                     </Link>
                  </div>
               </div>

               {/* Search Bar */}
               <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-2 w-full"
               />
            </div>

            {/* Category List */}
            <div className="flex gap-2 overflow-x-auto sticky top-26 bg-background py-2 z-10">
               {loadingCategories ? (
                  <div className="flex items-center gap-2 mt-10 w-full">
                     <IconLoader2 className="size-10 animate-spin text-gray-500" />
                     <p>Loading categories...</p>
                  </div>
               ) : (
                  [{ id: null, name: "All" }, ...categories].map((cat) => (
                     <Button
                        key={cat?.id ?? "all"}
                        variant={cat?.id === selectedCategory ? "default" : "outline"}
                        onClick={() => setSelectedCategory(cat?.id)}
                        className="whitespace-nowrap"
                     >
                        {cat?.name}
                     </Button>
                  ))
               )}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
               {loadingProducts ? (
                  <div className="flex items-center gap-2 mt-10 w-full">
                     <IconLoader2 className="size-10 animate-spin text-gray-500" />
                     <p>Loading products...</p>
                  </div>
               ) : (
                  products.map((product, index) => (
                     <Card
                        key={index}
                        onClick={() => addToCart(product)}
                        className="w-full cursor-pointer overflow-hidden rounded-lg border border-primary shadow-sm p-0
                     hover:opacity-80"
                     >
                        <Image
                           src={process.env.NEXT_PUBLIC_STRAPI_URL + product.image.url || "/square-box.jpg"}
                           alt="Product Image"
                           width={600}
                           height={400}
                           className="w-full h-48 object-cover"
                           style={{ aspectRatio: "600/400", objectFit: "cover" }}
                           unoptimized={true}
                        />
                        <CardContent className="p-4 pt-0">
                           <div className="flex items-center justify-between">
                              <h3 className="text-base font-semibold">{product.name}</h3>
                              <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
                           </div>
                        </CardContent>
                     </Card>
                  ))
               )}
            </div>
         </div>

         {/* Cart Sidebar */}
         <div
            className={`
         fixed md:static top-0 right-0 h-full w-80 bg-muted border-l p-4 overflow-auto z-40
         ${cartVisible ? "block" : "hidden"} md:block
         `}
         >
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">Cart</h2>
               <Button
                  size="icon"
                  variant="ghost"
                  className="md:hidden"
                  onClick={() => setCartVisible(false)}>
                  <X className="w-4 h-4" />
               </Button>
            </div>
            {cart.length === 0 && (
               <p className="text-muted-foreground text-sm">Your cart is empty.</p>
            )}

            {cart.map((item) => (
               <div key={item.id} className="py-2 border-b">
                  <div className="flex items-center justify-between">
                     <Image
                        src="/square-box.jpg"
                        alt="Product Image"
                        width={600}
                        height={400}
                        className="w-16 h-16 object-cover"
                        style={{ aspectRatio: "600/400", objectFit: "cover" }}
                        unoptimized={true}
                     />
                     <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                           ${item.price.toFixed(2)} x  {item.quantity}
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs font-semibold">
                           ${(item.price * item.quantity).toFixed(2)}
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                           <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                              <MinusIcon className="w-4 h-4" />
                           </Button>

                           <span className="px-1">{item.quantity}</span>
                           <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <PlusIcon className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  </div>

                  <div className="text-right mt-1">
                     <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)}
                        className="text-red-600">
                        <Trash2Icon className="w-4 h-4" />
                     </Button>
                  </div>
               </div>
            ))}

            {cart.length > 0 && (
               <div className="mt-6">
                  <div className="flex justify-between text-sm mb-1">
                     <span>Subtotal:</span>
                     <span>
                        ${subtotal.toFixed(2)}
                     </span>
                  </div>

                  <div className="flex justify-between text-sm mb-1">
                     <span>Discount:</span>
                     <span>
                        <Input
                           type="number"
                           value={discount}
                           onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                           className="w-20 text-right h-7 px-1"
                        />
                     </span>
                  </div>

                  <div className="flex justify-between text-sm mb-1">
                     <span>Tax: (%)</span>
                     <span>
                        <Input
                           type="number"
                           value={taxRate * 100}
                           onChange={(e) =>
                              setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                           className="w-20 text-right h-7 px-1"
                        />
                     </span>
                  </div>
                  <Separator className="my-2" />

                  <div className="flex justify-between font-bold text-lg">
                     <span>Total:</span>
                     <span>${total.toFixed(2)}</span>
                  </div>
                  <Button className="mt-4 w-full" onClick={handleCheckout}>
                     Checkout
                  </Button>
               </div>
            )}
         </div>
      </div>
   )
}
