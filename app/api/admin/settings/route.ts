import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Admin settings API called")

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Auth check - User:", user?.email, "Error:", authError?.message)
      return NextResponse.json({ error: "Auth session missing!" }, { status: 401 })
    }

    // Check if user is admin
    if (user.email !== "bestcoin1@gmail.com") {
      console.log("[v0] User not admin:", user.email)
      return NextResponse.json({ error: "User not allowed" }, { status: 403 })
    }

    const adminSupabase = await createAdminClient()

    const { data: settings, error } = await adminSupabase.from("settings").select("*")

    if (error) {
      console.log("[v0] Error fetching settings:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Settings fetched successfully:", settings?.length || 0)
    return NextResponse.json({ settings })
  } catch (error) {
    console.log("[v0] Error in admin settings API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Admin settings update API called")

    const { key, value } = await request.json()

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Auth check - User:", user?.email, "Error:", authError?.message)
      return NextResponse.json({ error: "Auth session missing!" }, { status: 401 })
    }

    // Check if user is admin
    if (user.email !== "bestcoin1@gmail.com") {
      console.log("[v0] User not admin:", user.email)
      return NextResponse.json({ error: "User not allowed" }, { status: 403 })
    }

    console.log("[v0] Update data received:", { key, value })

    const adminSupabase = await createAdminClient()

    const { data, error } = await adminSupabase
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()

    if (error) {
      console.log("[v0] Error updating setting:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Setting updated successfully:", data)
    return NextResponse.json({ success: true, setting: data[0] })
  } catch (error) {
    console.log("[v0] Error in admin settings update API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
