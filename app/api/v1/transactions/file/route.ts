import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import fs from "fs";
import path from "path";
import formidable from "formidable";
import { IncomingMessage } from "http";

// Enable parsing of form data
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "File uploaded successfully" }, { status: 200 });

  // const customer = await authenticateRequest(req);
  // if (!customer) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // // Convert NextRequest to a Node.js Readable Stream
  // const body = req.body;
  // const reqStream = new ReadableStream({
  //   start(controller) {
  //     if (body) {
  //       controller.enqueue(body);
  //     }
  //     controller.close();
  //   },
  // });

  // // Convert ReadableStream to a Node.js IncomingMessage-compatible stream
  // const readable = reqStream as unknown as IncomingMessage;

  // const form = formidable({
  //   uploadDir: path.join(process.cwd(), "uploads"), // Ensure this directory exists
  //   keepExtensions: true,
  //   maxFiles: 1,
  //   maxFileSize: 5 * 1024 * 1024, // 5MB limit
  //   filter: (part) => !!part.mimetype?.startsWith("image/")

  // });

  // return new Promise((resolve, reject) => {
  //   form.parse(readable, async (err, fields, files) => {
  //     if (err) {
  //       resolve(NextResponse.json({ error: "File upload error" }, { status: 500 }));
  //       return;
  //     }

  //     try {
  //       const transactionId = fields.transactionId?.[0]; // Adjust based on field structure
  //       const filePath = files.file?.[0]?.filepath; // Ensure file exists

  //       if (!transactionId || !filePath) {
  //         resolve(NextResponse.json({ error: "Missing transactionId or file" }, { status: 400 }));
  //         return;
  //       }

  //       // Save file path to database
  //       await prisma.transactionfile.create({
  //         data: {
  //           transactionId: Number(transactionId),
  //           filePath: filePath,
  //           updatedAt: new Date(),
  //         },
  //       });

  //       resolve(NextResponse.json({ message: "File uploaded successfully" }, { status: 200 }));
  //     } catch (error) {
  //       console.error("Error saving file:", error);
  //       resolve(NextResponse.json({ error: "Server error" }, { status: 500 }));
  //     }
  //   });
  // });
}
