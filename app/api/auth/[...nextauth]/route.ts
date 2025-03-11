// app/api/auth/[...nextauth]/route.js
import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) {
                    throw new Error("Credentials are required");
                }

                const admin = await prisma.admin.findUnique({
                    where: { email: credentials.email },
                });

                if (!admin) {
                    throw new Error("No admin found with this email");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    admin.password
                );

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: admin.id.toString(),
                    email: admin.email,
                    name: admin.name,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }: { session: Session; token: any }) {
            console.log("session", session);
            console.log("token", token);
            if (token) {
                session.user = {
                    id: token.sub || null,
                    email: token.email || null,
                    name: token.name || null,
                };
            }
            return session;
        },
        async jwt({ token, user, account }: { token: any; user?: User; account?: any }) {
            console.log("token", token);
            console.log("user", user);
            console.log("account", account);
            if (account) {
                token.sub = user?.id;
                token.email = user?.email;
                token.name = user?.name;
            }
            return token;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    cookies: {
        sessionToken: {
            name: "next-auth.session-token",
            options: {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 7 * 24 * 60 * 60, // Match session maxAge
            },
        },
    },
    pages: {
        signIn: "/login", // Custom sign-in page
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };