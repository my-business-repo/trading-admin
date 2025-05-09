import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { generateTransactionId } from "@/lib/utils"

import { v2 as cloudinary } from "cloudinary";

import { depositRequestSchema } from "@/zodValidate/validate"
import { authenticateCustomer } from "@/middleware/authMiddleware"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

function generateAccountNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
}
const getCorsHeaders = (origin: string) => {
    const headers = {
        "Access-Control-Allow-Methods": `${process.env.ALLOWED_METHODS}`,
        "Access-Control-Allow-Headers": `${process.env.ALLOWED_HEADERS}`,
        "Access-Control-Allow-Origin": `${process.env.DOMAIN_URL}`,
    };

    if (!process.env.ALLOWED_ORIGIN || !origin) return headers;
    const allowedOrigins = process.env.ALLOWED_ORIGIN.split(",");
    if (allowedOrigins.includes("*")) {
        headers["Access-Control-Allow-Origin"] = "*";
    } else if (allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    return headers;
};


export const OPTIONS = async (request: NextRequest) => {
    // Return Response
    return NextResponse.json(
        {},
        {
            status: 200,
            headers: getCorsHeaders(request.headers.get("origin") || ""),
        }
    );
};

export async function POST(request: NextRequest) {
    try {

        const customer = await authenticateCustomer(request);
        if (!customer) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: getCorsHeaders(request.headers.get("origin") || "") }
            );
        }

        const data = await request.formData()
        const file: File | null = data.get("file") as unknown as File
        // Validate deposit data
        const depositData = depositRequestSchema.parse({
            currency: data.get("currency"),
            amount: data.get("amount"),
            description: data.get("description"),
        })
        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400, headers: getCorsHeaders(request.headers.get("origin") || "") })
        }

        const accounts = await prisma.account.findMany({
            where: {
                customerId: Number(customer.customer?.id)
            },
        });

        if (!accounts) {
            return NextResponse.json(
                { error: "Account not found or access denied" },
                { status: 404, headers: getCorsHeaders(request.headers.get("origin") || "") }
            );
        }

        let account = accounts.find((account) => (account.currency).toLocaleLowerCase() === (depositData.currency).toLocaleLowerCase());
        if (!account) {
            // create account for that curstomer with that currency
            account = await prisma.account.create({
                data: {
                    customerId: Number(customer.customer?.id),
                    currency: depositData.currency,
                    accountNo: generateAccountNumber(),
                    balance: 0,
                    isActive: true,
                    updatedAt: new Date()
                },
            });
        }

        if (!account) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404, headers: getCorsHeaders(request.headers.get("origin") || "") })
        }


        // Convert file to buffer and upload to Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ folder: "deposits" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(buffer);
        });

        if (!uploadResult || typeof uploadResult !== "object" || !("secure_url" in uploadResult)) {
            return NextResponse.json({ error: "Cloud upload failed" }, { status: 500 });
        }

        const fileUrl:any = uploadResult.secure_url; // Get the file URL from Cloudinary

        // check if the path public/uploads exists

        // const uploadsPath = join(process.cwd(), "public/uploads")
        // check if the path public/uploads exists and create it if it doesn't
        // if (!existsSync(uploadsPath)) {
        //     await mkdir(uploadsPath, { recursive: true })
        // }
        // const path = join(process.cwd(), "public/uploads", file.name)
        // await writeFile(path, new Uint8Array(buffer))

        const result = await prisma.$transaction(async (tx) => {
            // Create the transaction record
            const transaction = await tx.transaction.create({
                data: {
                    transactionId: generateTransactionId(),
                    type: "DEPOSIT",
                    amount: depositData.amount,
                    description: depositData.description,
                    status: "PENDING",
                    currency:depositData.currency,
                    accountId: account?.id,
                    updatedAt: new Date(),
                },
            });

            // increment the inreview_balance
            await tx.account.update({
                where: { id: account.id },
                data: { inreview_balance: { increment: depositData.amount } },
            });

            const transactionFile = await tx.transactionfile.create({
                data: {
                    transactionId: transaction.id,
                    filePath: fileUrl,
                    updatedAt: new Date(), // now date
                },
            });
            // update the account balance
            await tx.account.update({
                where: { id: account.id },
                data: { inreview_balance: { increment: depositData.amount } },
            });

            return { transaction, transactionFile };
        });


        return NextResponse.json({
            success: true,
            transaction: result.transaction,
        }, { headers: getCorsHeaders(request.headers.get("origin") || "") })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.errors }, { status: 400, headers: getCorsHeaders(request.headers.get("origin") || "") })
        }
        console.error("Error processing deposit:", error)
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(request.headers.get("origin") || "") })
    }
}

