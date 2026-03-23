export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[BankDetails] Unauthorized:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase.from("bank_details").select("*").order("created_at", { ascending: false })

    // If not admin, filter by user_id to show only user's own bank details
    if (user.email !== "bestcoin1@gmail.com") {
      query = query.eq("user_id", user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error("[BankDetails] Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch bank details", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ bankDetails: data ?? [] })
  } catch (err: any) {
    console.error("[BankDetails] Unexpected error:", err.message || err)
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get the logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[BankDetails] Unauthorized:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { binding_type, currency, holder_name, bank_name, account_number, ifsc_code } = body

    // Validate required fields
    if (!binding_type || !currency || !holder_name || !bank_name || !account_number || !ifsc_code) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Insert bank details for the current user
    const { data, error } = await supabase
      .from("bank_details")
      .insert({
        user_id: user.id,
        binding_type,
        currency,
        holder_name,
        bank_name,
        account_number,
        ifsc_code,
      })
      .select()
      .single()

    if (error) {
      console.error("[BankDetails] Insert error:", error)
      return NextResponse.json({ error: "Failed to save bank details", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, bankDetail: data })
  } catch (err: any) {
    console.error("[BankDetails] Unexpected error:", err.message || err)
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 })
  }
}
