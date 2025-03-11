import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateToken, getTokenFromHeader } from '@/lib/auth';

export async function authenticateCustomer(req: NextRequest) {
    try {
        const token = getTokenFromHeader(req);
        
        if (!token) {
            return {
                error: "Authentication required",
                status: 401
            };
        }

        const customer = await validateToken(token);
        
        if (!customer) {
            return {
                error: "Invalid or expired token",
                status: 401
            };
        }

        return {
            customer,
            status: 200
        };
    } catch (error) {
        console.error('Error in authentication:', error);
        return {
            error: "Authentication failed",
            status: 500
        };
    }
}
