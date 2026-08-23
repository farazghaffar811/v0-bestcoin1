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

    const { direction, amount, trading_time, entry_price, product_name } = await request.json()

    // Validate input
    if (!direction || !amount || !trading_time || !entry_price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user profile to check balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("available_balance")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if user has sufficient balance
    if (profile.available_balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Calculate profit percentage based on trading time
    const profitPercentages = {
      60: 30.0,
      120: 40.0,
      180: 60.0,
    }

    const profit_percentage = profitPercentages[trading_time as keyof typeof profitPercentages]
    if (!profit_percentage) {
      return NextResponse.json({ error: "Invalid trading time" }, { status: 400 })
    }

    const expected_earnings = (amount * profit_percentage) / 100
    const expires_at = new Date(Date.now() + trading_time * 1000)

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        direction,
        entry_price: Number.parseFloat(entry_price),
        amount: Number.parseFloat(amount),
        trading_time,
        profit_percentage,
        expected_earnings,
        expires_at: expires_at.toISOString(),
        result: "pending",
        product_name: product_name || "BTC/USDT",
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Deduct amount from user balance
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({
        available_balance: profile.available_balance - Number.parseFloat(amount),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (balanceError) {
      console.error("[v0] Balance update error:", balanceError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("[v0] Order creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    // Get user orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("[v0] Orders fetch error:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[v0] Orders fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
