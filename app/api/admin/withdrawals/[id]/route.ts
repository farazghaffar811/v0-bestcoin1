import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const { status, admin_notes } = await request.json()
    const withdrawalId = params.id

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await adminSupabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
    }

    // If rejecting, refund the amount to user's balance
    if (status === "rejected" && withdrawal.status === "pending") {
      const { data: profile, error: profileError } = await adminSupabase
        .from("profiles")
        .select("available_balance")
        .eq("id", withdrawal.user_id)
        .single()

      if (!profileError && profile) {
        await adminSupabase
          .from("profiles")
          .update({
            available_balance: profile.available_balance + withdrawal.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.user_id)
      }
    }

    // Update withdrawal status
    const { data: updatedWithdrawal, error: updateError } = await adminSupabase
      .from("withdrawals")
      .update({
        status,
        admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating withdrawal:", updateError)
      return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 })
    }

    return NextResponse.json({ withdrawal: updatedWithdrawal })
  } catch (error) {
    console.error("Error in withdrawal update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
