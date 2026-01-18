import { columns } from "./features/columns"
import { DataTable } from "./features/data-table"


const Page = () => {

   const data = [
      {
         id: "728ed52f",
         amount: 100,
         status: "pending",
         email: "m@example.com",
      },
      {
         id: "489e1d42",
         amount: 125,
         status: "processing",
         email: "example@gmail.com",
      },
      // ...
   ]
   return (
      <div className="p-4 md:py-6 px-4 lg:px-6"><DataTable columns={columns} data={data} /></div>
   )
}
export default Page
