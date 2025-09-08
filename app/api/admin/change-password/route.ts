import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "User ID and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Update user password using admin client
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
