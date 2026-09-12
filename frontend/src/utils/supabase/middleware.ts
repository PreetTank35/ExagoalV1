import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: this call must not be removed. It refreshes the auth token
  // and writes the refreshed cookie onto supabaseResponse above — without
  // it, sessions silently expire even though the cookie is still present.
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isStudentArea = pathname.startsWith("/student/dashboard");
  const isInstituteArea = pathname.startsWith("/institute/dashboard");
  const isOnLogin = pathname === "/login";
  const portal = user?.user_metadata?.portal;

  if ((isStudentArea || isInstituteArea) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isStudentArea && portal === "institute") {
    return NextResponse.redirect(new URL("/institute/dashboard", request.url));
  }

  if (user && isInstituteArea && portal === "student") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
  }

  if (user && isOnLogin) {
    return NextResponse.redirect(
      new URL(portal === "institute" ? "/institute/dashboard" : "/student/dashboard", request.url)
    );
  }

  return supabaseResponse;
};
