// file: src/app/api/admin/bank-details/[id]/route.ts
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[BankDetails] Unauthorized:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Check if user is admin (simple check by email OR a role column in profiles table)
    if (user.email !== "bestcoin1@gmail.com") {
      console.error("[BankDetails] Forbidden user:", user.email)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // ✅ Fetch all bank details (since admin is allowed)
    const { data, error } = await supabase
      .from("bank_details")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[BankDetails] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch bank details", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ bankDetails: data ?? [] })
  } catch (err: any) {
    console.error("[BankDetails] Unexpected error:", err.message || err)
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    )
  }
}
