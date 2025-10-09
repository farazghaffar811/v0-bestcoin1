import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST() {
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "bestcoin1@gmail.com",
      password: "bestcoinceo1",
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating admin user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      email: "bestcoin1@gmail.com",
      role: "admin",
      credit_score: 1000,
      available_balance: 0.0,
      uid: "ADMIN001",
      preferred_currency: "USD",
    })

    if (profileError) {
      console.error("Error creating admin profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({
      message: "Admin user created successfully",
      user: authData.user,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
