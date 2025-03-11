import { NextRequest, NextResponse } from "next/server";
import { getTokenFromHeader } from "@/lib/auth";
import { invalidateToken } from "@/lib/auth";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    try {
      // Verify the token first
      const decoded = verifyToken(token);
      
      // Get token expiration from the decoded token
      const expiresAt = new Date((decoded as any).exp * 1000);
      
      // Add token to invalid tokens list
      await invalidateToken(token, expiresAt);

      return NextResponse.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in customer logout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
