import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard", "/bills", "/spending", "/history",
  "/settings", "/scam-check", "/what-if", "/budget-edit", "/plan", "/add-income",
];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // If the auth check itself errored (network issue, Supabase timeout, token
  // refresh race on mobile), do NOT redirect — the error may be transient.
  // Let the request through; client-side data hooks will handle the auth state.
  if (authError) return response;

  if (!user && PROTECTED_ROUTES.some(r => path.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/" || AUTH_ROUTES.some(r => path.startsWith(r)))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};