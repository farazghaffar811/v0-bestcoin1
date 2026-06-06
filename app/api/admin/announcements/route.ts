import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

async function createAdminClient() {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single()

    const isAdmin = profile?.role === "admin" || user.email === "bestcoin1@gmail.com"

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, message } = await request.json()

    if (!userId || !message) {
      return NextResponse.json({ error: "User ID and message are required" }, { status: 400 })
    }

    // Create announcement
    const { data: announcement, error } = await adminSupabase
      .from("announcements")
      .insert({
        admin_id: user.id,
        user_id: userId,
        message: message,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating announcement:", error)
      return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 })
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error("Error in admin announcements API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
