"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle
} from "@/components/ui/card";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconLoader2 } from "@tabler/icons-react";
import axiosInstance from "@/lib/axios";

// --- Schema 1: Profile Update ---
const profileSchema = z.object({
   firstName: z.string().min(1, "First name is required"),
   lastName: z.string().min(1, "Last name is required"),
   username: z.string().min(3, "Username must be at least 3 characters"),
   email: z.string().email("Invalid email address"),
});

// --- Schema 2: Password Reset ---
const passwordSchema = z.object({
   currentPassword: z.string().min(6, "Current password is required"),
   password: z.string().min(6, "New password must be at least 6 characters"),
   passwordConfirmation: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.passwordConfirmation, {
   message: "Passwords do not match",
   path: ["passwordConfirmation"],
});

export default function SettingsPage() {
   const { data: session, update } = useSession();
   const [loadingProfile, setLoadingProfile] = useState(false);
   const [loadingPassword, setLoadingPassword] = useState(false);

   // 1. Profile Form
   const profileForm = useForm({
      resolver: zodResolver(profileSchema),
      defaultValues: {
         firstName: "",
         lastName: "",
         username: "",
         email: "",
      },
   });

   // 2. Password Form
   const passwordForm = useForm({
      resolver: zodResolver(passwordSchema),
      defaultValues: {
         currentPassword: "",
         password: "",
         passwordConfirmation: "",
      },
   });

   // Load session data into profile form
   useEffect(() => {
      if (session?.user) {
         profileForm.reset({
            firstName: session.user.firstName || "",
            lastName: session.user.lastName || "",
            username: session.user.name || "", // 'name' maps to username in your next-auth logic
            email: session.user.email || "",
         });
      }
   }, [session, profileForm]);

   // --- Handler: Update Profile ---
   const onUpdateProfile = async (values) => {
      setLoadingProfile(true);
      try {
         //const jwt = session?.jwt; // We need the JWT from the session

         // Strapi endpoint: PUT /api/users/me
         // await axiosInstance.put(
         //    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`,
         //    {
         //       firstName: values.firstName,
         //       lastName: values.lastName,
         //       username: values.username,
         //       email: values.email,
         //    },
         //    {
         //       headers: {
         //          Authorization: `Bearer ${jwt}`,
         //       },
         //    }
         // );

         const userId = session?.user?.id;

         if (!userId) {
            toast.error("User ID not found. Please refresh the page.");
            setLoadingProfile(false);
            return;
         }

         // Your axiosInstance already handles the Base URL and Authorization header
         await axiosInstance.put(`/api/users/${userId}`, {
            firstName: values.firstName,
            lastName: values.lastName,
            username: values.username,
            email: values.email,
         });

         // 3. Update the NextAuth session client-side
         await update({
            ...session,
            user: {
               ...session.user,
               firstName: values.firstName,
               lastName: values.lastName,
               name: values.username,
               email: values.email,
            },
         });

         toast.success("Profile updated successfully!");
      } catch (error) {
         console.error(error);
      } finally {
         setLoadingProfile(false);
      }
   };

   // --- Handler: Change Password ---
   const onChangePassword = async (values) => {
      setLoadingPassword(true);
      try {
         const jwt = session?.jwt;

         // Strapi endpoint: POST /api/auth/change-password
         await axios.post(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/change-password`,
            {
               currentPassword: values.currentPassword,
               password: values.password,
               passwordConfirmation: values.passwordConfirmation,
            },
            {
               headers: {
                  Authorization: `Bearer ${jwt}`,
               },
            }
         );

         toast.success("Password changed successfully!");
         passwordForm.reset();
      } catch (error) {
         console.error(error);
         const msg = error.response?.data?.error?.message || "Failed to change password.";
         toast.error(msg);
      } finally {
         setLoadingPassword(false);
      }
   };

   if (!session) {
      return <div className="p-8">Loading settings...</div>;
   }

   return (
      <div className="flex flex-col gap-8 p-4 max-w-4xl mx-auto pb-20">
         <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

         {/* --- Profile Section --- */}
         <Card>
            <CardHeader>
               <CardTitle>Profile Information</CardTitle>
               <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
               <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                           control={profileForm.control}
                           name="firstName"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>First Name</FormLabel>
                                 <FormControl>
                                    <Input placeholder="John" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                        <FormField
                           control={profileForm.control}
                           name="lastName"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Last Name</FormLabel>
                                 <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                           control={profileForm.control}
                           name="username"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Username</FormLabel>
                                 <FormControl>
                                    <Input placeholder="johndoe" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                        <FormField
                           control={profileForm.control}
                           name="email"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Email</FormLabel>
                                 <FormControl>
                                    <Input placeholder="john@example.com" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loadingProfile}>
                           {loadingProfile && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Save Profile
                        </Button>
                     </div>
                  </form>
               </Form>
            </CardContent>
         </Card>

         {/* --- Password Section --- */}
         <Card>
            <CardHeader>
               <CardTitle>Security</CardTitle>
               <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
               <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4 max-w-lg">
                     <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                 <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <Separator className="my-2" />

                     <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                 <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <FormField
                        control={passwordForm.control}
                        name="passwordConfirmation"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                 <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <div className="flex justify-end pt-4">
                        <Button type="submit" variant="destructive" disabled={loadingPassword}>
                           {loadingPassword && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Change Password
                        </Button>
                     </div>
                  </form>
               </Form>
            </CardContent>
         </Card>
      </div>
   );
}
