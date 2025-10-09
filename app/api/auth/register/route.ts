import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword, invitationCode } = await request.json()

    // Validate all fields are present
    if (!email || !password || !confirmPassword || !invitationCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    // Validate invitation code
    if (invitationCode !== "968128") {
      return NextResponse.json({ error: "Invalid invitation code" }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user with admin client (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses email confirmation
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile for the user
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      email: email,
      uid: `UID${Date.now()}`,
      credit_score: 100,
      available_balance: 0,
      preferred_currency: "USDT",
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Don't fail registration if profile creation fails
    }

    return NextResponse.json({ message: "Registration successful", user: authData.user }, { status: 200 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
