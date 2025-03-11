// api/v1/working/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: 'Server is working' });
}
