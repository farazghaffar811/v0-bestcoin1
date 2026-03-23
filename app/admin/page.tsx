"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  created_at: string
  role?: string
  credit_score?: number
  available_balance?: number
  uid?: string
  preferred_currency?: string
  frozen_balance?: number
  withdrawal_prohibited?: boolean
}

interface EditUserData {
  credit_score: number
  available_balance: number
  frozen_balance: number
  withdrawal_prohibited: boolean
}

interface Trade {
  id: string
  user_id: string
  crypto_symbol: string
  direction: string
  amount: number
  profit_percentage: number
  trading_time: number
  status: string
  created_at: string
  expires_at: string
  payout?: number
  profiles: {
    email: string
    uid: string
  }
}

interface Setting {
  id: number
  key: string
  value: string
  created_at: string
  updated_at: string
}

interface BankDetail {
  id: string
  user_id: string
  binding_type: string
  currency: string
  account_holder_name: string
  bind_bank: string
  bank_card_number: string
  created_at: string
  updated_at: string
  profiles: {
    email: string
    uid: string
  }
}

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  status: string
  bank_details: any
  created_at: string
  updated_at: string
  admin_notes?: string
  profiles: {
    email: string
    uid: string
  }
}

function AdminDashboardContent() {
  const [users, setUsers] = useState<User[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [telegramLink, setTelegramLink] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("users")
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordUser, setPasswordUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [editData, setEditData] = useState<EditUserData>({
    credit_score: 0,
    available_balance: 0,
    frozen_balance: 0,
    withdrawal_prohibited: false,
  })
  const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null)
  const [editBankData, setEditBankData] = useState({
    binding_type: "",
    currency: "",
    account_holder_name: "",
    bind_bank: "",
    bank_card_number: "",
  })
  const [editingWithdrawal, setEditingWithdrawal] = useState<Withdrawal | null>(null)
  const [withdrawalNotes, setWithdrawalNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdatingTelegram, setIsUpdatingTelegram] = useState(false)
  const [router] = useState(useRouter())
  const supabase = createClient()

  // Search states
  const [searchEmail, setSearchEmail] = useState("")

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedUserForAnnouncement, setSelectedUserForAnnouncement] = useState<any>(null)
  const [announcementMessage, setAnnouncementMessage] = useState("")

  // Filter functions
  const filteredUsers = users.filter((user) => user.email.toLowerCase().includes(searchEmail.toLowerCase()))

  const filteredTrades = trades.filter((trade) =>
    trade.profiles.email.toLowerCase().includes(searchEmail.toLowerCase()),
  )

  const filteredBankDetails = bankDetails.filter((detail) =>
    detail.profiles.email.toLowerCase().includes(searchEmail.toLowerCase()),
  )

  const filteredWithdrawals = withdrawals.filter((withdrawal) =>
    withdrawal.profiles.email.toLowerCase().includes(searchEmail.toLowerCase()),
  )

  const handleSendAnnouncement = (user: any) => {
    setSelectedUserForAnnouncement(user)
    setShowAnnouncementModal(true)
  }

  const handleAnnouncementSubmit = async () => {
    if (!selectedUserForAnnouncement || !announcementMessage.trim()) return

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserForAnnouncement.id,
          message: announcementMessage.trim(),
        }),
      })

      if (response.ok) {
        setShowAnnouncementModal(false)
        setAnnouncementMessage("")
        setSelectedUserForAnnouncement(null)
        alert("Announcement sent successfully!")
      } else {
        alert("Failed to send announcement")
      }
    } catch (error) {
      console.error("Error sending announcement:", error)
      alert("Error sending announcement")
    }
  }

  useEffect(() => {
    checkAdminAccess()
    if (activeTab === "users") {
      fetchUsers()
    } else if (activeTab === "trades") {
      fetchTrades()
    } else if (activeTab === "telegram") {
      fetchSettings()
    } else if (activeTab === "bank-details") {
      fetchBankDetails()
    } else if (activeTab === "withdrawals") {
      fetchWithdrawals()
    }
  }, [activeTab])

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.email !== "bestcoin1@gmail.com") {
      router.push("/login")
      return
    }
  }

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("[v0] Admin fetching withdrawals...")

      const response = await fetch("/api/admin/withdrawals")
      console.log("[v0] Admin withdrawals response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Admin withdrawals error response:", errorText)
        throw new Error(`Failed to fetch withdrawals: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Admin withdrawals data:", data)
      setWithdrawals(data.withdrawals || [])
    } catch (error) {
      console.error("[v0] Admin withdrawals fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch withdrawals")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, status: "approved" | "rejected") => {
    try {
      setIsUpdating(true)

      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          admin_notes: withdrawalNotes,
        }),
      })

      if (!response.ok) throw new Error("Failed to update withdrawal")

      // Update local state
      setWithdrawals(
        withdrawals.map((withdrawal) =>
          withdrawal.id === withdrawalId
            ? { ...withdrawal, status, admin_notes: withdrawalNotes, updated_at: new Date().toISOString() }
            : withdrawal,
        ),
      )

      setEditingWithdrawal(null)
      setWithdrawalNotes("")
      alert(`Withdrawal ${status} successfully!`)
    } catch (error) {
      alert("Failed to update withdrawal: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsUpdating(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTrades = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("[v0] Admin fetching trades...")

      const response = await fetch("/api/admin/trades")
      console.log("[v0] Admin trades response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Admin trades error response:", errorText)
        throw new Error(`Failed to fetch trades: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Admin trades data:", data)
      setTrades(data.trades || [])
    } catch (error) {
      console.error("[v0] Admin trades fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch trades")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/admin/settings")
      if (!response.ok) throw new Error("Failed to fetch settings")

      const data = await response.json()
      setSettings(data.settings || [])

      // Find telegram link setting
      const telegramSetting = data.settings?.find((s: Setting) => s.key === "telegram_link")
      setTelegramLink(telegramSetting?.value || "https://t.me/support")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch settings")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBankDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("[v0] Admin fetching bank details...")

      const response = await fetch("/api/admin/bank-details")
      console.log("[v0] Admin bank details response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Admin bank details error response:", errorText)
        throw new Error(`Failed to fetch bank details: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Admin bank details data:", data)
      setBankDetails(data.bankDetails || [])
    } catch (error) {
      console.error("[v0] Admin bank details fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch bank details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditData({
      credit_score: user.credit_score || 0,
      available_balance: user.available_balance || 0,
      frozen_balance: user.frozen_balance || 0,
      withdrawal_prohibited: Boolean(user.withdrawal_prohibited),
    })
  }

  const handleEditBankDetail = (bankDetail: BankDetail) => {
    setEditingBankDetail(bankDetail)
    setEditBankData({
      binding_type: bankDetail.binding_type,
      currency: bankDetail.currency,
      account_holder_name: bankDetail.account_holder_name,
      bind_bank: bankDetail.bind_bank,
      bank_card_number: bankDetail.bank_card_number,
    })
  }

  const handleEditWithdrawal = (withdrawal: Withdrawal) => {
    setEditingWithdrawal(withdrawal)
    setWithdrawalNotes(withdrawal.admin_notes || "")
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    console.log("[Admin] Updating user with data:", {
      credit_score: editData.credit_score,
      available_balance: editData.available_balance,
      frozen_balance: Math.min(editData.frozen_balance, editData.available_balance || 0),
      withdrawal_prohibited: editData.withdrawal_prohibited,
    })

    try {
      setIsUpdating(true)

      const maxFrozenBalance = editData.available_balance || 0
      const adjustedFrozenBalance = Math.min(editData.frozen_balance, maxFrozenBalance)

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credit_score: editData.credit_score,
          available_balance: editData.available_balance,
          frozen_balance: adjustedFrozenBalance,
          withdrawal_prohibited: editData.withdrawal_prohibited,
        }),
      })

      console.log("[Admin] Update response status:", response.status)
      const responseData = await response.json()
      console.log("[Admin] Update response data:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update user")
      }

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                credit_score: editData.credit_score,
                available_balance: editData.available_balance,
                frozen_balance: adjustedFrozenBalance,
                withdrawal_prohibited: editData.withdrawal_prohibited,
              }
            : user,
        ),
      )

      setEditingUser(null)
      alert("User updated successfully!")

      // Refresh users list to ensure we have the latest data
      await fetchUsers()
    } catch (error) {
      console.error("[Admin] Update error:", error)
      alert("Failed to update user: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateBankDetail = async () => {
    if (!editingBankDetail) return

    try {
      setIsUpdating(true)

      const response = await fetch(`/api/admin/bank-details/${editingBankDetail.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editBankData),
      })

      if (!response.ok) throw new Error("Failed to update bank detail")

      // Update local state
      setBankDetails(
        bankDetails.map((detail) =>
          detail.id === editingBankDetail.id
            ? { ...detail, ...editBankData, updated_at: new Date().toISOString() }
            : detail,
        ),
      )

      setEditingBankDetail(null)
      alert("Bank detail updated successfully!")
    } catch (error) {
      alert("Failed to update bank detail: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsUpdating(false)
    }
  }

  const adjustBalance = (amount: number) => {
    setEditData((prev) => ({
      ...prev,
      available_balance: Math.max(0, prev.available_balance + amount),
    }))
  }

  const updateTelegramLink = async () => {
    try {
      setIsUpdatingTelegram(true)

      // Try both POST and PUT methods to handle both create and update scenarios
      let response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "telegram_link",
          value: telegramLink,
        }),
      })

      // If POST fails, try PUT for updating existing record
      if (!response.ok) {
        response = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "telegram_link",
            value: telegramLink,
          }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update telegram link")
      }

      // Refresh settings to get the updated value
      await fetchSettings()
      alert("Telegram link updated successfully!")
    } catch (error) {
      console.error("Telegram update error:", error)
      alert("Failed to update telegram link: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsUpdatingTelegram(false)
    }
  }

  const handleChangePassword = (user: any) => {
    setPasswordUser(user)
    setNewPassword("")
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async () => {
    if (!passwordUser || !newPassword) return

    setIsChangingPassword(true)
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: passwordUser.id,
          newPassword: newPassword,
        }),
      })

      if (response.ok) {
        alert("Password changed successfully!")
        setShowPasswordModal(false)
        setPasswordUser(null)
        setNewPassword("")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Password change error:", error)
      alert("Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Users Management
            </span>
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "trades"
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Trade History
            </span>
          </button>
          <button
            onClick={() => setActiveTab("bank-details")}
            className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "bank-details"
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
              Bank Details
            </span>
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "withdrawals"
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2z" />
              </svg>
              Withdrawal List
            </span>
          </button>
          <button
            onClick={() => setActiveTab("telegram")}
            className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "telegram"
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Telegram Link
            </span>
          </button>
        </nav>
        <div className="absolute bottom-6 left-6">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "users"
                ? "Users Management"
                : activeTab === "trades"
                  ? "Trade History"
                  : activeTab === "bank-details"
                    ? "Bank Details"
                    : activeTab === "withdrawals"
                      ? "Withdrawal List"
                      : "Telegram Link"}
            </h2>
            <p className="text-gray-600 mt-1">
              {activeTab === "users"
                ? `Total Users: ${filteredUsers.length} ${searchEmail ? `(filtered from ${users.length})` : ""}`
                : activeTab === "trades"
                  ? `Total Trades: ${filteredTrades.length} ${searchEmail ? `(filtered from ${trades.length})` : ""}`
                  : activeTab === "bank-details"
                    ? `Total Bank Details: ${filteredBankDetails.length} ${searchEmail ? `(filtered from ${bankDetails.length})` : ""}`
                    : activeTab === "withdrawals"
                      ? `Total Withdrawals: ${filteredWithdrawals.length} ${searchEmail ? `(filtered from ${withdrawals.length})` : ""}`
                      : "Manage customer support telegram link"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow">
            {activeTab === "telegram" ? (
              <div className="p-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-8">{error}</div>
                ) : (
                  <div className="max-w-md">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Support Link</label>
                      <input
                        type="url"
                        value={telegramLink}
                        onChange={(e) => setTelegramLink(e.target.value)}
                        placeholder="https://t.me/yoursupport"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        This link will be used for the customer support button in the main app
                      </p>
                    </div>
                    <button
                      onClick={updateTelegramLink}
                      disabled={isUpdatingTelegram}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                    >
                      {isUpdatingTelegram ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                {/* Inlined Search Bar - Fixed the focus issue */}
                <div className="mb-4 max-w-md">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Search by email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {activeTab === "withdrawals" ? (
                  /* Withdrawal List table section */
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 text-center py-8">{error}</div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User Info
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bank Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admin Notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredWithdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{withdrawal.profiles.email}</div>
                                  <div className="text-sm text-gray-500">UID: {withdrawal.profiles.uid}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {withdrawal.amount.toFixed(2)} INR
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    withdrawal.status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : withdrawal.status === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {withdrawal.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {withdrawal.bank_details ? (
                                  <div>
                                    <div>{withdrawal.bank_details.bind_bank}</div>
                                    <div className="text-xs text-gray-500">
                                      ****{withdrawal.bank_details.bank_card_number?.slice(-4)}
                                    </div>
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(withdrawal.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {withdrawal.admin_notes || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {withdrawal.status === "pending" && (
                                  <button
                                    onClick={() => handleEditWithdrawal(withdrawal)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors mr-2"
                                  >
                                    Review
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {filteredWithdrawals.length === 0 && !isLoading && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">
                          {searchEmail
                            ? "No withdrawal requests found matching your search"
                            : "No withdrawal requests found"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : activeTab === "bank-details" ? (
                  /* Bank Details table section */
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 text-center py-8">{error}</div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User Info
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Binding Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Account Holder
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Card Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredBankDetails.map((detail) => (
                            <tr key={detail.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{detail.profiles.email}</div>
                                  <div className="text-sm text-gray-500">UID: {detail.profiles.uid}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.binding_type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.currency}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.account_holder_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.bind_bank}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.bank_card_number.slice(0, 4)}****{detail.bank_card_number.slice(-4)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(detail.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEditBankDetail(detail)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {filteredBankDetails.length === 0 && !isLoading && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">
                          {searchEmail ? "No bank details found matching your search" : "No bank details found"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : activeTab === "users" ? (
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 text-center py-8">{error}</div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User Info
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              UID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Credit Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Frozen Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Withdraw Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                  <div className="text-sm text-gray-500">
                                    {user.role === "admin" ? (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        Admin
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        User
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.uid || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.credit_score || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.available_balance?.toFixed(4) || "0.0000"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="text-orange-600 font-medium">
                                  {user.frozen_balance?.toFixed(4) || "0.0000"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.preferred_currency || "USD"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.withdrawal_prohibited
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {user.withdrawal_prohibited ? "Prohibited" : "Allowed"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors mr-2"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleChangePassword(user)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors mr-2"
                                >
                                  Change Password
                                </button>
                                <button
                                  onClick={() => handleSendAnnouncement(user)}
                                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  Send Message
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {filteredUsers.length === 0 && !isLoading && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">
                          {searchEmail ? "No users found matching your search" : "No users found"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 text-center py-8">{error}</div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Crypto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Direction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Profit %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payout
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTrades.map((trade) => (
                            <tr key={trade.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{trade.profiles.email}</div>
                                  <div className="text-sm text-gray-500">UID: {trade.profiles.uid}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.crypto_symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    trade.direction === "up" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {trade.direction.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.amount.toFixed(4)} INR
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.profit_percentage}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.trading_time}s
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    trade.status === "active"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : trade.status === "closed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {trade.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.payout ? `${trade.payout.toFixed(4)} INR` : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(trade.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {filteredTrades.length === 0 && !isLoading && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">
                          {searchEmail ? "No trades found matching your search" : "No trades found"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review Withdrawal: {editingWithdrawal.profiles.email}
            </h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Amount</div>
                <div className="text-lg font-semibold">{editingWithdrawal.amount.toFixed(2)} INR</div>
              </div>

              {editingWithdrawal.bank_details && (
                <div>
                  <div className="text-sm text-gray-600">Bank Details</div>
                  <div className="text-sm">
                    <div>{editingWithdrawal.bank_details.bind_bank}</div>
                    <div>{editingWithdrawal.bank_details.account_holder_name}</div>
                    <div>****{editingWithdrawal.bank_details.bank_card_number?.slice(-4)}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add notes for this withdrawal..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingWithdrawal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdrawalAction(editingWithdrawal.id, "rejected")}
                disabled={isUpdating}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={() => handleWithdrawalAction(editingWithdrawal.id, "approved")}
                disabled={isUpdating}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User: {editingUser.email}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Score</label>
                <input
                  type="number"
                  value={editData.credit_score}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, credit_score: Number.parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Balance (INR)</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="number"
                    value={editData.available_balance}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, available_balance: Number.parseFloat(e.target.value) || 0 }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.0001"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => adjustBalance(-100)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                  >
                    -100
                  </button>
                  <button
                    onClick={() => adjustBalance(-10)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => adjustBalance(10)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => adjustBalance(100)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    +100
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frozen Balance (INR)</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="number"
                    value={editData.frozen_balance}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, frozen_balance: Number.parseFloat(e.target.value) || 0 }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.0001"
                  />
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Frozen balance will be deducted from available balance. User will see: Available = Total - Frozen
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditData((prev) => ({ ...prev, frozen_balance: prev.available_balance }))}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Freeze All
                  </button>
                  <button
                    onClick={() => setEditData((prev) => ({ ...prev, frozen_balance: 0 }))}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Unfreeze
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Prohibited</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="withdrawal_prohibited"
                      checked={!editData.withdrawal_prohibited}
                      onChange={() => setEditData((prev) => ({ ...prev, withdrawal_prohibited: false }))}
                      className="mr-2 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm text-green-600 font-medium">No (Allow Withdrawals)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="withdrawal_prohibited"
                      checked={editData.withdrawal_prohibited}
                      onChange={() => setEditData((prev) => ({ ...prev, withdrawal_prohibited: true }))}
                      className="mr-2 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-600 font-medium">Yes (Prohibit Withdrawals)</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  When set to "Yes", the user will be unable to withdraw funds in the main app
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingBankDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Bank Detail: {editingBankDetail.profiles.email}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Binding Type</label>
                <input
                  type="text"
                  value={editBankData.binding_type}
                  onChange={(e) => setEditBankData((prev) => ({ ...prev, binding_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <input
                  type="text"
                  value={editBankData.currency}
                  onChange={(e) => setEditBankData((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={editBankData.account_holder_name}
                  onChange={(e) => setEditBankData((prev) => ({ ...prev, account_holder_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                <input
                  type="text"
                  value={editBankData.bind_bank}
                  onChange={(e) => setEditBankData((prev) => ({ ...prev, bind_bank: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Card Number</label>
                <input
                  type="text"
                  value={editBankData.bank_card_number}
                  onChange={(e) => setEditBankData((prev) => ({ ...prev, bank_card_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingBankDetail(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBankDetail}
                disabled={isUpdating}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update Bank Detail"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Changing password for: <strong>{passwordUser?.email}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordUser(null)
                  setNewPassword("")
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isChangingPassword}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={!newPassword || newPassword.length < 6 || isChangingPassword}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors"
              >
                {isChangingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Message to {selectedUserForAnnouncement?.email}</h3>
            <textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAnnouncementSubmit}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Send Message
              </button>
              <button
                onClick={() => {
                  setShowAnnouncementModal(false)
                  setAnnouncementMessage("")
                  setSelectedUserForAnnouncement(null)
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main component with Suspense boundary
export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading Admin Dashboard...</p>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  )
}
