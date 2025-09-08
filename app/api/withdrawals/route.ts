import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching withdrawals:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error("Error in withdrawals API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, bank_details } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Check user's available balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("available_balance")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    if (profile.available_balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        amount,
        bank_details,
        status: "pending",
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error("Error creating withdrawal:", withdrawalError)
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 })
    }

    // Deduct amount from user's balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        available_balance: profile.available_balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating balance:", updateError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    return NextResponse.json({ withdrawal })
  } catch (error) {
    console.error("Error in withdrawal creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
