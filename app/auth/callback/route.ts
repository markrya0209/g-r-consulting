import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error when setting cookies
            }
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);

    // Get the user and check their role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role) {
        // User already has a role, redirect to dashboard
        const dashboardUrl =
          userData.role === 'mentor'
            ? '/dashboard/mentor'
            : '/dashboard/mentee';
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      } else {
        // New user, redirect to role selection
        return NextResponse.redirect(new URL('/role-selection', request.url));
      }
    }
  }

  return NextResponse.redirect(new URL('/signup', request.url));
}
