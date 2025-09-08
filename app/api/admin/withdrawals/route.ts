import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (user.email !== "bestcoin1@gmail.com") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: withdrawals, error: withdrawalsError } = await adminSupabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })

    if (withdrawalsError) {
      console.error("Error fetching withdrawals:", withdrawalsError)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await adminSupabase.from("profiles").select("id, email, uid")

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    // Combine withdrawals with profile data
    const withdrawalsWithProfiles =
      withdrawals?.map((withdrawal) => {
        const profile = profiles?.find((p) => p.id === withdrawal.user_id)
        return {
          ...withdrawal,
          profiles: profile ? { email: profile.email, uid: profile.uid } : null,
        }
      }) || []

    return NextResponse.json({ withdrawals: withdrawalsWithProfiles })
  } catch (error) {
    console.error("Error in admin withdrawals API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
