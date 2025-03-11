// export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return new Response('Invalid verification link', { status: 400 });
        }

        // Find and validate token
        const verificationToken = await prisma.verificationtoken.findUnique({
            where: { token }
        });

        if (!verificationToken) {
            return new Response('Invalid or expired verification link', { status: 400 });
        }

        if (verificationToken.expiresAt < new Date()) {
            // Delete expired token
            await prisma.verificationtoken.delete({
                where: { id: verificationToken.id }
            });
            return new Response('Verification link has expired', { status: 400 });
        }

        // Update customer and cleanup in a transaction
        await prisma.$transaction(async (tx) => {
            // Activate customer
            await tx.customer.update({
                where: { email: verificationToken.email },
                data: { isActivated: true }
            });

            // Delete used token
            await tx.verificationtoken.delete({
                where: { id: verificationToken.id }
            });
        });

        // Redirect to success page
        const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/email-verified`;
        return redirect(successUrl);
    } catch (error) {
        console.error("Error verifying email:", error);
        return new Response('An error occurred during verification', { status: 500 });
    }
}
