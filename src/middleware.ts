import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  // Protect the app shell and client portal; leave auth, api/auth, the public
  // marketing/booking-browse and static assets open.
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/customers/:path*",
    "/staff/:path*",
    "/services/:path*",
    "/billing/:path*",
    "/inventory/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/reviews/:path*",
    "/my-bookings/:path*",
  ],
};
