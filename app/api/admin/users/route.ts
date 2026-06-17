import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.email !== "bestcoin1@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminSupabase = await createAdminClient()

    // Get all users from auth.users and join with profiles
    // Fetch with pagination to ensure we get all users
    let allAuthUsers = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      const { data: authUsers, error: authError2 } = await adminSupabase.auth.admin.listUsers({
        page,
        perPage: 100,
      })
      
      if (authError2) {
        console.error(`[Admin] Error fetching auth users page ${page}:`, authError2)
        throw authError2
      }

      if (authUsers?.users) {
        allAuthUsers = allAuthUsers.concat(authUsers.users)
        hasMore = authUsers.users.length === 100
        page++
      } else {
        hasMore = false
      }
    }

    console.log(`[Admin] Fetched ${allAuthUsers.length} total auth users`)

    // Get all profiles using admin client
    const { data: profiles, error: profilesError } = await adminSupabase.from("profiles").select("*")

    if (profilesError) throw profilesError

    console.log(`[Admin] Fetched ${profiles?.length || 0} profiles`)

    // Combine auth users with their profiles
    const users = allAuthUsers.map((authUser) => {
      const profile = profiles?.find((p) => p.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        role: profile?.role || (authUser.email === "bestcoin1@gmail.com" ? "admin" : "user"),
        credit_score: profile?.credit_score || 0,
        available_balance: profile?.available_balance || 0,
        frozen_balance: profile?.frozen_balance || 0,
        uid: profile?.uid || null,
        preferred_currency: profile?.preferred_currency || "USD",
        withdrawal_prohibited: profile?.withdrawal_prohibited || false,
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
