// src/app/api/admin/bank-details/[id]/route.ts
export const dynamic = "force-dynamic"

import { createAdminClient, createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (user.email !== "bestcoin1@gmail.com")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const { data, error } = await supabase
      .from("bank_details")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ bankDetail: data })
  } catch (err: any) {
    console.error("[BankDetails GET Error]:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ✅ Add this PATCH route for editing
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = params
    const body = await req.json()

    // Update the specific record
    const { error } = await supabase
      .from("bank_details")
      .update(body)
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[BankDetails PATCH Error]:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
