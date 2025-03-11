import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateRequest } from './lib/auth';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {

  // Redirect /admin/customer to /admin/customers
  // if (request.nextUrl.pathname === '/admin/customer') {
  //   return NextResponse.redirect(new URL('/admin/customers', request.url));
  // }

  // Protected routes that require authentication
  // if (request.nextUrl.pathname.startsWith('/api/customer')) {
  //   const user = await authenticateRequest(request);
    
  //   if (!user) {
  //     return NextResponse.json(
  //       { error: 'Unauthorized' },
  //       { status: 401 }
  //     );
  //   }
  // }
  console.log("Incoming Request Cookies:", request.cookies);

  const token = await getToken({ req: request });
  console.log("Token:", token);


  return NextResponse.next();
}


export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};

// export const config = {
//   matcher: ['/login', '/admin/customer', '/api/customer/:path*',"/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
// }