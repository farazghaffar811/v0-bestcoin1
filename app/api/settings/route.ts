import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Public settings API called")

    const adminSupabase = await createAdminClient()

    const { data: settings, error } = await adminSupabase
      .from("settings")
      .select("key, value")
      .eq("key", "telegram_link")
      .single()

    if (error) {
      console.log("[v0] Error fetching telegram link:", error.message)
      // Return default if not found
      return NextResponse.json({ telegram_link: "https://t.me/support" })
    }

    console.log("[v0] Telegram link fetched successfully:", settings.value)
    return NextResponse.json({ telegram_link: settings.value })
  } catch (error) {
    console.log("[v0] Error in public settings API:", error)
    return NextResponse.json({ telegram_link: "https://t.me/support" })
  }
}
