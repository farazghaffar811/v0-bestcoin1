import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get expired orders that are still active
    const now = new Date().toISOString()
    const { data: expiredOrders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .lt("expires_at", now)

    if (fetchError) {
      console.error("[v0] Error fetching expired orders:", fetchError)
      return NextResponse.json({ error: "Failed to fetch expired orders" }, { status: 500 })
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ message: "No expired orders to close" })
    }

    // Process each expired order
    for (const order of expiredOrders) {
      const isWin = Math.random() < 0.7
      const result = isWin ? "win" : "loss"
      const totalPayout = isWin ? order.amount + (order.amount * order.profit_percentage) / 100 : 0

      console.log(`[v0] Processing order ${order.id}: ${result}, payout: ${totalPayout}`)

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "closed",
          result,
          actual_earnings: isWin ? (order.amount * order.profit_percentage) / 100 : -order.amount,
          close_price: order.entry_price * (1 + (Math.random() - 0.5) * 0.02), // Simulate price movement
          closed_at: now,
        })
        .eq("id", order.id)

      if (updateError) {
        console.error(`[v0] Error updating order ${order.id}:`, updateError)
        continue
      }

      // If win, add total payout to user balance
      if (isWin && totalPayout > 0) {
        const { data: profile } = await supabase.from("profiles").select("available_balance").eq("id", user.id).single()

        if (profile) {
          const newBalance = profile.available_balance + totalPayout
          console.log(`[v0] Updating balance from ${profile.available_balance} to ${newBalance}`)

          const { error: balanceError } = await supabase
            .from("profiles")
            .update({
              available_balance: newBalance,
              updated_at: now,
            })
            .eq("id", user.id)

          if (balanceError) {
            console.error(`[v0] Error updating balance:`, balanceError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      closedOrders: expiredOrders.length,
      message: `Closed ${expiredOrders.length} expired orders`,
    })
  } catch (error) {
    console.error("[v0] Order closing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
