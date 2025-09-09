import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

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
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (!profile || profile.email !== "bestcoin1@gmail.com") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, message } = await request.json()

    const { data, error } = await adminSupabase
      .from("user_messages")
      .insert({
        user_id: userId,
        admin_id: user.id,
        message,
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending message:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error("Error in send message API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
