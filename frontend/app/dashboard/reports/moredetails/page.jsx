import Link from "next/link";

export default function MoreDetails() {
   return (
      <div className="flex flex-col gap-4 p-5">
         <h1 className="text text-2xl font-semibold">More Details Page coming soon...</h1>
         <Link className="text-primary cursor-pointer hover:underline" href="/dashboard">Dashboard</Link>
      </div>
   )
}
