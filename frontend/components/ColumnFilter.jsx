"use client";

import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "./ui/button";
import { FilterX, Funnel } from "lucide-react";
import { Input } from "./ui/input";


export default function ColumnFilter({ label, value, onChange, placeholder }) {
   const [inputValue, setInputValue] = useState(value || "");
   const [open, setOpen] = useState(false);

   useEffect(() => {
      setInputValue(value || "");
   }, [value]);

   const handleApply = () => {
      onChange(inputValue);
      setOpen(false);
   };

   const handleClear = () => {
      setInputValue("");
      onChange("");
   };


   return (
      <div className="flex items-center gap-1">
         {label}
         {value ? (
            <Button variant="ghost" size="icon" onClick={handleClear} className="h-6 w-6 p-1 text-primary">
               <FilterX className="h-4 w-4" />
            </Button>
         ) : (
            <Popover open={open} onOpenChange={setOpen}>
               <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-1">
                     <Funnel className="h-4 w-4" />
                  </Button>
               </PopoverTrigger>
               <PopoverContent align="start" className="w-48">
                  <div className="flex flex-col gap-2">
                     <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={placeholder || "Filter..."}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                     />
                     <Button size="sm" className="w-full" onClick={handleApply}>
                        Apply
                     </Button>
                  </div>
               </PopoverContent>
            </Popover>
         )}
      </div>
   );
}
