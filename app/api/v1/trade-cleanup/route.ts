import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// export { processPendingTrades };

// type ProcessResult = {
//   success: boolean;
//   processed: number;
//   message: string;
// };

// async function processPendingTrades(): Promise<ProcessResult> {
//   try {
//     // Get all pending trades
//     const pendingTrades = await prisma.trade.findMany({
//       where: {
//         tradingStatus: 'PENDING'
//       },
//       include: {
//         account: true
//       }
//     });

//     // Process each pending trade
//     const results = await prisma.$transaction(async (tx) => {
//       const updates = pendingTrades.map(async (trade) => {
//         // Update trade status to FAILED
//         await tx.trade.update({
//           where: { id: trade.id },
//           data: {
//             tradingStatus: 'FAILED',
//             isSuccess: false,
//             updatedAt: new Date()
//           }
//         });

//         // Return trading amount to account balance
//         await tx.account.update({
//           where: { id: trade.accountId },
//           data: {
//             balance: {
//               increment: trade.tradeQuantity
//             }
//           }
//         });
//       });

//       return Promise.all(updates);
//     });

//     return {
//       success: true,
//       processed: pendingTrades.length,
//       message: `Successfully processed ${pendingTrades.length} pending trades`
//     };
//   } catch (error) {
//     console.error('Error processing pending trades:', error);
//     throw error;
//   }
// }


export async function POST(req: NextRequest) {
  try {
    // const result = await processPendingTrades();
    return NextResponse.json("result:ok");
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process pending trades" },
      { status: 500 }
    );
  }
}
