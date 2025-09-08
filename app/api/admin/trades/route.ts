import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Admin trades API called")

    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - User:", user?.email, "Error:", authError)

    if (authError || !user || user.email !== "bestcoin1@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: orders, error: ordersError } = await adminSupabase
      .from("orders")
      .select(`
        *,
        profiles(email, uid)
      `)
      .order("created_at", { ascending: false })

    console.log("[v0] Orders fetched:", orders?.length, "Error:", ordersError)

    if (ordersError) {
      console.error("[v0] Orders error details:", ordersError)
      throw new Error(ordersError.message)
    }

    return NextResponse.json({ trades: orders || [] })
  } catch (error) {
    console.error("[v0] Error fetching trades:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trades" },
      { status: 500 },
    )
  }
}
