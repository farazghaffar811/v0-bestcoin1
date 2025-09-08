import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Admin bank details API called")

    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - User:", user?.email, "Error:", authError)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (user.email !== "bestcoin1@gmail.com") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: bankDetails, error: bankError } = await adminSupabase
      .from("bank_details")
      .select("*")
      .order("created_at", { ascending: false })

    if (bankError) {
      console.error("Error fetching bank details:", bankError)
      return NextResponse.json({ error: "Failed to fetch bank details" }, { status: 500 })
    }

    // Fetch all profiles to get user information
    const { data: profiles, error: profilesError } = await adminSupabase.from("profiles").select("id, email, uid")

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    // Combine bank details with profile information
    const bankDetailsWithProfiles =
      bankDetails?.map((bankDetail) => {
        const profile = profiles?.find((p) => p.id === bankDetail.user_id)
        return {
          ...bankDetail,
          profiles: profile || null,
        }
      }) || []

    console.log("[v0] Bank details with profiles:", bankDetailsWithProfiles?.length)

    return NextResponse.json({ bankDetails: bankDetailsWithProfiles })
  } catch (error) {
    console.error("Error in admin bank details GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
