import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  console.log("Incoming request:", req.method, req.nextUrl.pathname);
  return NextResponse.next(); // Allow request to continue
}

export const config = {
  matcher: "/api/:path*", // Apply middleware to all API routes
};
