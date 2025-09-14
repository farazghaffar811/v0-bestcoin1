"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/browser"
import { Home, X } from "lucide-react"

interface CryptoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
}

interface TradeData {
  time: string
  direction: "Buy" | "Sell"
  price: number
  quantity: number
}

const CryptoIcon = ({ symbol, className = "w-6 h-6" }: { symbol: string; className?: string }) => {
  const [iconSrc, setIconSrc] = useState<string>("")
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const supabaseUrl = "https://kqzdmamamdcqrklbohua.supabase.co"

    if (supabaseUrl && symbol) {
      const lowerSymbol = symbol.toLowerCase().replace(/\/+$/, "").trim()
      const iconUrl = `${supabaseUrl}/storage/v1/object/public/currencies/${lowerSymbol}.png`

      console.log("Sanitized Symbol:", lowerSymbol)
      console.log("Final Icon URL:", iconUrl)

      setIconSrc(iconUrl)
      setHasError(false)
    }
  }, [symbol])

  const handleError = () => {
    setHasError(true)
  }

  // Only show icon if we have a valid source and no error
  if (!iconSrc || hasError) {
    return null
  }

  return <img src={iconSrc || "/placeholder.svg"} alt={symbol} className={className} onError={handleError} />
}

const getCoinGeckoImageId = (id: string): string => {
  const imageIdMap: { [key: string]: string } = {
    bitcoin: "1",
    ethereum: "279",
    dogecoin: "5",
    chiliz: "8834",
    "psg-fan-token": "13442",
    "atletico-madrid": "13467",
    "juventus-fan-token": "13463",
    kusama: "5034",
    litecoin: "2",
    eos: "738",
    bitshares: "463",
    chainlink: "7080",
    "binance-coin": "825",
    cardano: "975",
    polkadot: "12171",
    solana: "4128",
    avalanche: "12559",
    polygon: "4713",
    "usd-coin": "6319",
    tether: "325",
    ripple: "44",
    "terra-luna": "8284",
    "shiba-inu": "11939",
    "wrapped-bitcoin": "7598",
    dai: "8085",
    cosmos: "5570",
    algorand: "4030",
    fantom: "4001",
    "near-protocol": "10365",
    "internet-computer": "14495",
    vechain: "1074",
    theta: "2416",
    filecoin: "12817",
    tron: "1094",
    stellar: "99",
    monero: "69",
    "ethereum-classic": "453",
    "bitcoin-cash": "1831",
    litecoin: "2",
    dash: "131",
  }

  return imageIdMap[id] || "1" // Default to Bitcoin's image ID if not found
}

interface MarketPageProps {
  selectedCrypto: string
  selectedTimeframe: string
  onCryptoChange: (crypto: string) => void
  onTimeframeChange: (timeframe: string) => void
  resetAllStates: () => void
  setActiveNav: (nav: string) => void
}

const MarketPage = ({
  selectedCrypto,
  selectedTimeframe,
  onCryptoChange,
  onTimeframeChange,
  resetAllStates,
  setActiveNav,
}: MarketPageProps) => {
  const [showTradingModal, setShowTradingModal] = useState(false)
  const [tradingDirection, setTradingDirection] = useState<"buy_up" | "buy_down">("buy_up")
  const [orderAmount, setOrderAmount] = useState("")
  const [selectedTradingTime, setSelectedTradingTime] = useState(60)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const router = useRouter()

  const [currentPrice, setCurrentPrice] = useState(110780.8745)
  const [priceChange, setPriceChange] = useState(-1.28)
  const [marketStats, setMarketStats] = useState({
    high24h: 112553.37,
    low24h: 110780.8745,
    volume24h: 182.69,
    turnover24h: 1.64,
  })
  const [liveTradeData, setLiveTradeData] = useState<TradeData[]>([])
  const [widgetLoaded, setWidgetLoaded] = useState(false)
  const [widgetInstance, setWidgetInstance] = useState<any>(null)

  useEffect(() => {
    const handleNavigateHome = () => {
      router.push("/")
    }

    const handleNavigateToOrder = () => {
      router.push("/?page=order")
    }

    window.addEventListener("navigateHome", handleNavigateHome)
    window.addEventListener("navigateToOrder", handleNavigateToOrder)

    return () => {
      window.removeEventListener("navigateHome", handleNavigateHome)
      window.removeEventListener("navigateToOrder", handleNavigateToOrder)
    }
  }, [router])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

          setUserProfile(profile)
        }
      } catch (error) {
        console.error("[v0] Error fetching user profile:", error)
      }
    }

    fetchUserProfile()
  }, [])

  const handleTradingClick = (direction: "buy_up" | "buy_down") => {
    setTradingDirection(direction)
    setShowTradingModal(true)
  }

  const handleOrderSubmit = async () => {
    if (!orderAmount || Number.parseFloat(orderAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (!userProfile || userProfile.available_balance < Number.parseFloat(orderAmount)) {
      alert("Insufficient balance")
      return
    }

    setIsSubmittingOrder(true)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction: tradingDirection,
          amount: Number.parseFloat(orderAmount),
          trading_time: selectedTradingTime,
          entry_price: currentPrice,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setShowTradingModal(false)
        setOrderAmount("")
        // Navigate to orders page
        window.dispatchEvent(new CustomEvent("navigate-to-orders"))
      } else {
        alert(result.error || "Failed to create order")
      }
    } catch (error) {
      console.error("[v0] Order submission error:", error)
      alert("Failed to create order")
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const calculateExpectedEarnings = () => {
    if (!orderAmount) return 0
    const profitPercentages = { 60: 20, 120: 30, 180: 50 }
    const percentage = profitPercentages[selectedTradingTime as keyof typeof profitPercentages]
    return (Number.parseFloat(orderAmount) * percentage) / 100
  }

  const fetchLiveData = async () => {
    try {
      console.log("[v0] Fetching crypto prices from internal API...")
      const response = await fetch("/api/crypto")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Successfully fetched crypto data:", data)
        const cryptoData = data.find((c: any) => c.id === selectedCrypto)
        if (cryptoData) {
          setCurrentPrice(cryptoData.current_price)
          setPriceChange(cryptoData.price_change_percentage_24h)

          setMarketStats({
            high24h: cryptoData.current_price * 1.05,
            low24h: cryptoData.current_price * 0.95,
            volume24h: Math.random() * 500 + 100,
            turnover24h: Math.random() * 10 + 1,
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching live data:", error)
    }
  }

  const initTradingViewWidget = () => {
    if (typeof window !== "undefined" && (window as any).TradingView) {
      try {
        console.log("[v0] Initializing TradingView widget...")

        // Clear existing widget
        const container = document.getElementById("tradingview-widget")
        if (container) {
          container.innerHTML = ""
        }

        const widget = new (window as any).TradingView.widget({
          autosize: true,
          symbol: getTradingViewSymbol(selectedCrypto),
          interval: selectedTimeframe,
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1e293b",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: "tradingview-widget",
          studies: [],
          show_popup_button: false,
          popup_width: "1000",
          popup_height: "650",
          loading_screen: { backgroundColor: "#1e293b" },
          onChartReady: () => {
            console.log("[v0] TradingView widget loaded successfully")
            setWidgetLoaded(true)
          },
          onError: (error: any) => {
            console.error("[v0] TradingView widget error:", error)
            setWidgetLoaded(true) // Show fallback
          },
        })

        setWidgetInstance(widget)
      } catch (error) {
        console.error("[v0] Error initializing TradingView widget:", error)
        setTimeout(() => {
          setWidgetLoaded(true)
        }, 2000)
      }
    } else {
      console.warn("[v0] TradingView not available, showing fallback")
      setTimeout(() => {
        setWidgetLoaded(true)
      }, 1000)
    }
  }

  const generateTradeData = () => {
    const now = new Date()
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    const newTrade: TradeData = {
      time: timeString,
      direction: Math.random() > 0.5 ? "Buy" : "Sell",
      price: currentPrice + (Math.random() - 0.5) * 100,
      quantity: Math.random() > 0.8 ? 0.0103 : 0.0001,
    }

    setLiveTradeData((prev) => {
      const updated = [newTrade, ...prev].slice(0, 8) // Keep only last 8 trades
      return updated
    })
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]')
    if (existingScript) {
      // Script already loaded, initialize widget
      if ((window as any).TradingView) {
        setTimeout(initTradingViewWidget, 100)
      } else {
        // Wait for script to load
        existingScript.addEventListener("load", () => {
          setTimeout(initTradingViewWidget, 100)
        })
      }
      return
    }

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log("[v0] TradingView script loaded")
      setTimeout(initTradingViewWidget, 100)
    }
    script.onerror = (error) => {
      console.error("[v0] Failed to load TradingView script:", error)
      setWidgetLoaded(true) // Show fallback
    }

    // Add script to head
    document.head.appendChild(script)

    return () => {
      // Cleanup widget instance
      if (widgetInstance && typeof widgetInstance.remove === "function") {
        try {
          widgetInstance.remove()
        } catch (error) {
          console.error("[v0] Error removing widget:", error)
        }
      }
      // Don't remove script as it might be used by other components
    }
  }, [])

  useEffect(() => {
    if (widgetInstance && widgetLoaded) {
      try {
        console.log("[v0] Updating widget symbol and interval...")
        widgetInstance.setSymbol(getTradingViewSymbol(selectedCrypto), selectedTimeframe, () => {
          console.log("[v0] Widget symbol updated successfully")
        })
      } catch (error) {
        console.error("[v0] Error updating widget:", error)
        // Reinitialize widget if update fails
        initTradingViewWidget()
      }
    }
  }, [selectedCrypto, selectedTimeframe, widgetInstance, widgetLoaded])

  useEffect(() => {
    fetchLiveData()
    const interval = setInterval(fetchLiveData, 10000) // 10 seconds
    return () => clearInterval(interval)
  }, [selectedCrypto])

  useEffect(() => {
    // Generate initial trade data
    const initialTrades: TradeData[] = []
    for (let i = 0; i < 8; i++) {
      const now = new Date(Date.now() - i * 5000)
      const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

      initialTrades.push({
        time: timeString,
        direction: Math.random() > 0.5 ? "Buy" : "Sell",
        price: currentPrice + (Math.random() - 0.5) * 100,
        quantity: Math.random() > 0.8 ? 0.0103 : 0.0001,
      })
    }
    setLiveTradeData(initialTrades)

    // Generate new trade data every 2-5 seconds
    const interval = setInterval(
      () => {
        generateTradeData()
      },
      Math.random() * 3000 + 2000,
    )

    return () => clearInterval(interval)
  }, [currentPrice])

  const getTradingViewSymbol = (crypto: string) => {
    const symbolMap: { [key: string]: string } = {
      BTCUSDT: "BINANCE:BTCUSDT",
      ETHUSDT: "BINANCE:ETHUSDT",
      DOGEUSDT: "BINANCE:DOGEUSDT",
      CHZUSDT: "BINANCE:CHZUSDT",
      PSGUSDT: "BINANCE:PSGUSDT",
      ATMUSDT: "BINANCE:ATMUSDT",
      JUVUSDT: "BINANCE:JUVUSDT",
      KSMUSDT: "BINANCE:KSMUSDT",
      LTCUSDT: "BINANCE:LTCUSDT",
      EOSUSDT: "BINANCE:EOSUSDT",
      BTSUSDT: "BINANCE:BTSUSDT",
      LINKUSDT: "BINANCE:LINKUSDT",
    }
    return symbolMap[crypto] || "BINANCE:BTCUSDT"
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800">
        <div className="flex items-center gap-4">
          <svg
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors"
            fill="currentColor"
            viewBox="0 0 24 24"
            onClick={() => {
              resetAllStates()
              setActiveNav("home")
            }}
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <div className="relative">
            <button className="flex items-center gap-2" onClick={() => onCryptoChange(selectedCrypto)}>
              <span className="text-lg font-semibold">{selectedCrypto}</span>
              <svg
                className={`w-4 h-4 transition-transform ${false ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => {
            resetAllStates()
            setActiveNav("order")
          }}
        >
          Spot Orders →
        </div>
      </div>

      {/* Price Section */}
      <div className="px-4 py-4 bg-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className={`text-2xl font-bold ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {currentPrice.toLocaleString("en-US", { minimumFractionDigits: 4 })}
            </div>
            <div className={`text-sm ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {priceChange > 0 ? "+" : ""}
              {priceChange.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">24H High</div>
            <div className="text-white">{marketStats.high24h.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-gray-400">24H Volume</div>
            <div className="text-white">{marketStats.volume24h.toFixed(2)}M</div>
          </div>
          <div>
            <div className="text-gray-400">24H Low</div>
            <div className="text-white">{marketStats.low24h.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-gray-400">24H Turnover</div>
            <div className="text-white">{marketStats.turnover24h.toFixed(2)}K</div>
          </div>
        </div>
      </div>

      {/* Timeframe Tabs */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex gap-6">
          {["1M", "5M", "30M", "1H", "4H", "1D"].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => onTimeframeChange(timeframe)}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                selectedTimeframe === timeframe
                  ? "text-blue-400 border-blue-400"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="h-96 bg-slate-900 rounded relative overflow-hidden">
          <div id="tradingview-widget" className="w-full h-full">
            {!widgetLoaded && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <div className="text-gray-400 text-sm">Loading TradingView Chart...</div>
                  <div className="text-xs text-gray-500 mt-2">Chart by TradingView</div>
                </div>
              </div>
            )}
            {widgetLoaded && !widgetInstance && (
              <div className="flex items-center justify-center h-full bg-slate-900">
                <div className="text-center">
                  <div className="text-gray-400 text-lg mb-2">📈</div>
                  <div className="text-gray-400 text-sm">Chart Unavailable</div>
                  <div className="text-xs text-gray-500 mt-2">TradingView chart could not be loaded</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading Data Table - positioned above fixed buttons */}
      <div className="bg-slate-800 mx-4 mb-4">
        <div className="grid grid-cols-4 gap-2 p-3 text-xs text-gray-400 border-b border-gray-700">
          <div className="text-center">Time</div>
          <div className="text-center">Direction</div>
          <div className="text-center">Price</div>
          <div className="text-center">Quantity</div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {liveTradeData.map((trade, index) => (
            <div
              key={`${trade.time}-${index}`}
              className="grid grid-cols-4 gap-2 p-3 text-xs border-b border-gray-700 last:border-b-0"
            >
              <div className="text-center text-white">{trade.time}</div>
              <div
                className={`text-center font-medium ${trade.direction === "Buy" ? "text-green-400" : "text-red-400"}`}
              >
                {trade.direction}
              </div>
              <div className="text-center text-white">{trade.price.toFixed(4)}</div>
              <div className="text-center text-white">{trade.quantity.toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Buttons - Fixed at bottom like navbar */}
      <div className="fixed bottom-0 left-0 right-0 px-8 py-2 z-50">
        <div className="flex justify-between gap-4">
          <button
            onClick={() => handleTradingClick("buy_up")}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-semibold transition-colors w-44"
          >
            <div className="text-lg">Buy Up</div>
          </button>
          <button
            onClick={() => handleTradingClick("buy_down")}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg font-semibold transition-colors w-44"
          >
            <div className="text-lg">Buy Down</div>
          </button>
        </div>
      </div>

      {showTradingModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTradingModal(false)
            }
          }}
        >
          <div className="bg-slate-900 w-full h-[65%] sm:h-[70%] md:h-[75%] lg:h-[60%] xl:h-[55%] rounded-t-2xl p-4 sm:p-6 animate-slide-up max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="text-gray-400 text-sm mb-1">Product Name</div>
                <div className="text-white font-semibold text-lg">BTC/USDT</div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-gray-400 text-sm mb-1">Direction</div>
                <div
                  className={`font-semibold text-lg ${tradingDirection === "buy_up" ? "text-green-400" : "text-red-400"}`}
                >
                  {tradingDirection === "buy_up" ? "Buy Up" : "Buy Down"}
                </div>
              </div>
            </div>

            {/* Current Price */}
            <div className="mb-3">
              <div className="text-gray-400 text-sm mb-1">Current price</div>
              <div className="text-white text-xl font-bold">{currentPrice}</div>
            </div>

            {/* Trading Time */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-semibold text-sm">Trading Time</span>
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { time: 60, scale: 20 },
                  { time: 120, scale: 30 },
                  { time: 180, scale: 50 },
                ].map(({ time, scale }) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTradingTime(time)}
                    className={`p-2 rounded-lg transition-all ${
                      selectedTradingTime === time
                        ? "bg-blue-600 border-2 border-blue-400"
                        : "bg-slate-700 border-2 border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-gray-400 text-xs mb-1">Time</div>
                      <div className="text-blue-400 font-bold text-lg mb-1">{time}S</div>
                      <div className="text-green-400 text-xs font-semibold">Scale:{scale}.00%</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Balance and Earnings */}
            <div className="flex justify-between items-center mb-3 text-sm">
              <div className="text-white">
                Available Balance:{" "}
                <span className="text-green-400 font-semibold">{userProfile?.available_balance || 0}.0000</span>{" "}
                <span className="text-green-400 bg-green-400 bg-opacity-20 px-1 rounded text-xs">R</span>
              </div>
              <div className="text-white">
                Expected Earnings:{" "}
                <span className="text-blue-400 font-semibold">{calculateExpectedEarnings().toFixed(0)}</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <input
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-800 border-2 border-slate-600 rounded-full px-6 py-3 text-white text-center text-lg font-semibold focus:border-blue-400 focus:outline-none transition-colors"
                min="0"
                step="0.01"
              />
            </div>

            {/* Order Confirmation Button */}
            <button
              onClick={handleOrderSubmit}
              disabled={isSubmittingOrder || !orderAmount || Number.parseFloat(orderAmount) <= 0}
              className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-black py-3 rounded-full font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingOrder ? "Submitting..." : "Order Confirmation"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const OrderPage = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"position" | "closing">("position")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log("[v0] Fetching orders and checking for expired orders...")
        setError(null)

        // First close any expired orders
        const closeResponse = await fetch("/api/orders/close", { method: "POST" })
        if (!closeResponse.ok) {
          throw new Error(`Failed to close orders: ${closeResponse.status}`)
        }
        const closeResult = await closeResponse.json()
        console.log("[v0] Close orders result:", closeResult.message || closeResult)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // Then fetch updated orders with cache busting
        const response = await fetch(`/api/orders?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`)
        }

        const result = await response.json()
        console.log("[v0] Fetched orders:", result)

        if (result.orders) {
          setOrders(result.orders)
          console.log("[v0] Orders set:", result.orders)
        } else {
          setOrders([])
        }
      } catch (error) {
        console.error("[v0] Error fetching orders:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch orders")
        setOrders([])
      }
    }

    fetchOrders()

    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600">Error: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  const positionOrders = orders.filter((order) => order.status === "active")
  const closingOrders = orders.filter((order) => order.status === "closed")

  console.log("[v0] Position orders:", positionOrders)
  console.log("[v0] Closing orders:", closingOrders)

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800 p-4">
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => setActiveTab("position")}
          className={`flex-1 text-center py-3 font-semibold transition-colors ${
            activeTab === "position" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Position Orders ({positionOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("closing")}
          className={`flex-1 text-center py-3 font-semibold transition-colors ${
            activeTab === "closing" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Closing Orders ({closingOrders.length})
        </button>
      </div>

      {activeTab === "position" ? (
        /* Position Orders Section */
        <div>
          {positionOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No active position orders</div>
          ) : (
            <div className="space-y-4">
              {positionOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">{order.product_name || "BTC/USDT"}</div>
                      <div className={`text-sm ${order.direction === "buy_up" ? "text-green-600" : "text-red-600"}`}>
                        {order.direction === "buy_up" ? "Buy Up" : "Buy Down"}
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded text-xs bg-blue-500 text-white">Active</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Entry Price</div>
                      <div className="text-gray-800">{order.entry_price}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Amount</div>
                      <div className="text-gray-800">{order.amount} R</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Trading Time</div>
                      <div className="text-gray-800">{order.trading_time}s</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Expected Earnings</div>
                      <div className="text-green-600">{order.expected_earnings} R</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Created: {new Date(order.created_at).toLocaleString()}
                    {order.expires_at && (
                      <span className="ml-4">Expires: {new Date(order.expires_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Closing Orders Section */
        <div>
          {closingOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No closing orders</div>
          ) : (
            <div className="space-y-4">
              {closingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">{order.product_name || "BTC/USDT"}</div>
                      <div className={`text-sm ${order.direction === "buy_up" ? "text-green-600" : "text-red-600"}`}>
                        {order.direction === "buy_up" ? "Buy Up" : "Buy Down"}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs text-white ${
                        order.result === "win" ? "bg-green-500" : order.result === "loss" ? "bg-red-500" : "bg-gray-500"
                      }`}
                    >
                      {order.result === "win" ? "Won" : order.result === "loss" ? "Lost" : "Closed"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Entry Price</div>
                      <div className="text-gray-800">{order.entry_price}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Amount</div>
                      <div className="text-gray-800">{order.amount} R</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Result</div>
                      <div className={order.result === "win" ? "text-green-600" : "text-red-600"}>
                        {order.result === "win" ? "Win" : "Loss"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Actual Earnings</div>
                      <div className={order.actual_earnings > 0 ? "text-green-600" : "text-red-600"}>
                        {order.actual_earnings || 0} R
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Closed: {order.closed_at ? new Date(order.closed_at).toLocaleString() : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const AssetPage = ({ profile }: { profile: any }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("ZAR")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({
    ZAR: 18.5, // Default ZAR to USD rate
    USDT: 1.0, // USDT to USD rate
    USD: 1.0   // USD to USD rate
  })

  const currencies = [
    { code: "ZAR", name: "South African Rand" },
    { code: "USDT", name: "Tether USD" },
    { code: "USD", name: "US Dollar" },
  ]

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        // Using a free exchange rate API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const data = await response.json()
        
        setExchangeRates({
          ZAR: data.rates.ZAR || 18.5,
          USDT: 1.0,
          USD: 1.0
        })
      } catch (error) {
        console.log('[v0] Error fetching exchange rates:', error)
        // Keep default rates if API fails
      }
    }

    fetchExchangeRates()
    // Update rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const displayBalance = profile?.available_balance
    ? Math.max(0, (profile.available_balance || 0) - (profile.frozen_balance || 0))
    : 0
  const balanceLabel = profile?.frozen_balance > 0 ? "Available (After Frozen)" : "Available Balance"

  const convertedBalance = selectedCurrency === 'USDT' 
    ? displayBalance 
    : displayBalance * exchangeRates[selectedCurrency];

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="px-4 py-12 text-white relative"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fund_header.0e0b665e-TVAYzlPrZkwu8NA0Pts2ihlrbuEcuj.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="text-center mb-6">
          <h1 className="text-lg font-medium">Asset Information</h1>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Total Assets</h2>
          <div className="text-3xl font-bold mb-2">
            {displayBalance.toFixed(4)} <span className="text-lg font-normal">USDT</span>
          </div>
          <div className="relative">
            <div
              className="flex items-center text-sm opacity-90 cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                ≈ {convertedBalance.toFixed(4)} {selectedCurrency}
              </span>
              <svg
                className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[150px] z-10">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedCurrency === currency.code ? "bg-blue-50 text-blue-600" : "text-gray-700"
                    }`}
                    onClick={() => {
                      console.log('[v0] Currency changed to:', currency.code)
                      setSelectedCurrency(currency.code)
                      setIsDropdownOpen(false)
                    }}
                  >
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-xs opacity-75">{currency.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Action Buttons */}
      <div className="bg-white px-4 py-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-8">
          <button className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/download.png-ciWPPrRB8NeoUaANHuk43e755LC2lJ.jpeg"
                alt="Recharge"
                className="w-6 h-6"
              />
            </div>
            <span className="text-sm text-gray-800 font-medium">Recharge</span>
          </button>

          <button className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/download2-Ka6iOeP72HCtxtBiXBCgjrZudjWxwy.png"
                alt="Withdrawal"
                className="w-6 h-6"
              />
            </div>
            <span className="text-sm text-gray-800 font-medium">Withdrawal</span>
          </button>

          <button className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/download1-EJYVBA5WTJyiJdYXYi8MtLmJltzUAn.png"
                alt="Customer Service"
                className="w-6 h-6"
              />
            </div>
            <span className="text-sm text-gray-800 font-medium">Customer Service</span>
          </button>
        </div>
      </div>

      {/* Currency Balance Section */}
      <div className="bg-white mx-4 rounded-lg shadow-sm p-4">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
            R
          </div>
          <span className="font-medium text-gray-900">ZAR</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-500 mb-1">
              {Math.max(0, (profile?.available_balance || 0) - (profile?.frozen_balance || 0)).toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">Available Balance</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-500 mb-1">
              {profile?.frozen_balance?.toFixed(4) || "0.0000"}
            </div>
            <div className="text-xs text-gray-500">Frozen Balance</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-500 mb-1">
              {(profile?.available_balance || 0).toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">Total Balance</div>
          </div>
        </div>
      </div>

      {/* Bottom padding for navigation */}
      <div className="h-20"></div>
    </div>
  )
}\
const SettingsPage = ({ onBack, handleLogout }: { onBack: () => void; handleLogout: () => void }) => {\
  const handleExitLogin = async () => {
    await handleLogout()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
        <button onClick={onBack} className="p-2">
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <div className="w-10"></div>
      </div>

      {/* Exit Login Button */}
      <div className="px-4 mt-8">
        <button
          onClick={handleExitLogin}
          className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-200"
        >
          Exit Login
        </button>
      </div>
    </div>
  )
}
\
const UserMessagePage = ({ onBack, user }: { onBack: () => void; user: User | null }) => {\
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {\
    const fetchAnnouncements = async () => {\
      try {\
        const response = await fetch("/api/announcements")
        if (response.ok) {\
          const data = await response.json()
          setAnnouncements(data.announcements || [])
        }
      } catch (error) {
        console.error("Error fetching announcements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const markAsRead = async (announcementId: string) => {\
    try {\
      await fetch("/api/announcements", {
        method: \"POST",
        headers: { "Content-Type": \"application/json" },
        body: JSON.stringify({ announcementId }),
      })
\
      setAnnouncements((prev) => prev.map((ann) => (ann.id === announcementId ? { ...ann, is_read: true } : ann)))
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
        <button onClick={onBack} className="p-2">
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
        <div className="w-10"></div>
      </div>

      {/* Messages */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="text-center py-8">Loading messages...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No messages yet</div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                  announcement.is_read ? "border-gray-300" : "border-blue-500"
                }`}
                onClick={() => !announcement.is_read && markAsRead(announcement.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-blue-600">Admin Message</span>
                  {!announcement.is_read && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                  )}
                </div>
                <p className="text-gray-800 mb-2">{announcement.message}</p>
                <p className="text-xs text-gray-500">{new Date(announcement.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
\
const MyPage = ({ user, handleLogout }: { user: User | null; handleLogout: () => void }) => {\
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCollectionInfo, setShowCollectionInfo] = useState(false)
  const [showAddCollection, setShowAddCollection] = useState(false)
  const [showUserMessage, setShowUserMessage] = useState(false)
  const supabase = createClient()

  useEffect(() => {\
    const fetchUserProfile = async () => {\
      if (!user?.id) {
        console.log("[v0] No user ID available for profile fetch")\
        return
      }

      try {
        console.log("[v0] Fetching user profile for ID:", user.id)\
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("[v0] Error fetching profile:", error)\
          return
        }

        console.log("[v0] Profile fetched successfully:", profile)
        setUserProfile(profile)
      } catch (error) {
        console.error("[v0] Error fetching user profile:", error)
      }
    }

    fetchUserProfile()
    if (user?.id) {
      console.log("[v0] Setting up real-time subscription for user:", user.id)
      // Set up real-time subscription for profile changes\
      const subscription = supabase
        .channel("profile-changes")
        .on(
          "postgres_changes",
          {
            event: \"UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log("[v0] Profile updated via subscription:", payload)\
            setUserProfile(payload.new)
          },
        )
        .subscribe()

      return () => {
        console.log("[v0] Unsubscribing from profile changes")\
        subscription.unsubscribe()
      }
    }
  }, [user?.id, supabase])

  const handleSettingsClick = () => {
    setShowSettings(true)
  }

  const handleCollectionInfoClick = () => {
    setShowCollectionInfo(true)
  }

  const handleBackFromCollection = () => {
    setShowCollectionInfo(false)\
    setShowAddCollection(false)
  }

  const handleAddCollectionClick = () => {
    setShowAddCollection(true)
  }

  const handleBackFromSettings = () => {
    setShowSettings(false)
  }

  const handleUserMessageClick = () => {
    setShowUserMessage(true)
  }

  const handleBackFromUserMessage = () => {
    setShowUserMessage(false)
  }

  if (showSettings) {\
    return <SettingsPage onBack={handleBackFromSettings} handleLogout={handleLogout} />
  }

  if (showCollectionInfo) {\
    return (
      <CollectionInfoPage
        onBack={handleBackFromCollection}
        onAddCollection={handleAddCollectionClick}
        showAddForm={showAddCollection}
        user={user}
      />
    )
  }

  if (showUserMessage) {\
    return <UserMessagePage onBack={handleBackFromUserMessage} user={user} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with user profile */}
      <div
        className="py-12 px-4 text-white relative"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fund_header.0e0b665e-TVAYzlPrZkwu8NA0Pts2ihlrbuEcuj.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-medium">{user?.email || "Guest User"}</div>
            <div className="text-sm opacity-90">UID: {userProfile?.uid || user?.id?.slice(0, 10) || "N/A"}</div>
            <div className="text-sm font-medium text-yellow-300">Credit Score: {userProfile?.credit_score || 0}</div>
            <div className="text-sm opacity-90">
              {userProfile?.frozen_balance > 0 ? (
                <>
                  Available:{" "}
                  {Math.max(0, (userProfile.available_balance || 0) - (userProfile.frozen_balance || 0)).toFixed(4)}{" "}
                  {userProfile?.preferred_currency || "USD"} | Frozen: {userProfile.frozen_balance.toFixed(4)}{" "}
                  {userProfile?.preferred_currency || "USD"}
                </>
              ) : (
                <>
                  Available Balance: {userProfile?.available_balance?.toFixed(4) || "0.0000"}{" "}
                  {userProfile?.preferred_currency || "USD"}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-2 space-y-1">
        {[
          { icon: "💳", label: "Collection Information", action: handleCollectionInfoClick },
          { icon: "🛡️", label: "Authentication" },
          { icon: "💬", label: "User Message", action: handleUserMessageClick },
          { icon: "❓", label: "Help Center" },
          { icon: "⚙️", label: "Settings", action: handleSettingsClick },
          { icon: "🚪", label: "Logout", action: handleLogout },
        ].map((item, index) => (
          <div
            key={index}
            onClick={item.action}
            className={`bg-white rounded-lg p-4 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${item.action ? "cursor-pointer" : ""}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-lg font-medium text-gray-800">{item.label}</span>
            </div>
            {!item.action && (
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const CollectionInfoPage = ({
  onBack,
  onAddCollection,
  showAddForm,
  user,
}: {
  onBack: () => void\
  onAddCollection: () => void
  showAddForm: boolean
  user: User | null
}) => {\
  const [bankDetails, setBankDetails] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBankDetails()
  }, [])

  const fetchBankDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/bank-details")
      const data = await response.json()

      if (response.ok) {
        setBankDetails(data.bankDetails || [])
      } else {
        console.error("Error fetching bank details:", data.error)
      }
    } catch (error) {
      console.error("Error fetching bank details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSuccess = () => {
    fetchBankDetails()
    onBack()
  }

  if (showAddForm) {
    return <AddCollectionInfoPage onBack={onBack} onSaveSuccess={handleSaveSuccess} user={user} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <button onClick={onBack} className="p-2">
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Collection Information</h1>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : bankDetails.length > 0 ? (
          <div className="space-y-3">
            {bankDetails.map((detail) => (
              <div key={detail.id} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {detail.bind_bank?.charAt(0).toUpperCase() || "B"}
                    </span>
                  </div>
                  <span className="text-gray-800 font-medium">{detail.bind_bank?.toLowerCase() || "Unknown Bank"}</span>
                </div>
                <span className="text-gray-500">
                  {detail.bank_card_number.slice(0, 4)}****{detail.bank_card_number.slice(-4)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No bank details added yet</div>
            <div className="text-sm text-gray-400 mb-6">Add your bank card information for withdrawals</div>
            <button
              onClick={onAddCollection}
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Add Your First Card
            </button>
          </div>
        )}
      </div>

      {/* Add Collection Button - Always visible */}
      <div className="fixed bottom-4 left-4 right-4 z-10">
        <button
          onClick={onAddCollection}
          className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Add Collection Information
        </button>
      </div>
    </div>
  )
}

const AddCollectionInfoPage = ({
  onBack,
  onSaveSuccess,
  user,
}: {
  onBack: () => void
  onSaveSuccess: () => void
  user: User | null
}) => {
  const [formData, setFormData] = useState({
    binding_type: "Bank Card",
    currency: "ZAR",
    account_holder_name: "",
    bind_bank: "",
    bank_card_number: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.account_holder_name || !formData.bind_bank || !formData.bank_card_number) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/bank-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Bank details saved successfully!")
        onSaveSuccess()
      } else {
        alert("Error saving bank details: " + data.error)
      }
    } catch (error) {
      console.error("Error saving bank details:", error)
      alert("Error saving bank details")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <button onClick={onBack} className="p-2">
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Add Collection Information</h1>
        <div className="w-10"></div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6 pb-24">
        {/* Binding Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Binding Type</label>
          <div className="bg-yellow-400 text-black px-4 py-2 rounded-lg inline-block font-medium">Bank Card</div>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span>Currency
          </label>
          <div className="bg-yellow-400 text-black px-4 py-2 rounded-lg inline-block font-medium">ZAR</div>
        </div>

        {/* Account Holder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span>Account Holder Name
          </label>
          <input
            type="text"
            value={formData.account_holder_name}
            onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter account holder name"
          />
        </div>

        {/* Bind Bank */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span>Bind Bank
          </label>
          <input
            type="text"
            value={formData.bind_bank}
            onChange={(e) => setFormData({ ...formData, bind_bank: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter bank name"
          />
        </div>

        {/* Bank Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.bank_card_number}
            onChange={(e) => setFormData({ ...formData, bank_card_number: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter bank card number"
          />
        </div>

        <div className="pt-6">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  )
}

const HomePage = () => {
  const [activeNav, setActiveNav] = useState("home")
  const [selectedCrypto, setSelectedCrypto] = useState("BTCUSDT")
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M")
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showTradingModal, setShowTradingModal] = useState(false)
  const [tradingDirection, setTradingDirection] = useState<"up" | "down">("up")
  const [selectedTradingTime, setSelectedTradingTime] = useState(60)
  const [tradeAmount, setTradeAmount] = useState("")
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [activeOrderTab, setActiveOrderTab] = useState<"position" | "closing">("position")
  const [showSettings, setShowSettings] = useState(false)
  const [telegramLink, setTelegramLink] = useState("https://t.me/support")
  const router = useRouter()
  const supabase = createBrowserClient()

  const [showRechargeMessage, setShowRechargeMessage] = useState(false)
  const [showWithdrawalPage, setShowWithdrawalPage] = useState(false)
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false)
  const [withdrawals, setWithdrawals = useState([])
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false)
  const [bankDetails, setBankDetails] = useState<any[]>([])
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoPrice[]>([])

  useEffect(() => {
    initializeAuth()
    fetchCryptoPrices()
    fetchTelegramLink()
    fetchBankDetails()

    const interval = setInterval(fetchCryptoPrices, 10000)
    return () => clearInterval(interval)
  }, [])

  const initializeAuth = async () => {
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
    } catch (error) {
      console.error("[v0] Auth init error:", error)
    } finally {
      setIsLoading(false)
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
    })
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("[v0] Error fetching profile:", error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching profile:", error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const fetchTelegramLink = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setTelegramLink(data.telegram_link || "https://t.me/support")
      }
    } catch (error) {
      console.log("[v0] Error fetching telegram link:", error)
    }
  }

  const handleCustomerSupportClick = () => {
    window.open(telegramLink, "_blank")
  }

  const resetAllStates = () => {
    setShowRechargeMessage(false)
    setShowWithdrawalPage(false)
    setShowWithdrawalHistory(false)
    setShowTradingModal(false)
    setShowSettings(false)
    setSearchQuery("")
    setFilteredCryptos([])
  }

  const checkAuthAndNavigate = (targetPage: string) => {
    if (!user && targetPage !== "home") {
      router.push("/login")
      return
    }

    resetAllStates()
    setActiveNav(targetPage)
  }

  const handleCryptoSelect = (cryptoId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    resetAllStates()
    setSelectedCrypto(cryptoId)
    setActiveNav("market")
  }

  const handleBackNavigation = () => {
    router.back()
  }

  const fetchCryptoPrices = async () => {
    try {
      console.log("[v0] Fetching crypto prices from internal API...")
      const response = await fetch("/api/crypto")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Successfully fetched crypto data:", data)

      setCryptoPrices(data)
    } catch (error) {
      console.error("[v0] Error fetching crypto prices:", error)
      const fallbackData: CryptoPrice[] = [
        {
          id: "bitcoin",
          symbol: "BTC/USDT",
          name: "Bitcoin",
          current_price: 111123.1906,
          price_change_percentage_24h: 0.26,
        },
        {
          id: "ethereum",
          symbol: "ETH/USDT",
          name: "Ethereum",
          current_price: 4322.3957,
          price_change_percentage_24h: 0.61,
        },
        {
          id: "dogecoin",
          symbol: "DOGE/USDT",
          name: "Dogecoin",
          current_price: 0.216,
          price_change_percentage_24h: 3.15,
        },
        {
          id: "chiliz",
          symbol: "CHZUSDT",
          name: "Chiliz",
          current_price: 0.0393,
          price_change_percentage_24h: 1.32,
        },
        {
          id: "psg-fan-token",
          symbol: "PSGUSDT",
          name: "PSG Fan Token",
          current_price: 1.8153,
          price_change_percentage_24h: 0.69,
        },
        {
          id: "atletico-madrid",
          symbol: "ATMUSDT",
          name: "Atletico Madrid Fan Token",
          current_price: 1.265,
          price_change_percentage_24h: -0.64,
        },
        {
          id: "juventus-fan-token",
          symbol: "JUVUSDT",
          name: "Juventus Fan Token",
          current_price: 1.1484,
          price_change_percentage_24h: 1.58,
        },
        {
          id: "kusama",
          symbol: "KSMUSDT",
          name: "Kusama",
          current_price: 15.3358,
          price_change_percentage_24h: 5.37,
        },
        {
          id: "litecoin",
          symbol: "LTCUSDT",
          name: "Litecoin",
          current_price: 112.7811,
          price_change_percentage_24h: 2.92,
        },
        {
          id: "eos",
          symbol: "EOSUSDT",
          name: "EOS",
          current_price: 0.7262,
          price_change_percentage_24h: -0.93,
        },
        {
          id: "bitshares",
          symbol: "BTSUSDT",
          name: "BitShares",
          current_price: 9.4785,
          price_change_percentage_24h: 1.08,
        },
        {
          id: "chainlink",
          symbol: "LINKUSDT",
          name: "Chainlink",
          current_price: 23.4146,
          price_change_percentage_24h: 2.49,
        },
      ]
      setCryptoPrices(fallbackData)
    }
  }

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes("DOGE") || symbol.includes("CHZ")) {
      return price.toFixed(4)
    }
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? "+" : ""
    return `${sign}${percentage.toFixed(2)}%`
  }

  const handleRechargeClick = () => {
    setShowRechargeMessage(true)
    setTimeout(() => setShowRechargeMessage(false), 3000)
  }

  const handleWithdrawalClick = () => {
    setShowWithdrawalPage(true)
    fetchWithdrawals()
  }

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch("/api/withdrawals")
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error)
    }
  }

  const handleWithdrawalSubmit = async () => {
    if (!withdrawalAmount || Number.parseFloat(withdrawalAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(withdrawalAmount) > (profile?.available_balance || 0)) {
      alert("Insufficient balance")
      return
    }

    setIsSubmittingWithdrawal(true)
    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(withdrawalAmount),
          bank_details: bankDetails[0] || null,
        }),
      })

      if (response.ok) {
        alert("Withdrawal request submitted successfully")
        setWithdrawalAmount("")
        fetchWithdrawals()
        fetchProfile() // Refresh balance
      } else {
        const error = await response.json()
        alert(error.error || "Failed to submit withdrawal request")
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error)
      alert("Failed to submit withdrawal request")
    } finally {
      setIsSubmittingWithdrawal(false)
    }
  }

  const fetchBankDetails = async () => {
    try {
      setIsLoadingBankDetails(true)
      console.log("[v0] Fetching bank details for withdrawal...")
      const response = await fetch("/api/bank-details")
      const data = await response.json()
      console.log("[v0] Bank details API response:", data)

      if (response.ok) {
        setBankDetails(data.bankDetails || [])
        console.log("[v0] Bank details set:", data.bankDetails || [])
      } else {
        console.error("[v0] Error fetching bank details:", data.error)
      }
    } catch (error) {
      console.error("Error fetching bank details:", error)
    } finally {
      setIsLoadingBankDetails(false)
    }
  }

  const renderCurrentPage = () => {
    if (showRechargeMessage) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recharge Information</h3>
              <p className="text-gray-600">To recharge, kindly contact your teacher</p>
            </div>
            <button
              onClick={() => setShowRechargeMessage(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )
    }

    if (showWithdrawalPage) {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowWithdrawalPage(false)}>
                  <Home className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">Withdrawal</h1>
              </div>
              <button
                onClick={() => setShowWithdrawalHistory(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                History
              </button>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="p-4 space-y-6">
            {/* Available Balance */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Available Balance</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.max(0, (profile?.available_balance || 0) - (profile?.frozen_balance || 0)).toFixed(2)}{" "}
                {profile?.preferred_currency || "ZAR"}
              </div>
              {profile?.frozen_balance > 0 && (
                <div className="text-sm text-red-600 mt-1">
                  Frozen: {profile.frozen_balance.toFixed(2)} {profile?.preferred_currency || "ZAR"}
                </div>
              )}
            </div>

            {/* Withdrawal Amount */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Bank Details */}
            {console.log("[v0] Rendering bank details section, bankDetails.length:", bankDetails.length)}
            {bankDetails.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm font-medium text-gray-700 mb-2">Withdrawal Account</div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-medium text-sm">
                      {bankDetails[0]?.bind_bank?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{bankDetails[0]?.bind_bank}</div>
                    <div className="text-sm text-gray-500">****{bankDetails[0]?.bank_card_number?.slice(-4)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleWithdrawalSubmit}
              disabled={isSubmittingWithdrawal || !withdrawalAmount || bankDetails.length === 0}
              className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingWithdrawal ? "Submitting..." : "Submit Withdrawal Request"}
            </button>

            {bankDetails.length === 0 && (
              <div className="text-center text-sm text-gray-500">
                {isLoadingBankDetails
                  ? "Loading bank details..."
                  : "Please add bank details in Collection Information to withdraw"}
                {console.log("[v0] No bank details available, isLoading:", isLoadingBankDetails)}
              </div>
            )}
          </div>

          {/* Withdrawal History Modal */}
          {showWithdrawalHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Withdrawal History</h3>
                  <button onClick={() => setShowWithdrawalHistory(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  {withdrawals.length > 0 ? (
                    <div className="space-y-3">
                      {withdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">
                              {withdrawal.amount} {profile?.preferred_currency || "ZAR"}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                withdrawal.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : withdrawal.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(withdrawal.created_at).toLocaleDateString()}
                          </div>
                          {withdrawal.admin_notes && (
                            <div className="text-sm text-gray-600 mt-1">Note: {withdrawal.admin_notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">No withdrawal history found</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    switch (activeNav) {
      case "order":
        return <OrderPage />
      case "market":
        return (
          <MarketPage
            selectedCrypto={selectedCrypto}
            selectedTimeframe="1M"
            onCryptoChange={(crypto) => setSelectedCrypto(crypto)}
            onTimeframeChange={() => {}}
            resetAllStates={resetAllStates}
            setActiveNav={setActiveNav}
          />
        )
      case "asset":
        return <AssetPage profile={profile} />
      case "my":
        return <MyPage user={user} handleLogout={handleLogout} />
      default:
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Top Price Cards */}
            <div className="bg-white px-4 py-6">
              <div className="grid grid-cols-3 gap-4">
                {cryptoPrices.slice(0, 3).map((crypto) => (
                  <div key={crypto.id} className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">{crypto.symbol}</div>
                    <div className="text-lg font-semibold text-cyan-500 mb-1">
                      {formatPrice(crypto.current_price, crypto.symbol)}
                    </div>
                    <div className="text-sm font-medium text-green-500">
                      {formatPercentage(crypto.price_change_percentage_24h)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {/* Updated recharge and withdrawal buttons with click handlers */}
            <div className="grid grid-cols-3 gap-8">
              <button onClick={handleRechargeClick} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm text-gray-800 font-medium">Recharge</span>
              </button>

              <button onClick={handleWithdrawalClick} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <span className="text-sm text-gray-800 font-medium">Withdrawal</span>
              </button>

              <button onClick={handleCustomerSupportClick} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-800 font-medium">Customer Service</span>
              </button>
            </div>

            {/* Crypto List */}
            <div className="bg-white mt-2">
              {/* Search Input */}
              <div className="relative px-4 py-3">
                <input
                  type="text"
                  placeholder="Search cryptocurrencies"
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value
                    setSearchQuery(query)

                    if (query) {
                      const filtered = cryptoPrices.filter(
                        (crypto) =>
                          crypto.symbol.toLowerCase().includes(query.toLowerCase()) ||
                          crypto.name.toLowerCase().includes(query.toLowerCase()),
                      )
                      setFilteredCryptos(filtered)
                    } else {
                      setFilteredCryptos([])
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* Search Results */}
                {/* Updated search input to handle navigation properly */}
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {filteredCryptos.length > 0 ? (
                      filteredCryptos.map((crypto) => (
                        <button
                          key={crypto.id}
                          onClick={() => {
                            handleCryptoSelect(crypto.symbol.toUpperCase())
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                        >
                          <CryptoIcon symbol={crypto.symbol} size={24} />
                          <div>
                            <div className="font-medium text-gray-900">{crypto.symbol.toUpperCase()}</div>
                            <div className="text-sm text-gray-500">{crypto.name}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">No cryptocurrencies found</div>
                    )}
                  </div>
                )}
              </div>

              {cryptoPrices.map((crypto, index) => (
                <div
                  key={crypto.id}
                  className="flex items-center px-4 py-4 border-b border-gray-100 last:border-b-0 ms-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleCryptoSelect(crypto.id)}
                >
                  <div className="flex items-center gap-3">
                    <CryptoIcon symbol={crypto.symbol.replace("USDT", "")} />
                    <span className="font-medium text-gray-900">{crypto.symbol}</span>
                  </div>

                  <div className="flex-1 text-center">
                    <span
                      className={`font-semibold ${crypto.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {formatPrice(crypto.current_price, crypto.symbol)}
                    </span>
                  </div>

                  <div>
                    <Badge
                      className={`${crypto.price_change_percentage_24h >= 0 ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white px-2 py-1 text-xs font-medium`}
                    >
                      {formatPercentage(crypto.price_change_percentage_24h)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom padding to account for fixed navigation */}
            <div className="h-20"></div>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {renderCurrentPage()}

      {/* Bottom Navigation */}
      {activeNav !== "market" && !showRechargeMessage && !showWithdrawalPage && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="grid grid-cols-5 py-2">
            <button
              onClick={() => checkAuthAndNavigate("home")}
              className={`flex flex-col items-center justify-center ${
                activeNav === "home" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10"
                />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              onClick={() => checkAuthAndNavigate("market")}
              className={`flex flex-col items-center justify-center ${
                activeNav === "market" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11a2 2 0 11-4 0m2 2l4 4a2 2 0 11-2 0m2-2l4-4m-4 4v3a2 2 0 104 0v-3"
                />
              </svg>
              <span className="text-xs font-medium">Market</span>
            </button>

            <button
              onClick={() => checkAuthAndNavigate("order")}
              className={`flex flex-col items-center justify-center ${
                activeNav === "order" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3v1.5M3 21v-6m0 0l2-2m2-2l2-2M3 4.5l2.6-2.6M5.6 4.5l-.9-.9M19.5 4.5l-.7-.7M15 12H9m6 0l-2 2m-2-2l-2-2"
                />
              </svg>
              <span className="text-xs font-medium">Orders</span>
            </button>

            <button
              onClick={() => checkAuthAndNavigate("asset")}
              className={`flex flex-col items-center justify-center ${
                activeNav === "asset" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-medium">Assets</span>
            </button>

            <button
              onClick={() => checkAuthAndNavigate("my")}
              className={`flex flex-col items-center justify-center ${
                activeNav === "my" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 12a18.645 18.645 0 01-3-3m-6-10a8.482 8.482 0 018-8c.587.174 1.141.346 1.668.51M14.44 11L13 14M11 14l1.44-3"
                />
              </svg>
              <span className="text-xs font-medium">My</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
