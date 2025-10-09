import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Admin update API called for user ID:", params.id)

    const supabase = await createClient()
    const adminSupabase = await createAdminClient()
    const { credit_score, available_balance, frozen_balance, withdrawal_prohibited } = await request.json()

    console.log("[v0] Update data received:", {
      credit_score,
      available_balance,
      frozen_balance,
      withdrawal_prohibited,
    })

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - User:", user?.email, "Error:", authError)

    if (authError || !user || user.email !== "bestcoin1@gmail.com") {
      console.log("[v0] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: existingProfile } = await adminSupabase.from("profiles").select("*").eq("id", params.id).single()

    console.log("[v0] Existing profile check:", existingProfile)

    if (!existingProfile) {
      console.log("[v0] Profile doesn't exist, getting user data from auth to create profile")

      // Get user data from auth.users
      const { data: authUser, error: authUserError } = await adminSupabase.auth.admin.getUserById(params.id)

      console.log("[v0] Auth user data:", authUser?.user?.email, "Error:", authUserError)

      if (authUserError || !authUser?.user) {
        console.log("[v0] Failed to get auth user data")
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Create profile for this user
      const newProfile = {
        id: params.id,
        email: authUser.user.email,
        uid: Math.floor(Math.random() * 9000000000) + 1000000000, // Generate random UID
        credit_score,
        available_balance,
        frozen_balance: frozen_balance || 0,
        withdrawal_prohibited: withdrawal_prohibited || false,
        preferred_currency: "SAR",
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Creating new profile:", newProfile)

      const { data: createdProfile, error: createError } = await adminSupabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single()

      console.log("[v0] Profile creation result:", createdProfile, "Error:", createError)

      if (createError) {
        console.log("[v0] Failed to create profile:", createError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      console.log("[v0] Profile created and updated successfully")
      return NextResponse.json({ success: true, profile: createdProfile })
    }

    console.log("[v0] Attempting to update existing profile for user ID:", params.id)

    const updateData = {
      credit_score,
      available_balance,
      frozen_balance: frozen_balance || 0,
      withdrawal_prohibited:
        withdrawal_prohibited !== undefined ? withdrawal_prohibited : existingProfile.withdrawal_prohibited,
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Update data:", updateData)

    const { data: updatedProfile, error: updateError } = await adminSupabase
      .from("profiles")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    console.log("[v0] Update result:", updatedProfile, "Update error:", updateError)

    if (updateError) {
      console.log("[v0] Update failed, error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    console.log("[v0] Profile updated successfully:", updatedProfile)
    console.log("[v0] Admin update completed successfully")
    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
