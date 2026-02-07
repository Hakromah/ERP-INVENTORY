import Link from "next/link"

function SettingsPage() {
   return (
      <div className="flex flex-col gap-4">
         <h1 className="text text-2xl font-semibold">Settings Page coming soon...</h1>
         <Link className="text-primary cursor-pointer hover:underline" href="/dashboard">Dashboard</Link>
      </div>

   )
}
export default SettingsPage
