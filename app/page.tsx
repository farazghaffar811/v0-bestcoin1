"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/browser"
import { Home } from "lucide-react"

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

const CryptoIcon = ({ symbol, size = 32 }: { symbol: string; size?: number }) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Cloudinary URLs for specific currencies
  const cloudinaryIcons: { [key: string]: string } = {
    PSG: "https://res.cloudinary.com/dwnt025iw/image/upload/v1757251768/psg_klhcdq.svg",
    JUV: "https://res.cloudinary.com/dwnt025iw/image/upload/v1757251766/juv_adcbwo.svg",
    ATM: "https://res.cloudinary.com/dwnt025iw/image/upload/v1757251766/atm_db7snq.svg",
    LINK: "https://res.cloudinary.com/dwnt025iw/image/upload/v1757251766/link_xkqhpt.svg",
    KSM: "https://res.cloudinary.com/dwnt025iw/image/upload/v1757251766/ksm_nbfxyr.svg",
    EOS: "https://res.cloudinary.com/dwnt025iw/image/upload/v1757251766/eos_ojnk5a.svg",
    BTS: "https://res.cloudinary.com/dwnt025iw/image/upload/v1757251766/bts_hxkgas.svg",
  }

  // CoinGecko mapping for other currencies
  const coinGeckoMapping: { [key: string]: string } = {
    BTC: "bitcoin",
    ETH: "ethereum",
    BNB: "binancecoin",
    XRP: "ripple",
    ADA: "cardano",
    SOL: "solana",
    DOT: "polkadot",
    DOGE: "dogecoin",
    AVAX: "avalanche-2",
    SHIB: "shiba-inu",
    MATIC: "matic-network",
    LTC: "litecoin",
    UNI: "uniswap",
    ATOM: "cosmos",
    FTT: "ftx-token",
    NEAR: "near",
    ALGO: "algorand",
    BCH: "bitcoin-cash",
    VET: "vechain",
    ICP: "internet-computer",
    FIL: "filecoin",
    TRX: "tron",
    ETC: "ethereum-classic",
    XLM: "stellar",
    MANA: "decentraland",
    SAND: "the-sandbox",
    AXS: "axie-infinity",
    THETA: "theta-token",
    AAVE: "aave",
    MKR: "maker",
    COMP: "compound-governance-token",
    YFI: "yearn-finance",
    SNX: "havven",
    CRV: "curve-dao-token",
    SUSHI: "sushi",
    BAL: "balancer",
    REN: "republic-protocol",
    KNC: "kyber-network-crystal",
    ZRX: "0x",
    OMG: "omisego",
    BAT: "basic-attention-token",
    REP: "augur",
    GNT: "golem",
    STORJ: "storj",
    ANT: "aragon",
    DNT: "district0x",
    CVC: "civic",
    MTL: "metal",
    QTUM: "qtum",
    LSK: "lisk",
    WAVES: "waves",
    STRAT: "stratis",
    ARK: "ark",
    KMD: "komodo",
    DCR: "decred",
    PIVX: "pivx",
    VTC: "vertcoin",
    MONA: "monacoin",
    DGB: "digibyte",
    SYS: "syscoin",
    GRS: "groestlcoin",
    PART: "particl",
    NAV: "navcoin",
    BLOCK: "blocknet",
    NXT: "nxt",
    BURST: "burst",
    XEM: "nem",
    MIOTA: "iota",
    XMR: "monero",
    DASH: "dash",
    ZEC: "zcash",
    XTZ: "tezos",
    ONT: "ontology",
    NEO: "neo",
    GAS: "gas",
    QTUM: "qtum",
    ICX: "icon",
    ZIL: "zilliqa",
    SC: "siacoin",
    DENT: "dent",
    HOT: "holo",
    ENJ: "enjincoin",
    NPXS: "pundi-x",
    WAN: "wanchain",
    IOST: "iostoken",
    POLY: "polymath",
    KEY: "selfkey",
    STORM: "storm",
    TNT: "tierion",
    FUEL: "etherparty",
    POWR: "power-ledger",
    REQ: "request-network",
    SUB: "substratum",
    MITH: "mithril",
    OST: "ost",
    NCASH: "nucleus-vision",
    COFI: "coinfi",
    DRGN: "dragonchain",
    GTO: "gifto",
    APPC: "appcoins",
    RLC: "iexec-rlc",
    ELF: "aelf",
    AION: "aion",
    NEBL: "neblio",
    HPB: "high-performance-blockchain",
    BLUZELLE: "bluzelle",
    WABI: "tael",
    LRC: "loopring",
    VIBE: "vibe",
    INS: "insolar",
  }

  const getIconUrl = () => {
    const upperSymbol = symbol?.toUpperCase() || ""

    // First check Cloudinary icons
    if (cloudinaryIcons[upperSymbol]) {
      return cloudinaryIcons[upperSymbol]
    }

    // Then check CoinGecko mapping
    const coinGeckoId = coinGeckoMapping[upperSymbol]
    if (coinGeckoId) {
      return `https://assets.coingecko.com/coins/images/1/large/${coinGeckoId}.png`
    }

    // Fallback to CoinGecko search by symbol
    return `https://assets.coingecko.com/coins/images/1/large/${symbol?.toLowerCase() || "bitcoin"}.png`
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  if (!symbol) {
    return (
      <div className="rounded-full flex items-center justify-center bg-gray-400" style={{ width: size, height: size }}>
        <span className="text-white text-xs font-bold">?</span>
      </div>
    )
  }

  if (imageError) {
    // Fallback colored circle with symbol
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ]
    const colorIndex = (symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1)) % colors.length
    const bgColor = colors[colorIndex]

    return (
      <div className={`rounded-full flex items-center justify-center ${bgColor}`} style={{ width: size, height: size }}>
        <span className="text-white text-xs font-bold">{symbol.slice(0, 2).toUpperCase()}</span>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <img
        src={getIconUrl() || "/placeholder.svg"}
        alt={symbol}
        className="w-full h-full rounded-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ width: size, height: size }}
      />
    </div>
  )
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

  const currencies = [
    { code: "ZAR", name: "South African Rand" },
    { code: "USDT", name: "Tether USD" },
    { code: "USD", name: "US Dollar" },
  ]

  const displayBalance = profile?.frozen_balance > 0 ? profile.frozen_balance : profile?.available_balance || 0
  const balanceLabel = profile?.frozen_balance > 0 ? "Frozen" : "Available Balance"

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
                ≈ {displayBalance.toFixed(4)} {selectedCurrency}
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
              {profile?.frozen_balance > 0 ? "0.0000" : profile?.available_balance?.toFixed(4) || "0.0000"}
            </div>
            <div className="text-xs text-gray-500">Available Balance</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-500 mb-1">
              {profile?.frozen_balance?.toFixed(4) || "0.0000"}
            </div>
            <div className="text-xs text-gray-500">Frozen</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-500 mb-1">
              {((profile?.available_balance || 0) + (profile?.frozen_balance || 0)).toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">Balance</div>
          </div>
        </div>
      </div>

      {/* Bottom padding for navigation */}
      <div className="h-20"></div>
    </div>
  )
}

const SettingsPage = ({ onBack, handleLogout }: { onBack: () => void; handleLogout: () => void }) => {
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

      {/* Settings Menu Items */}
      <div className="px-4 py-6 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span className="text-lg font-medium text-gray-800">Login Password</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span className="text-lg font-medium text-gray-800">Capital Code</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
            </svg>
            <span className="text-lg font-medium text-gray-800">Switch Language</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </div>
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

const MyPage = ({ user, handleLogout }: { user: User | null; handleLogout: () => void }) => {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCollectionInfo, setShowCollectionInfo] = useState(false)
  const [showAddCollection, setShowAddCollection] = useState(false)
  const [showAuthentication, setShowAuthentication] = useState(false)
  const [showUserMessages, setShowUserMessages] = useState(false)
  const [showHelpCenter, setShowHelpCenter] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        console.log("[v0] No user ID available for profile fetch")
        return
      }

      try {
        console.log("[v0] Fetching user profile for ID:", user.id)
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("[v0] Error fetching profile:", error)
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
      // Set up real-time subscription for profile changes
      const subscription = supabase
        .channel("profile-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log("[v0] Profile updated via subscription:", payload)
            setUserProfile(payload.new)
          },
        )
        .subscribe()

      return () => {
        console.log("[v0] Unsubscribing from profile changes")
        subscription.unsubscribe()
      }
    }
  }, [user?.id, supabase])

  const handleAuthenticationClick = () => {
    setShowAuthentication(true)
  }

  const handleUserMessagesClick = () => {
    setShowUserMessages(true)
  }

  const handleHelpCenterClick = () => {
    setShowHelpCenter(true)
  }

  const handleSettingsClick = () => {
    setShowSettings(true)
  }

  const handleCollectionInfoClick = () => {
    setShowCollectionInfo(true)
  }

  const handleBackFromCollection = () => {
    setShowCollectionInfo(false)
    setShowAddCollection(false)
  }

  const handleAddCollectionClick = () => {
    setShowAddCollection(true)
  }

  const handleBackFromSettings = () => {
    setShowSettings(false)
  }

  if (showAuthentication) {
    return <AuthenticationPage onBack={() => setShowAuthentication(false)} user={user} />
  }

  if (showUserMessages) {
    return <UserMessagesPage onBack={() => setShowUserMessages(false)} user={user} />
  }

  if (showHelpCenter) {
    return <HelpCenterPage onBack={() => setShowHelpCenter(false)} />
  }

  if (showSettings) {
    return <SettingsPage onBack={handleBackFromSettings} handleLogout={handleLogout} />
  }

  if (showCollectionInfo) {
    return (
      <CollectionInfoPage
        onBack={handleBackFromCollection}
        onAddCollection={handleAddCollectionClick}
        showAddForm={showAddCollection}
        user={user}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  Frozen Balance: {userProfile.frozen_balance.toFixed(4)} {userProfile?.preferred_currency || "USD"}
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
          { icon: "🛡️", label: "Authentication", action: handleAuthenticationClick },
          { icon: "💬", label: "User Message", action: handleUserMessagesClick },
          { icon: "❓", label: "Help Center", action: handleHelpCenterClick },
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

const AuthenticationPage = ({ onBack, user }: { onBack: () => void; user: User | null }) => {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    photo_url: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/user-info")
        const data = await response.json()
        if (data.userInfo) {
          setUserInfo(data.userInfo)
          setFormData({
            full_name: data.userInfo.full_name || "",
            phone_number: data.userInfo.phone_number || "",
            address: data.userInfo.address || "",
            photo_url: data.userInfo.photo_url || "",
          })
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
      }
    }

    fetchUserInfo()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.userInfo)
        alert("Information saved successfully!")
      } else {
        alert("Failed to save information")
      }
    } catch (error) {
      console.error("Error saving user info:", error)
      alert("Error saving information")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Authentication</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter your address"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo URL</label>
          <input
            type="url"
            value={formData.photo_url}
            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter photo URL"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Information"}
        </button>
      </div>
    </div>
  )
}

const UserMessagesPage = ({ onBack, user }: { onBack: () => void; user: User | null }) => {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/user-messages")
        const data = await response.json()
        if (data.messages) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [])

  const markAsRead = async (messageId: string) => {
    try {
      await fetch("/api/user-messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      })

      setMessages(messages.map((msg) => (msg.id === messageId ? { ...msg, is_read: true } : msg)))
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">User Messages</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">No messages yet</div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-lg p-4 shadow-sm ${!message.is_read ? "border-l-4 border-cyan-500" : ""}`}
              onClick={() => !message.is_read && markAsRead(message.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-500">{new Date(message.created_at).toLocaleDateString()}</span>
                {!message.is_read && <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">New</span>}
              </div>
              <p className="text-gray-800">{message.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const HelpCenterPage = ({ onBack }: { onBack: () => void }) => {
  const helpSections = [
    {
      title: "Getting Started",
      content:
        "Welcome to BestCoin! To get started, please complete your profile authentication and add your bank details for seamless transactions.",
    },
    {
      title: "Trading Guide",
      content:
        "Our platform offers cryptocurrency trading with up/down predictions. Select your preferred crypto, choose the direction, set your amount, and place your trade.",
    },
    {
      title: "Deposits & Withdrawals",
      content:
        "To recharge your account, please contact your teacher. For withdrawals, ensure you have added your bank details in Collection Information.",
    },
    {
      title: "Account Security",
      content:
        "Keep your account secure by using a strong password and never sharing your login credentials. Contact support if you notice any suspicious activity.",
    },
    {
      title: "Customer Support",
      content:
        "Need help? Our support team is available 24/7. Click the customer support icon to connect with us via Telegram for immediate assistance.",
    },
    {
      title: "Trading Tips",
      content:
        "Start with small amounts to understand the platform. Monitor market trends and never invest more than you can afford to lose.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Help Center</h1>
        </div>
      </div>

      {/* Help Content */}
      <div className="p-4 space-y-4">
        {helpSections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
            <p className="text-gray-700 leading-relaxed">{section.content}</p>
          </div>
        ))}

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Still Need Help?</h3>
          <p className="mb-4">Our support team is here to assist you with any questions or concerns.</p>
          <button className="bg-white text-cyan-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

interface CollectionInfoPageProps {
  onBack: () => void
  onAddCollection: () => void
  showAddForm: boolean
  user: User | null
}

const CollectionInfoPage = ({ onBack, onAddCollection, showAddForm, user }: CollectionInfoPageProps) => {
  const [bankDetails, setBankDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    swift_code: "",
  })

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const response = await fetch("/api/bank-details")
        const data = await response.json()
        if (data.bankDetails) {
          setBankDetails(data.bankDetails)
          setFormData({
            bank_name: data.bankDetails.bank_name || "",
            account_name: data.bankDetails.account_name || "",
            account_number: data.bankDetails.account_number || "",
            swift_code: data.bankDetails.swift_code || "",
          })
        }
      } catch (error) {
        console.error("Error fetching bank details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBankDetails()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setBankDetails(data.bankDetails)
        alert("Bank details saved successfully!")
      } else {
        alert("Failed to save bank details")
      }
    } catch (error) {
      console.error("Error saving bank details:", error)
      alert("Error saving bank details")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Collection Information</h1>
        </div>
      </div>

      {/* Bank Details */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading bank details...</div>
          </div>
        ) : showAddForm ? (
          /* Add Bank Details Form */
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter bank name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter account name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Swift Code</label>
              <input
                type="text"
                value={formData.swift_code}
                onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter swift code"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        ) : bankDetails ? (
          /* Display Bank Details */
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500">Bank Details</span>
            </div>
            <p className="text-gray-800">Bank Name: {bankDetails.bank_name}</p>
            <p className="text-gray-800">Account Name: {bankDetails.account_name}</p>
            <p className="text-gray-800">Account Number: {bankDetails.account_number}</p>
            <p className="text-gray-800">Swift Code: {bankDetails.swift_code}</p>
          </div>
        ) : (
          /* No Bank Details */
          <div className="text-center py-8">
            <div className="text-gray-500">No bank details yet</div>
            <button
              onClick={onAddCollection}
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold"
            >
              Add Bank Details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page({ searchParams }: { searchParams?: { page?: string } }) {
  const [user, setUser] = useState<User | null>(null)
  const [activeNav, setActiveNav] = useState<string>("home")
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTCUSDT")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1M")

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleCryptoChange = (crypto: string) => {
    setSelectedCrypto(crypto)
  }

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe)
  }

  const resetAllStates = () => {
    setSelectedCrypto("BTCUSDT")
    setSelectedTimeframe("1M")
  }

  const renderPage = () => {
    const page = searchParams?.page

    if (!user) {
      return (
        <div className="grid h-screen place-items-center">
          <Badge variant="outline">
            <a href="/login">Login</a> to continue
          </Badge>
        </div>
      )
    }

    switch (page) {
      case "order":
        return <OrderPage />
      case "asset":
        return <AssetPage />
      default:
        if (activeNav === "home") {
          return (
            <MarketPage
              selectedCrypto={selectedCrypto}
              selectedTimeframe={selectedTimeframe}
              onCryptoChange={handleCryptoChange}
              onTimeframeChange={handleTimeframeChange}
              resetAllStates={resetAllStates}
              setActiveNav={setActiveNav}
            />
          )
        } else if (activeNav === "asset") {
          return <AssetPage />
        } else if (activeNav === "my") {
          return <MyPage user={user} handleLogout={handleLogout} />
        } else {
          return (
            <MarketPage
              selectedCrypto={selectedCrypto}
              selectedTimeframe={selectedTimeframe}
              onCryptoChange={handleCryptoChange}
              onTimeframeChange={handleTimeframeChange}
              resetAllStates={resetAllStates}
              setActiveNav={setActiveNav}
            />
          )
        }
    }
  }

  return (
    <>
      {renderPage()}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <ul className="flex justify-around p-4">
            <li className="text-center">
              <a
                href="#"
                onClick={() => {
                  setActiveNav("home")
                  router.push("/")
                }}
                className={`block ${activeNav === "home" ? "text-blue-600" : "text-gray-600"}`}
              >
                <Home className="mx-auto h-6 w-6" />
                Home
              </a>
            </li>
            <li className="text-center">
              <a
                href="#"
                onClick={() => {
                  setActiveNav("asset")
                  router.push("/?page=asset")
                }}
                className={`block ${activeNav === "asset" ? "text-blue-600" : "text-gray-600"}`}
              >
                <svg className="mx-auto h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Asset
              </a>
            </li>
            <li className="text-center">
              <a
                href="#"
                onClick={() => {
                  setActiveNav("my")
                  router.push("/?page=my")
                }}
                className={`block ${activeNav === "my" ? "text-blue-600" : "text-gray-600"}`}
              >
                <svg className="mx-auto h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                My
              </a>
            </li>
          </ul>
        </nav>
      )}
    </>
  )
}
