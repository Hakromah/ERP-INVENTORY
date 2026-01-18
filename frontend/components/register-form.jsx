"use client"

import { Button } from "@/components/ui/button"
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card"
import {
   Field,
   FieldDescription,
   FieldGroup,
   FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import axios from "axios"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function RegisterForm({ className, ...props }) {
   const [formData, setFormData] = useState({ email: "", password: "", firstName: "", lastName: "" });
   const [loading, setLoading] = useState(false);

   const router = useRouter();

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };
   const handleRegister = async (e) => {
      e.preventDefault();
      setLoading(true);

      //Step 1: register with only email, password, and username logic here
      try {
         const registerRes = await axios.post(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local/register`, {
            username: formData.email,
            email: formData.email,
            password: formData.password,
         });

         const jwt = registerRes.data.jwt;
         const userId = registerRes.data.user.id;
         //Step 2: update user profile with first name and last name
         await axios.put(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/${userId}`,
            {
               firstName: formData.firstName,
               lastName: formData.lastName,
            },
            {
               headers: {
                  Authorization: `Bearer ${jwt}`,
               },
            }
         );
         toast.success(`Registered successfully as: ${formData.email}`);
         //Step 3: Optional: Automatically sign in the user after registration
         const res = await signIn("credentials", {
            redirect: false,
            email: formData.email,
            password: formData.password,
         });

         if (res?.error) {
            toast.error("Sign in after registration failed please login manually.");
            router.push("/login");
         } else {
            router.replace("/dashboard");
         }

      } catch (error) {
         toast.error(error.response?.data?.message || "Registration failed. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
         <Card>
            <CardHeader className="text-center">
               <CardTitle className="text-xl">Register</CardTitle>
               <CardDescription>
                  Please enter your details to register your account.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleRegister} className="grid gap-4">
                  <FieldGroup>
                     <Field>
                        <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                        <Input
                           id="firstName"
                           name="firstName"
                           value={formData.firstName}
                           onChange={handleChange}
                           type="text"
                           placeholder="First Name"
                           required />
                     </Field>
                     <Field>
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input
                           id="lastName"
                           name="lastName"
                           value={formData.lastName}
                           onChange={handleChange}
                           type="text"
                           placeholder="Last Name"
                           required />
                     </Field>
                     <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                           id="email"
                           name="email"
                           value={formData.email}
                           onChange={handleChange}
                           type="email"
                           placeholder="m@example.com"
                           required />
                     </Field>
                     <Field>
                        <div className="flex items-center">
                           <FieldLabel htmlFor="password">Password</FieldLabel>
                        </div>
                        <Input
                           id="password"
                           name="password"
                           value={formData.password}
                           onChange={handleChange}
                           type="password"
                           required />
                     </Field>
                     <Field>
                        <Button type="submit" className="w-full" disabled={loading}>
                           {loading ? "Registering..." : "Continue"}
                        </Button>
                        <FieldDescription className="text-center">
                           Already have an account? <a href="/login">Login</a>
                        </FieldDescription>
                     </Field>
                  </FieldGroup>
               </form>
            </CardContent>
         </Card>
         <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
            and <a href="#">Privacy Policy</a>.
         </FieldDescription>
      </div>
   );
}
