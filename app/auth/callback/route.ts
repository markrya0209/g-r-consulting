import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

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
              // setAll can throw in read-only server contexts
            }
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);

    // If a `next` redirect was requested (e.g. from password-reset flow), honour it.
    if (next) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    // Otherwise route by role.
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
        const dashboardUrl =
          userData.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee';
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }

      return NextResponse.redirect(new URL('/role-selection', request.url));
    }
  }

  return NextResponse.redirect(new URL('/signup', request.url));
}
