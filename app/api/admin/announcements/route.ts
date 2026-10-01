import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 🔐 Get logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 👑 Admin client (bypasses RLS)
    const adminSupabase = await createAdminClient()

    // Check admin role
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
    }

    const isAdmin =
      profile?.role === "admin" ||
      user.email === "bestcoin1@gmail.com"

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // 📩 Parse request body
    const body = await request.json()
    const { userId, message } = body

    if (!userId || !message) {
      return NextResponse.json(
        { error: "userId and message are required" },
        { status: 400 }
      )
    }

    // 💾 Insert message
    const { data, error } = await adminSupabase
      .from("announcements") // or change to "user_messages" if needed
      .insert({
        admin_id: user.id,
        user_id: userId,
        message: message,
      })
      .select()
      .single()

    if (error) {
      console.error(
        "Announcement insert error:",
        JSON.stringify(error, null, 2)
      )

      return NextResponse.json(
        {
          error: "Failed to create announcement",
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      announcement: data,
    })
  } catch (error: any) {
    console.error("API crash error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
