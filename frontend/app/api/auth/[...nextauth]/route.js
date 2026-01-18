import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials";


const handler = NextAuth({
   providers: [
      Credentials({
         name: "Strapi",
         credentials: {
            email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
            password: { label: "Password", type: "password" }
         },
         async authorize(credentials) {
            const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  identifier: credentials.email,
                  password: credentials.password
               }),
            })

            const data = await res.json()

            if (!res.ok || !data.jwt)
               throw new Error(data.error?.message || "Failed to authenticate")

            // Return user object to store in session
            return {
               id: data.user.id,
               name: data.user.username,
               email: data.user.email,
               firstName: data.user.firstName,
               lastName: data.user.lastName,
               jwt: data.jwt,
            }
         }
      })
   ],
   callbacks: {
      async jwt({ token, user }) {
         // If user object is available, add JWT to token
         if (user?.jwt) {
            token.jwt = user.jwt
            token.id = user.id
            token.firstName = user.firstName
            token.lastName = user.lastName
         }
         return token
      },
      async session({ session, token }) {
         // Add JWT to session object
         session.user.id = token.id
         session.user.firstName = token.firstName
         session.user.lastName = token.lastName
         session.jwt = token.jwt
         return session
      }
   },

   pages: {
      signIn: "/login" // Custom login page
   },
   secret: process.env.NEXTAUTH_SECRET,
});
export { handler as GET, handler as POST };

