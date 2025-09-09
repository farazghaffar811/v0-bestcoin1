import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userInfo, error } = await supabase.from("user_info").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user info:", error)
      return NextResponse.json({ error: "Failed to fetch user info" }, { status: 500 })
    }

    return NextResponse.json({ userInfo: userInfo || null })
  } catch (error) {
    console.error("Error in user info API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { full_name, phone_number, address, photo_url } = await request.json()

    const { data, error } = await supabase
      .from("user_info")
      .upsert({
        user_id: user.id,
        full_name,
        phone_number,
        address,
        photo_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving user info:", error)
      return NextResponse.json({ error: "Failed to save user info" }, { status: 500 })
    }

    return NextResponse.json({ userInfo: data })
  } catch (error) {
    console.error("Error in user info API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
