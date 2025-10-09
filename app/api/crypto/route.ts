import { NextResponse } from "next/server"

const fallbackData = [
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
    symbol: "CHZ/USDT",
    name: "Chiliz",
    current_price: 0.0393,
    price_change_percentage_24h: 1.32,
  },
  {
    id: "psg-fan-token",
    symbol: "PSG/USDT",
    name: "PSG Fan Token",
    current_price: 1.8153,
    price_change_percentage_24h: 0.69,
  },
  {
    id: "atletico-madrid",
    symbol: "ATM/USDT",
    name: "Atletico Madrid Fan Token",
    current_price: 1.265,
    price_change_percentage_24h: -0.64,
  },
  {
    id: "juventus-fan-token",
    symbol: "JUV/USDT",
    name: "Juventus Fan Token",
    current_price: 1.1484,
    price_change_percentage_24h: 1.58,
  },
  {
    id: "kusama",
    symbol: "KSM/USDT",
    name: "Kusama",
    current_price: 15.3358,
    price_change_percentage_24h: 5.37,
  },
  {
    id: "litecoin",
    symbol: "LTC/USDT",
    name: "Litecoin",
    current_price: 112.7811,
    price_change_percentage_24h: 2.92,
  },
  {
    id: "eos",
    symbol: "EOS/USDT",
    name: "EOS",
    current_price: 0.7262,
    price_change_percentage_24h: -0.93,
  },
  {
    id: "bitshares",
    symbol: "BTS/USDT",
    name: "BitShares",
    current_price: 9.4785,
    price_change_percentage_24h: 1.08,
  },
  {
    id: "chainlink",
    symbol: "LINK/USDT",
    name: "Chainlink",
    current_price: 23.4146,
    price_change_percentage_24h: 2.49,
  },
]

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,chiliz,paris-saint-germain-fan-token,atletico-madrid,juventus-fan-token,kusama,litecoin,eos,bitshares,chainlink&vs_currencies=sar&include_24hr_change=true",
      {
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      },
    )

    if (!response.ok) {
      console.log(`API returned ${response.status}, using fallback data`)
      return NextResponse.json(fallbackData)
    }

    const data = await response.json()

    const formattedData = [
      {
        id: "bitcoin",
        symbol: "BTC/USDT",
        name: "Bitcoin",
        current_price: data.bitcoin?.sar || fallbackData[0].current_price,
        price_change_percentage_24h: data.bitcoin?.sar_24h_change || fallbackData[0].price_change_percentage_24h,
      },
      {
        id: "ethereum",
        symbol: "ETH/USDT",
        name: "Ethereum",
        current_price: data.ethereum?.sar || fallbackData[1].current_price,
        price_change_percentage_24h: data.ethereum?.sar_24h_change || fallbackData[1].price_change_percentage_24h,
      },
      {
        id: "dogecoin",
        symbol: "DOGE/USDT",
        name: "Dogecoin",
        current_price: data.dogecoin?.sar || fallbackData[2].current_price,
        price_change_percentage_24h: data.dogecoin?.sar_24h_change || fallbackData[2].price_change_percentage_24h,
      },
      {
        id: "chiliz",
        symbol: "CHZ/USDT",
        name: "Chiliz",
        current_price: data.chiliz?.sar || fallbackData[3].current_price,
        price_change_percentage_24h: data.chiliz?.sar_24h_change || fallbackData[3].price_change_percentage_24h,
      },
      {
        id: "psg-fan-token",
        symbol: "PSG/USDT",
        name: "PSG Fan Token",
        current_price: data["paris-saint-germain-fan-token"]?.sar || fallbackData[4].current_price,
        price_change_percentage_24h:
          data["paris-saint-germain-fan-token"]?.sar_24h_change || fallbackData[4].price_change_percentage_24h,
      },
      {
        id: "atletico-madrid",
        symbol: "ATM/USDT",
        name: "Atletico Madrid Fan Token",
        current_price: data["atletico-madrid"]?.sar || fallbackData[5].current_price,
        price_change_percentage_24h:
          data["atletico-madrid"]?.sar_24h_change || fallbackData[5].price_change_percentage_24h,
      },
      {
        id: "juventus-fan-token",
        symbol: "JUV/USDT",
        name: "Juventus Fan Token",
        current_price: data["juventus-fan-token"]?.sar || fallbackData[6].current_price,
        price_change_percentage_24h:
          data["juventus-fan-token"]?.sar_24h_change || fallbackData[6].price_change_percentage_24h,
      },
      {
        id: "kusama",
        symbol: "KSM/USDT",
        name: "Kusama",
        current_price: data.kusama?.sar || fallbackData[7].current_price,
        price_change_percentage_24h: data.kusama?.sar_24h_change || fallbackData[7].price_change_percentage_24h,
      },
      {
        id: "litecoin",
        symbol: "LTC/USDT",
        name: "Litecoin",
        current_price: data.litecoin?.sar || fallbackData[8].current_price,
        price_change_percentage_24h: data.litecoin?.sar_24h_change || fallbackData[8].price_change_percentage_24h,
      },
      {
        id: "eos",
        symbol: "EOS/USDT",
        name: "EOS",
        current_price: data.eos?.sar || fallbackData[9].current_price,
        price_change_percentage_24h: data.eos?.sar_24h_change || fallbackData[9].price_change_percentage_24h,
      },
      {
        id: "bitshares",
        symbol: "BTS/USDT",
        name: "BitShares",
        current_price: data.bitshares?.sar || fallbackData[10].current_price,
        price_change_percentage_24h: data.bitshares?.sar_24h_change || fallbackData[10].price_change_percentage_24h,
      },
      {
        id: "chainlink",
        symbol: "LINK/USDT",
        name: "Chainlink",
        current_price: data.chainlink?.sar || fallbackData[11].current_price,
        price_change_percentage_24h: data.chainlink?.sar_24h_change || fallbackData[11].price_change_percentage_24h,
      },
    ]

    return NextResponse.json(formattedData)
  } catch (apiError) {
    console.log("API fetch failed, using fallback data:", apiError)
    return NextResponse.json(fallbackData)
  }
}
