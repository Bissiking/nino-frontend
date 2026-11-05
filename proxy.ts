import { NextResponse, type NextRequest } from "next/server";

// Reject before React starts streaming; notFound() alone can return HTTP 200.
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "development" && request.nextUrl.pathname.startsWith("/dev/ui")) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/dev/ui/:path*" };
