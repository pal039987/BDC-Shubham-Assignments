/**
 * ══════════════════════════════════════════════════════════════════════════
 * VTRADE – 120 FPS HIGH PERFORMANCE CRYPTO PAPER TRADING ENGINE
 * Fully Functional, Real-time Binance feeds, Coinbase-style Luxury UX
 * ══════════════════════════════════════════════════════════════════════════
 */

// ─── 1. CONSTANTS & METADATA ─────────────────────────────────────────────
const INR_RATE = 83.50; // 1 USD = 83.50 INR

const COINS = [
  {
    "id": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "pair": "BTC/USDT",
    "icon": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    "binanceSym": "BTCUSDT",
    "category": "futures",
    "maxLev": 150,
    "price": 81911.91,
    "change": 0.422,
    "high": 82078,
    "low": 80819.66,
    "vol": "610.0M",
    "tvSymbol": "COINBASE:BTCUSD"
  },
  {
    "id": "ethereum",
    "symbol": "ETH",
    "name": "Ethereum",
    "pair": "ETH/USDT",
    "icon": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    "binanceSym": "ETHUSDT",
    "category": "futures",
    "maxLev": 150,
    "price": 2423.02,
    "change": -0.201,
    "high": 2441.66,
    "low": 2356.79,
    "vol": "322.0M",
    "tvSymbol": "COINBASE:ETHUSD"
  },
  {
    "id": "gold",
    "symbol": "XAU",
    "name": "Gold Spot",
    "pair": "XAU/USD",
    "icon": "gold_spot.svg",
    "binanceSym": "PAXGUSDT",
    "tvSymbol": "OANDA:XAUUSD",
    "category": "futures",
    "maxLev": 100,
    "price": 4166.10,
    "change": -0.13,
    "high": 4175.0,
    "low": 4152.0,
    "vol": "8.5M"
  },
  {
    "id": "solana",
    "symbol": "SOL",
    "name": "Solana",
    "pair": "SOL/USDT",
    "icon": "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    "binanceSym": "SOLUSDT",
    "category": "l1",
    "maxLev": 100,
    "price": 104.3,
    "change": -0.515,
    "high": 105.28,
    "low": 101.25,
    "vol": "110.5M",
    "tvSymbol": "COINBASE:SOLUSD"
  },
  {
    "id": "ripple",
    "symbol": "XRP",
    "name": "XRP",
    "pair": "XRP/USDT",
    "icon": "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
    "binanceSym": "XRPUSDT",
    "category": "l1",
    "maxLev": 100,
    "price": 1.301,
    "change": -0.596,
    "high": 1.3126,
    "low": 1.2701,
    "vol": "57.9M",
    "tvSymbol": "BINANCE:XRPUSDT"
  },
  {
    "id": "binancecoin",
    "symbol": "BNB",
    "name": "BNB",
    "pair": "BNB/USDT",
    "icon": "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    "binanceSym": "BNBUSDT",
    "category": "l1",
    "maxLev": 100,
    "price": 721.57,
    "change": -0.195,
    "high": 723.45,
    "low": 710.15,
    "vol": "50.2M",
    "tvSymbol": "BINANCE:BNBUSDT"
  },
  {
    "id": "dogecoin",
    "symbol": "DOGE",
    "name": "Dogecoin",
    "pair": "DOGE/USDT",
    "icon": "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
    "binanceSym": "DOGEUSDT",
    "category": "meme",
    "maxLev": 75,
    "price": 0.07963,
    "change": -1.179,
    "high": 0.08084,
    "low": 0.07704,
    "vol": "33.4M",
    "tvSymbol": "BINANCE:DOGEUSDT"
  },
  {
    "id": "cardano",
    "symbol": "ADA",
    "name": "Cardano",
    "pair": "ADA/USDT",
    "icon": "https://assets.coingecko.com/coins/images/975/small/cardano.png",
    "binanceSym": "ADAUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.221,
    "change": -1.734,
    "high": 0.2255,
    "low": 0.2142,
    "vol": "12.7M",
    "tvSymbol": "BINANCE:ADAUSDT"
  },
  {
    "id": "avalanche-2",
    "symbol": "AVAX",
    "name": "Avalanche",
    "pair": "AVAX/USDT",
    "icon": "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    "binanceSym": "AVAXUSDT",
    "category": "l1",
    "maxLev": 75,
    "price": 9.835,
    "change": -1.679,
    "high": 10.102,
    "low": 9.562,
    "vol": "16.8M",
    "tvSymbol": "BINANCE:AVAXUSDT"
  },
  {
    "id": "sui",
    "symbol": "SUI",
    "name": "Sui",
    "pair": "SUI/USDT",
    "icon": "https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png",
    "binanceSym": "SUIUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.9891,
    "change": -2.446,
    "high": 1.0197,
    "low": 0.9528,
    "vol": "32.9M",
    "tvSymbol": "BINANCE:SUIUSDT"
  },
  {
    "id": "near",
    "symbol": "NEAR",
    "name": "NEAR Protocol",
    "pair": "NEAR/USDT",
    "icon": "https://assets.coingecko.com/coins/images/10365/small/near.png",
    "binanceSym": "NEARUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 5.016,
    "change": -1.859,
    "high": 5.198,
    "low": 4.764,
    "vol": "93.4M",
    "tvSymbol": "BINANCE:NEARUSDT"
  },
  {
    "id": "aptos",
    "symbol": "APT",
    "name": "Aptos",
    "pair": "APT/USDT",
    "icon": "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png",
    "binanceSym": "APTUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.794,
    "change": -5.824,
    "high": 0.8569,
    "low": 0.7697,
    "vol": "11.7M",
    "tvSymbol": "BINANCE:APTUSDT"
  },
  {
    "id": "polkadot",
    "symbol": "DOT",
    "name": "Polkadot",
    "pair": "DOT/USDT",
    "icon": "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
    "binanceSym": "DOTUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 1.113,
    "change": -6.628,
    "high": 1.208,
    "low": 1.092,
    "vol": "7.7M",
    "tvSymbol": "BINANCE:DOTUSDT"
  },
  {
    "id": "tron",
    "symbol": "TRX",
    "name": "TRON",
    "pair": "TRX/USDT",
    "icon": "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
    "binanceSym": "TRXUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.3335,
    "change": -0.507,
    "high": 0.3372,
    "low": 0.3332,
    "vol": "22.1M",
    "tvSymbol": "BINANCE:TRXUSDT"
  },
  {
    "id": "the-open-network",
    "symbol": "TON",
    "name": "Toncoin",
    "pair": "TON/USDT",
    "icon": "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png",
    "binanceSym": "TONUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 1.6,
    "change": 0.946,
    "high": 1.641,
    "low": 1.58,
    "vol": "7.7M",
    "tvSymbol": "BINANCE:TONUSDT"
  },
  {
    "id": "filecoin",
    "symbol": "FIL",
    "name": "Filecoin",
    "pair": "FIL/USDT",
    "icon": "https://assets.coingecko.com/coins/images/12817/small/filecoin.png",
    "binanceSym": "FILUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 1.0679,
    "change": -8.695,
    "high": 1.2236,
    "low": 1.0369,
    "vol": "20.3M",
    "tvSymbol": "BINANCE:FILUSDT"
  },
  {
    "id": "internet-computer",
    "symbol": "ICP",
    "name": "Internet Computer",
    "pair": "ICP/USDT",
    "icon": "https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png",
    "binanceSym": "ICPUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 2.939,
    "change": -2.971,
    "high": 3.063,
    "low": 2.869,
    "vol": "4.4M",
    "tvSymbol": "BINANCE:ICPUSDT"
  },
  {
    "id": "sei-network",
    "symbol": "SEI",
    "name": "Sei",
    "pair": "SEI/USDT",
    "icon": "https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png",
    "binanceSym": "SEIUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.06282,
    "change": -2.287,
    "high": 0.06478,
    "low": 0.0612,
    "vol": "5.7M",
    "tvSymbol": "BINANCE:SEIUSDT"
  },
  {
    "id": "celestia",
    "symbol": "TIA",
    "name": "Celestia",
    "pair": "TIA/USDT",
    "icon": "https://assets.coingecko.com/coins/images/31967/small/tia.png",
    "binanceSym": "TIAUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.637,
    "change": -13.826,
    "high": 0.769,
    "low": 0.6282,
    "vol": "24.5M",
    "tvSymbol": "BINANCE:TIAUSDT"
  },
  {
    "id": "algorand",
    "symbol": "ALGO",
    "name": "Algorand",
    "pair": "ALGO/USDT",
    "icon": "https://assets.coingecko.com/coins/images/4380/small/download.png",
    "binanceSym": "ALGOUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.1121,
    "change": -2.775,
    "high": 0.1155,
    "low": 0.1093,
    "vol": "1.8M",
    "tvSymbol": "BINANCE:ALGOUSDT"
  },
  {
    "id": "hedera-hashgraph",
    "symbol": "HBAR",
    "name": "Hedera",
    "pair": "HBAR/USDT",
    "icon": "https://assets.coingecko.com/coins/images/3688/small/hbar.png",
    "binanceSym": "HBARUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.08644,
    "change": 2.807,
    "high": 0.08695,
    "low": 0.08209,
    "vol": "10.5M",
    "tvSymbol": "BINANCE:HBARUSDT"
  },
  {
    "id": "cosmos",
    "symbol": "ATOM",
    "name": "Cosmos Hub",
    "pair": "ATOM/USDT",
    "icon": "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
    "binanceSym": "ATOMUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 1.7,
    "change": -3.519,
    "high": 1.763,
    "low": 1.665,
    "vol": "1.1M",
    "tvSymbol": "BINANCE:ATOMUSDT"
  },
  {
    "id": "stellar",
    "symbol": "XLM",
    "name": "Stellar",
    "pair": "XLM/USDT",
    "icon": "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png",
    "binanceSym": "XLMUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.1784,
    "change": -0.779,
    "high": 0.1802,
    "low": 0.1742,
    "vol": "8.4M",
    "tvSymbol": "BINANCE:XLMUSDT"
  },
  {
    "id": "fantom",
    "symbol": "FTM",
    "name": "Fantom",
    "pair": "FTM/USDT",
    "icon": "https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png",
    "binanceSym": "FTMUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.6994,
    "change": -0.766,
    "high": 0.7111,
    "low": 0.69,
    "vol": "1.3M",
    "tvSymbol": "BINANCE:FTMUSDT"
  },
  {
    "id": "vechain",
    "symbol": "VET",
    "name": "VeChain",
    "pair": "VET/USDT",
    "icon": "https://assets.coingecko.com/coins/images/1167/small/VET_Token_Icon.png",
    "binanceSym": "VETUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.006773,
    "change": -2.868,
    "high": 0.007001,
    "low": 0.006585,
    "vol": "0.5M",
    "tvSymbol": "BINANCE:VETUSDT"
  },
  {
    "id": "litecoin",
    "symbol": "LTC",
    "name": "Litecoin",
    "pair": "LTC/USDT",
    "icon": "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
    "binanceSym": "LTCUSDT",
    "category": "spot",
    "maxLev": 50,
    "price": 59.15,
    "change": -1.269,
    "high": 59.93,
    "low": 57.6,
    "vol": "13.0M",
    "tvSymbol": "BINANCE:LTCUSDT"
  },
  {
    "id": "bitcoin-cash",
    "symbol": "BCH",
    "name": "Bitcoin Cash",
    "pair": "BCH/USDT",
    "icon": "https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png",
    "binanceSym": "BCHUSDT",
    "category": "spot",
    "maxLev": 50,
    "price": 277,
    "change": -1.564,
    "high": 281.5,
    "low": 270.5,
    "vol": "5.8M",
    "tvSymbol": "BINANCE:BCHUSDT"
  },
  {
    "id": "ethereum-classic",
    "symbol": "ETC",
    "name": "Ethereum Classic",
    "pair": "ETC/USDT",
    "icon": "https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png",
    "binanceSym": "ETCUSDT",
    "category": "spot",
    "maxLev": 50,
    "price": 7.78,
    "change": -2.506,
    "high": 8,
    "low": 7.63,
    "vol": "1.6M",
    "tvSymbol": "BINANCE:ETCUSDT"
  },
  {
    "id": "uniswap",
    "symbol": "UNI",
    "name": "Uniswap",
    "pair": "UNI/USDT",
    "icon": "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
    "binanceSym": "UNIUSDT",
    "category": "defi",
    "maxLev": 75,
    "price": 7.27,
    "change": -0.588,
    "high": 7.36,
    "low": 6.998,
    "vol": "20.2M",
    "tvSymbol": "BINANCE:UNIUSDT"
  },
  {
    "id": "chainlink",
    "symbol": "LINK",
    "name": "Chainlink",
    "pair": "LINK/USDT",
    "icon": "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
    "binanceSym": "LINKUSDT",
    "category": "defi",
    "maxLev": 75,
    "price": 12.033,
    "change": -2.417,
    "high": 12.36,
    "low": 11.737,
    "vol": "16.6M",
    "tvSymbol": "BINANCE:LINKUSDT"
  },
  {
    "id": "aave",
    "symbol": "AAVE",
    "name": "Aave",
    "pair": "AAVE/USDT",
    "icon": "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
    "binanceSym": "AAVEUSDT",
    "category": "defi",
    "maxLev": 75,
    "price": 153.64,
    "change": -1.696,
    "high": 157.11,
    "low": 149.1,
    "vol": "11.6M",
    "tvSymbol": "BINANCE:AAVEUSDT"
  },
  {
    "id": "maker",
    "symbol": "MKR",
    "name": "Maker",
    "pair": "MKR/USDT",
    "icon": "https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png",
    "binanceSym": "MKRUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 1813.7,
    "change": 0.761,
    "high": 1830,
    "low": 1780.6,
    "vol": "0.4M",
    "tvSymbol": "BINANCE:MKRUSDT"
  },
  {
    "id": "curve-dao-token",
    "symbol": "CRV",
    "name": "Curve DAO",
    "pair": "CRV/USDT",
    "icon": "https://assets.coingecko.com/coins/images/12124/small/Curve.png",
    "binanceSym": "CRVUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.3476,
    "change": 1.017,
    "high": 0.3508,
    "low": 0.3351,
    "vol": "2.0M",
    "tvSymbol": "BINANCE:CRVUSDT"
  },
  {
    "id": "lido-dao",
    "symbol": "LDO",
    "name": "Lido DAO",
    "pair": "LDO/USDT",
    "icon": "https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png",
    "binanceSym": "LDOUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.3906,
    "change": -2.666,
    "high": 0.4062,
    "low": 0.3788,
    "vol": "2.1M",
    "tvSymbol": "BINANCE:LDOUSDT"
  },
  {
    "id": "pendle",
    "symbol": "PENDLE",
    "name": "Pendle",
    "pair": "PENDLE/USDT",
    "icon": "https://assets.coingecko.com/coins/images/15069/small/Pendle_Logo_Normal-03.png",
    "binanceSym": "PENDLEUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 2.062,
    "change": -3.419,
    "high": 2.136,
    "low": 2.005,
    "vol": "2.1M",
    "tvSymbol": "BINANCE:PENDLEUSDT"
  },
  {
    "id": "injective-protocol",
    "symbol": "INJ",
    "name": "Injective",
    "pair": "INJ/USDT",
    "icon": "https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png",
    "binanceSym": "INJUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 8.628,
    "change": -3.371,
    "high": 8.986,
    "low": 8.378,
    "vol": "15.3M",
    "tvSymbol": "BINANCE:INJUSDT"
  },
  {
    "id": "jupiter-exchange-solana",
    "symbol": "JUP",
    "name": "Jupiter",
    "pair": "JUP/USDT",
    "icon": "https://assets.coingecko.com/coins/images/34188/small/jup.png",
    "binanceSym": "JUPUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.2935,
    "change": -3.802,
    "high": 0.3057,
    "low": 0.285,
    "vol": "1.4M",
    "tvSymbol": "BINANCE:JUPUSDT"
  },
  {
    "id": "thorchain",
    "symbol": "RUNE",
    "name": "THORChain",
    "pair": "RUNE/USDT",
    "icon": "https://assets.coingecko.com/coins/images/6595/small/thorchain.png",
    "binanceSym": "RUNEUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.64,
    "change": -0.312,
    "high": 0.644,
    "low": 0.627,
    "vol": "0.9M",
    "tvSymbol": "BINANCE:RUNEUSDT"
  },
  {
    "id": "havven",
    "symbol": "SNX",
    "name": "Synthetix",
    "pair": "SNX/USDT",
    "icon": "https://assets.coingecko.com/coins/images/3406/small/SNX.png",
    "binanceSym": "SNXUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.2156,
    "change": -3.578,
    "high": 0.2241,
    "low": 0.1998,
    "vol": "0.2M",
    "tvSymbol": "BINANCE:SNXUSDT"
  },
  {
    "id": "dydx-chain",
    "symbol": "DYDX",
    "name": "dYdX",
    "pair": "DYDX/USDT",
    "icon": "https://assets.coingecko.com/coins/images/32578/small/dydx.png",
    "binanceSym": "DYDXUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.11791,
    "change": -4.65,
    "high": 0.12439,
    "low": 0.11469,
    "vol": "0.5M",
    "tvSymbol": "BINANCE:DYDXUSDT"
  },
  {
    "id": "arbitrum",
    "symbol": "ARB",
    "name": "Arbitrum",
    "pair": "ARB/USDT",
    "icon": "https://assets.coingecko.com/coins/images/16547/small/arbitrum_logo.png",
    "binanceSym": "ARBUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.1843,
    "change": -3.153,
    "high": 0.1924,
    "low": 0.1768,
    "vol": "7.4M",
    "tvSymbol": "BINANCE:ARBUSDT"
  },
  {
    "id": "optimism",
    "symbol": "OP",
    "name": "Optimism",
    "pair": "OP/USDT",
    "icon": "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
    "binanceSym": "OPUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.1286,
    "change": -7.482,
    "high": 0.1408,
    "low": 0.126,
    "vol": "5.3M",
    "tvSymbol": "BINANCE:OPUSDT"
  },
  {
    "id": "polygon-ecosystem-token",
    "symbol": "POL",
    "name": "Polygon Ecosystem",
    "pair": "POL/USDT",
    "icon": "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
    "binanceSym": "POLUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.0926,
    "change": -1.437,
    "high": 0.09434,
    "low": 0.09115,
    "vol": "2.9M",
    "tvSymbol": "BINANCE:POLUSDT"
  },
  {
    "id": "starknet",
    "symbol": "STRK",
    "name": "Starknet",
    "pair": "STRK/USDT",
    "icon": "https://assets.coingecko.com/coins/images/33139/small/Starknet.png",
    "binanceSym": "STRKUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.06339,
    "change": -11.713,
    "high": 0.07294,
    "low": 0.0631,
    "vol": "19.3M",
    "tvSymbol": "BINANCE:STRKUSDT"
  },
  {
    "id": "shiba-inu",
    "symbol": "SHIB",
    "name": "Shiba Inu",
    "pair": "SHIB/USDT",
    "icon": "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
    "binanceSym": "SHIBUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00000499,
    "change": -1.772,
    "high": 0.0000051,
    "low": 0.00000488,
    "vol": "1.5M",
    "tvSymbol": "BINANCE:SHIBUSDT"
  },
  {
    "id": "pepe",
    "symbol": "PEPE",
    "name": "Pepe",
    "pair": "PEPE/USDT",
    "icon": "https://assets.coingecko.com/coins/images/29850/small/pepe-token.png",
    "binanceSym": "PEPEUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.0000039,
    "change": -3.465,
    "high": 0.00000406,
    "low": 0.00000378,
    "vol": "12.7M",
    "tvSymbol": "BINANCE:PEPEUSDT"
  },
  {
    "id": "dogwifcoin",
    "symbol": "WIF",
    "name": "dogwifhat",
    "pair": "WIF/USDT",
    "icon": "https://assets.coingecko.com/coins/images/33566/small/dogwifhat.png",
    "binanceSym": "WIFUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.1993,
    "change": -2.543,
    "high": 0.2058,
    "low": 0.1927,
    "vol": "1.1M",
    "tvSymbol": "BINANCE:WIFUSDT"
  },
  {
    "id": "bonk",
    "symbol": "BONK",
    "name": "Bonk",
    "pair": "BONK/USDT",
    "icon": "https://assets.coingecko.com/coins/images/28600/small/bonk.jpg",
    "binanceSym": "BONKUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00000299,
    "change": -2.288,
    "high": 0.00000308,
    "low": 0.00000289,
    "vol": "1.0M",
    "tvSymbol": "BINANCE:BONKUSDT"
  },
  {
    "id": "floki",
    "symbol": "FLOKI",
    "name": "Floki",
    "pair": "FLOKI/USDT",
    "icon": "https://assets.coingecko.com/coins/images/16746/small/FLOKI.png",
    "binanceSym": "FLOKIUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00002368,
    "change": -1.824,
    "high": 0.00002414,
    "low": 0.00002305,
    "vol": "0.7M",
    "tvSymbol": "BINANCE:FLOKIUSDT"
  },
  {
    "id": "book-of-meme",
    "symbol": "BOME",
    "name": "BOOK OF MEME",
    "pair": "BOME/USDT",
    "icon": "https://assets.coingecko.com/coins/images/36070/small/bome.png",
    "binanceSym": "BOMEUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.0006427,
    "change": -4.743,
    "high": 0.0006776,
    "low": 0.00063,
    "vol": "1.2M",
    "tvSymbol": "BINANCE:BOMEUSDT"
  },
  {
    "id": "memecoin",
    "symbol": "MEME",
    "name": "Memecoin",
    "pair": "MEME/USDT",
    "icon": "https://assets.coingecko.com/coins/images/32684/small/memecoin.png",
    "binanceSym": "MEMEUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.000491,
    "change": -3.725,
    "high": 0.000511,
    "low": 0.000477,
    "vol": "0.3M",
    "tvSymbol": "BINANCE:MEMEUSDT"
  },
  {
    "id": "render-token",
    "symbol": "RENDER",
    "name": "Render",
    "pair": "RENDER/USDT",
    "icon": "https://assets.coingecko.com/coins/images/11636/small/rndr.png",
    "binanceSym": "RENDERUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 1.858,
    "change": -2.977,
    "high": 1.934,
    "low": 1.805,
    "vol": "2.8M",
    "tvSymbol": "BINANCE:RENDERUSDT"
  },
  {
    "id": "fetch-ai",
    "symbol": "FET",
    "name": "Artificial Superintelligence",
    "pair": "FET/USDT",
    "icon": "https://assets.coingecko.com/coins/images/5681/small/Fetch.jpg",
    "binanceSym": "FETUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 0.193,
    "change": -0.924,
    "high": 0.1962,
    "low": 0.1842,
    "vol": "11.9M",
    "tvSymbol": "BINANCE:FETUSDT"
  },
  {
    "id": "bittensor",
    "symbol": "TAO",
    "name": "Bittensor",
    "pair": "TAO/USDT",
    "icon": "https://assets.coingecko.com/coins/images/28552/small/bittensor-tao.png",
    "binanceSym": "TAOUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 270.8,
    "change": -1.777,
    "high": 277.3,
    "low": 262,
    "vol": "16.9M",
    "tvSymbol": "BINANCE:TAOUSDT"
  },
  {
    "id": "worldcoin-wld",
    "symbol": "WLD",
    "name": "Worldcoin",
    "pair": "WLD/USDT",
    "icon": "https://assets.coingecko.com/coins/images/31062/small/worldcoin.png",
    "binanceSym": "WLDUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 0.495,
    "change": -7.025,
    "high": 0.5398,
    "low": 0.478,
    "vol": "33.9M",
    "tvSymbol": "BINANCE:WLDUSDT"
  },
  {
    "id": "the-graph",
    "symbol": "GRT",
    "name": "The Graph",
    "pair": "GRT/USDT",
    "icon": "https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png",
    "binanceSym": "GRTUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 0.02412,
    "change": -3.094,
    "high": 0.02489,
    "low": 0.02354,
    "vol": "0.5M",
    "tvSymbol": "BINANCE:GRTUSDT"
  }
];

// ─── 2. PERSISTENT STATE ─────────────────────────────────────────────────
const WALLET_STORAGE_KEY = 'vtrade_paper_wallet_v3';

function loadWalletState() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load wallet state, initializing fresh:', e);
  }
  return {
    cashBalance: 10000.00, // $10,000 USD virtual demo cash
    positions: [],
    orders: [],
    tradesHistory: [],
    balanceVisible: true,
    currency: 'USD'
  };
}

let walletState = loadWalletState();

function saveWalletState() {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletState));
  } catch (e) {
    console.error('Failed to save wallet state:', e);
  }
}

// ─── 2.1 USER PROFILE STATE ──────────────────────────────────────────────
const USER_PROFILE_KEY = 'vtrade_user_profile_v1';

const PRESET_AVATARS = {
  cyberpunk: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  bitcoin: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  bull: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=160&auto=format&fit=crop&q=80',
  fox: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=160&auto=format&fit=crop&q=80'
};

function loadUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load user profile, initializing default:', e);
  }
  return {
    name: 'Alex Trader',
    email: 'alex.trader@gmail.com',
    avatar: PRESET_AVATARS.cyberpunk,
    selectedPreset: 'cyberpunk',
    uid: '84920158'
  };
}

let userProfile = loadUserProfile();

function saveUserProfile() {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

// ─── 2.2 THEME ENGINE (4 LUXURY DARK THEMES) ───────────────────────────
const THEME_STORAGE_KEY = 'vtrade_app_theme';

function setAppTheme(themeName) {
  const valid = ['obsidian', 'midnight', 'oled', 'cyber'];
  if (!valid.includes(themeName)) themeName = 'obsidian';

  document.documentElement.setAttribute('data-theme', themeName);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } catch (e) {}

  valid.forEach(t => {
    const el = document.getElementById(`theme-opt-${t}`);
    if (el) el.classList.toggle('active', t === themeName);
  });

  const names = {
    obsidian: 'Dark Obsidian (Gold)',
    midnight: 'Midnight Navy (Electric Cyan)',
    oled: 'OLED Pure Black (Emerald Green)',
    cyber: 'Cyber Neon (Electric Violet)'
  };
  showToast(`Active Theme: ${names[themeName] || themeName}`, 'info');
}

function initAppTheme() {
  let saved = 'obsidian';
  try {
    saved = localStorage.getItem(THEME_STORAGE_KEY) || 'obsidian';
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', saved);
  ['obsidian', 'midnight', 'oled', 'cyber'].forEach(t => {
    const el = document.getElementById(`theme-opt-${t}`);
    if (el) el.classList.toggle('active', t === saved);
  });
}

// ─── 2.3 LUXURY AUTHENTICATION & SESSION ENGINE ─────────────────────────
const AUTH_SESSION_KEY = 'vtrade_auth_session_v1';
const USER_DB_STORAGE_KEY = 'vtrade_users_master_db_v3';

// Pre-seeded database users matching backend SQLite trading.db
const SEED_DATABASE_USERS = [
  { id: 1, username: 'testtrader', email: 'test@example.com', password: 'password123', balance: 10000 },
  { id: 2, username: 'trader2', email: 'trader2@test.com', password: 'password123', balance: 10000 },
  { id: 3, username: 'rabi', email: 'pal039987@mpgi.edu.in', password: 'password123', balance: 10000 },
  { id: 5, username: 'GoogleTrader', email: 'google_trader@vtrade.com', password: 'password123', balance: 10000 },
  { id: 6, username: 'verify_user_1', email: 'verify1@gmail.com', password: 'correct_pass_123', balance: 10000 }
];

function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveAuthSession(sess) {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sess));
  } catch (e) {}
}

function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (e) {}
}

function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('auth-modal-close-btn');
  if (!modal) return;
  switchAuthTab(defaultTab);
  modal.classList.remove('hidden');

  const sess = getAuthSession();
  if (!sess || sess.isGuest || !sess.email) {
    if (closeBtn) closeBtn.classList.add('hidden');
  } else {
    if (closeBtn) closeBtn.classList.remove('hidden');
  }
}

function dismissAuthModal(force = false) {
  const sess = getAuthSession();
  if (!force && (!sess || sess.isGuest || !sess.email)) {
    showToast('Please Sign In or Create an Account to continue', 'warning');
    return;
  }
  const modal = document.getElementById('auth-modal-overlay');
  if (modal) modal.classList.add('hidden');
}

function handleBackdropClick() {
  const sess = getAuthSession();
  if (!sess || sess.isGuest || !sess.email) {
    showToast('Please Sign In or Create an Account to continue', 'warning');
    return;
  }
  dismissAuthModal(true);
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('auth-tab-login');
  const regTab = document.getElementById('auth-tab-register');
  const loginForm = document.getElementById('auth-login-form');
  const regForm = document.getElementById('auth-register-form');

  if (tab === 'login') {
    if (loginTab) loginTab.classList.add('active');
    if (regTab) regTab.classList.remove('active');
    if (loginForm) loginForm.classList.remove('hidden');
    if (regForm) regForm.classList.add('hidden');
  } else {
    if (loginTab) loginTab.classList.remove('active');
    if (regTab) regTab.classList.add('active');
    if (loginForm) loginForm.classList.add('hidden');
    if (regForm) regForm.classList.remove('hidden');
  }
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USER_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  // Migrate any previous users from vtrade_registered_users
  let oldUsers = [];
  try {
    const oldRaw = localStorage.getItem('vtrade_registered_users');
    if (oldRaw) oldUsers = JSON.parse(oldRaw) || [];
  } catch (e) {}

  const merged = [...SEED_DATABASE_USERS];
  oldUsers.forEach(ou => {
    if (ou.email && !merged.some(m => m.email.toLowerCase() === ou.email.toLowerCase())) {
      merged.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        username: ou.username || ou.email.split('@')[0],
        email: ou.email.toLowerCase(),
        password: ou.password || 'password123',
        balance: 10000
      });
    }
  });

  try {
    localStorage.setItem(USER_DB_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {}
  return merged;
}

function saveRegisteredUser(user) {
  try {
    const users = getRegisteredUsers();
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const userRecord = {
      id: user.id || (idx >= 0 ? users[idx].id : Date.now()),
      username: (user.username || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      password: user.password,
      balance: user.balance || 10000,
      createdAt: user.createdAt || Date.now()
    };

    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userRecord };
    } else {
      users.push(userRecord);
    }
    localStorage.setItem(USER_DB_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem('vtrade_registered_users', JSON.stringify(users));
    return userRecord;
  } catch (e) {
    console.error('Failed to save registered user:', e);
  }
}

async function handleAuthLogin(event) {
  if (event) event.preventDefault();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (typeof updateNetworkStatus === 'function') updateNetworkStatus(false);
    showToast('Internet connection is required to sign in. Please connect to internet.', 'error');
    return;
  }

  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const rememberBox = document.getElementById('login-remember');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  // 1. Try Backend API first with timeout
  let backendHandled = false;
  try {
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 2000);
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: ctl.signal
    });
    clearTimeout(tmr);

    const data = await resp.json().catch(() => ({}));
    backendHandled = true;

    if (resp.ok) {
      const sess = {
        token: data.token,
        username: data.username || email.split('@')[0],
        email: data.email || email,
        isGuest: false,
        loggedInAt: Date.now()
      };
      if (!rememberBox || rememberBox.checked) {
        saveAuthSession(sess);
      }
      userProfile.name = sess.username;
      userProfile.email = sess.email;
      saveUserProfile();
      dismissAuthModal(true);
      updateAccountAuthUI();
      renderAccountScreen();
      showToast(`Welcome back, ${sess.username}!`, 'success');
      return;
    }

    // Backend returned 404: strictly NOT in database!
    if (resp.status === 404 || (data.error && data.error.includes('not registered'))) {
      showToast('Account is not registered. Please create an account first.', 'error');
      switchAuthTab('register');
      const regEmail = document.getElementById('register-email');
      if (regEmail) regEmail.value = email;
      return;
    }

    // Backend returned 401: wrong password!
    if (resp.status === 401 || (data.error && data.error.includes('password'))) {
      showToast('Incorrect password. Please try again.', 'error');
      return;
    }

    showToast(data.error || 'Login failed. Please check credentials.', 'error');
    return;

  } catch (err) {
    // If backend already responded with an error, do not fall back
    if (backendHandled) return;
  }

  // 2. Standalone / Mobile offline verification against local database
  const dbUsers = getRegisteredUsers();
  const registered = dbUsers.find(u => u.email.toLowerCase() === email);

  // If user is not in database:
  if (!registered) {
    showToast('Account is not registered. Please create an account first.', 'error');
    switchAuthTab('register');
    const regEmail = document.getElementById('register-email');
    if (regEmail) regEmail.value = email;
    return;
  }

  // If password does not match:
  if (registered.password !== password) {
    showToast('Incorrect password. Please try again.', 'error');
    return;
  }

  // Password matched & user is in database!
  const sess = {
    token: 'vtrade_auth_' + Date.now(),
    username: registered.username,
    email: registered.email,
    isGuest: false,
    loggedInAt: Date.now()
  };
  if (!rememberBox || rememberBox.checked) {
    saveAuthSession(sess);
  }
  userProfile.name = registered.username;
  userProfile.email = registered.email;
  saveUserProfile();
  dismissAuthModal(true);
  updateAccountAuthUI();
  renderAccountScreen();
  showToast(`Welcome back, ${registered.username}!`, 'success');
}

async function handleAuthRegister(event) {
  if (event) event.preventDefault();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (typeof updateNetworkStatus === 'function') updateNetworkStatus(false);
    showToast('Internet connection is required to create an account. Please connect to internet.', 'error');
    return;
  }

  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const pwdInput = document.getElementById('register-password');

  const username = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!username || !email || !password) {
    showToast('Please fill in all registration fields', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  // 1. Check if user already exists in local database
  const dbUsers = getRegisteredUsers();
  const exists = dbUsers.some(u => u.email.toLowerCase() === email);
  if (exists) {
    showToast('Account already exists! Please Sign In.', 'error');
    switchAuthTab('login');
    const loginEmail = document.getElementById('login-email');
    if (loginEmail) loginEmail.value = email;
    return;
  }

  // 2. Try Backend API first with timeout
  try {
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 2000);
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
      signal: ctl.signal
    });
    clearTimeout(tmr);

    const data = await resp.json().catch(() => ({}));
    if (resp.ok) {
      saveRegisteredUser({ username, email, password });
      const sess = {
        token: data.token,
        username: username,
        email: email,
        isGuest: false,
        loggedInAt: Date.now()
      };
      saveAuthSession(sess);
      userProfile.name = username;
      userProfile.email = email;
      saveUserProfile();
      dismissAuthModal(true);
      updateAccountAuthUI();
      renderAccountScreen();
      showToast(`Account created! Welcome to VTrade, ${username}!`, 'success');
      return;
    } else {
      if (data.error && (data.error.includes('already exists') || data.error.includes('UNIQUE'))) {
        showToast('Account already exists! Please Sign In.', 'error');
        switchAuthTab('login');
        const loginEmail = document.getElementById('login-email');
        if (loginEmail) loginEmail.value = email;
        return;
      }
    }
  } catch (err) {}

  // 3. Fallback / Offline registration in persistent database
  saveRegisteredUser({ username, email, password });
  const sess = {
    token: 'vtrade_auth_' + Date.now(),
    username: username,
    email: email,
    isGuest: false,
    loggedInAt: Date.now()
  };
  saveAuthSession(sess);
  userProfile.name = username;
  userProfile.email = email;
  saveUserProfile();
  dismissAuthModal(true);
  updateAccountAuthUI();
  renderAccountScreen();
  showToast(`Account created! Welcome to VTrade, ${username}!`, 'success');
}

function continueAsGuestTrader() {
  showToast('Guest trading is disabled. Please create an account or sign in.', 'warning');
  switchAuthTab('register');
}

function handleAccountAuthClick() {
  const sess = getAuthSession();
  if (sess && !sess.isGuest && sess.email) {
    if (confirm(`Currently signed in as ${sess.username} (${sess.email}). Do you want to sign out?`)) {
      clearAuthSession();
      userProfile.name = 'Trader';
      userProfile.email = '';
      saveUserProfile();
      updateAccountAuthUI();
      renderAccountScreen();
      showToast('Signed out successfully', 'info');
      openAuthModal('login');
    }
  } else {
    openAuthModal('login');
  }
}

function updateAccountAuthUI() {
  const titleEl = document.getElementById('auth-status-title');
  const subEl = document.getElementById('auth-status-sub');
  const btnEl = document.getElementById('auth-action-btn');
  const iconEl = document.getElementById('auth-status-icon');

  const sess = getAuthSession();
  if (sess && !sess.isGuest && sess.email) {
    if (titleEl) titleEl.textContent = `Active Account (${sess.username})`;
    if (subEl) subEl.textContent = sess.email;
    if (btnEl) btnEl.textContent = 'Sign Out';
    if (iconEl) iconEl.textContent = '👤';
  } else {
    if (titleEl) titleEl.textContent = 'Not Signed In';
    if (subEl) subEl.textContent = 'Sign in or register to trade';
    if (btnEl) btnEl.textContent = 'Sign In / Register';
    if (iconEl) iconEl.textContent = '🔐';
  }
}

// ─── 2.4 REAL-TIME NETWORK CONNECTIVITY MONITOR (TRADINGVIEW STYLE) ─────
let isNetworkOnline = typeof navigator !== 'undefined' ? (navigator.onLine !== false) : true;

function updateNetworkStatus(online) {
  isNetworkOnline = online;
  const overlay = document.getElementById('offline-network-overlay');
  const statusText = document.getElementById('offline-status-text');

  if (!online) {
    if (liveTickerInterval) {
      clearInterval(liveTickerInterval);
      liveTickerInterval = null;
    }
    if (overlay) overlay.classList.remove('hidden');
    if (statusText) statusText.textContent = 'Network Offline • Disconnected';
  } else {
    if (overlay) overlay.classList.add('hidden');
    fetchLiveBinanceTickers();
    if (!liveTickerInterval) {
      liveTickerInterval = setInterval(fetchLiveBinanceTickers, 1500);
    }
    fetchRealBinanceCandles();
  }
}

async function retryNetworkConnection() {
  const statusText = document.getElementById('offline-status-text');
  const btn = document.getElementById('offline-retry-btn');
  if (btn) btn.classList.add('loading');
  if (statusText) statusText.textContent = 'Checking connectivity...';

  let connected = false;
  try {
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 3000);
    const res = await fetch('https://api.binance.com/api/v3/ping', { method: 'GET', signal: ctl.signal, cache: 'no-store' });
    clearTimeout(tmr);
    if (res.ok) connected = true;
  } catch (e) {}

  if (!connected && typeof navigator !== 'undefined' && navigator.onLine) {
    connected = true;
  }

  if (connected) {
    updateNetworkStatus(true);
    showToast('Internet connected! Real-time feeds resumed.', 'success');
  } else {
    updateNetworkStatus(false);
    if (statusText) statusText.textContent = 'Still Offline • Please check data/Wi-Fi';
    showToast('No internet detected. Please turn on Wi-Fi or Mobile Data.', 'error');
  }
  if (btn) btn.classList.remove('loading');
}

function initNetworkMonitor() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => {
    updateNetworkStatus(true);
    showToast('Internet reconnected! Live market feeds active.', 'success');
  });
  window.addEventListener('offline', () => {
    updateNetworkStatus(false);
    showToast('Internet connection lost. Trading feeds paused.', 'error');
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    updateNetworkStatus(false);
  }
}



// ─── 3. APP RUNTIME STATE ────────────────────────────────────────────────
let activeTab = 'home';
let selectedCoin = COINS[0]; // Default BTC
let chartInterval = '1h'; // Default 1h
let chartCandlesData = [];
let portfolioTimeframe = '1D';
let homeChartType = 'line'; // 'line' or 'candles'
let portfolioHistorySeries = [];
let isScrubbingPortfolio = false;
let scrubberListenersInitialized = false;

// Markets & Home filter state
let homeMarketTab = 'all';
let marketCategory = 'all';
let marketSearchQuery = '';
let marketSortBy = 'volume';
let marketSortAsc = false;

// Slide-Up Order Sheet state
let sheetSide = 'long'; // 'long' or 'short'
let sheetOrderType = 'market'; // 'market' or 'limit'
let sheetLeverage = 20;
let sheetSizeCoins = 0.05;

// ─── 4. FORMATTING & CURRENCY CONVERSION HELPERS ─────────────────────────
function isINR() {
  return walletState.currency === 'INR';
}

function getCurrencySymbol() {
  return isINR() ? '₹' : '$';
}

function convertVal(usdVal) {
  if (typeof usdVal !== 'number' || isNaN(usdVal)) return 0;
  return isINR() ? usdVal * INR_RATE : usdVal;
}

function fmtMoney(usdVal, decimals = 2) {
  const v = convertVal(usdVal);
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v < 0.01 && v > 0) return v.toFixed(6);
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPrice(usdPrice) {
  const v = convertVal(usdPrice);
  if (v < 0.0001) return v.toFixed(8);
  if (v < 0.01) return v.toFixed(6);
  if (v < 1) return v.toFixed(4);
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let toastTimer = null;
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Clear any existing toasts immediately so only 1 popup is ever visible
  container.innerHTML = '';
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${msg}</span>`;
  container.appendChild(t);

  toastTimer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      t.remove();
      toastTimer = null;
    }, 200);
  }, 2200);
}

// ─── 5. CURRENCY SWITCHER (USD $ ⇄ INR ₹) ───────────────────────────────
let lastCurrencyToggleTime = 0;
function toggleCurrency() {
  const now = Date.now();
  if (now - lastCurrencyToggleTime < 450) {
    // Debounce rapid tap / double-touch event
    return;
  }
  lastCurrencyToggleTime = now;

  walletState.currency = isINR() ? 'USD' : 'INR';
  saveWalletState();

  // Update Header Button
  const iconEl = document.getElementById('curr-toggle-icon');
  const labelEl = document.getElementById('curr-toggle-label');
  if (iconEl) iconEl.textContent = getCurrencySymbol();
  if (labelEl) labelEl.textContent = walletState.currency;

  showToast(`Currency switched to ${walletState.currency} (${getCurrencySymbol()})`, 'info');

  // Re-render active views
  renderAllViews();
}

function toggleBalanceVisibility() {
  walletState.balanceVisible = !walletState.balanceVisible;
  saveWalletState();
  renderHomeBalanceCard();
}

// ─── 6. PAPER DEMO FAUCET (REFILL $10,000) ──────────────────────────────
function refillPaperDemoBalance() {
  walletState.cashBalance = 10000.00;
  saveWalletState();
  showToast(`🎉 Demo Balance refilled to ${getCurrencySymbol()}${fmtMoney(10000.00)}!`, 'success');
  renderAllViews();
}

function clearTradeHistory() {
  walletState.tradesHistory = [];
  saveWalletState();
  renderPortfolioScreen();
  showToast('Trade ledger cleared', 'info');
}

// ─── 7. BOTTOM NAVIGATION CONTROLLER ────────────────────────────────────
function switchBottomTab(tab) {
  activeTab = tab || 'home';

  const tabs = ['home', 'markets', 'trade', 'portfolio', 'account'];
  tabs.forEach(t => {
    const btn = document.getElementById(`vnav-${t}`);
    const screen = document.getElementById(`screen-${t}`);
    if (btn) btn.classList.toggle('active', t === activeTab);
    if (screen) screen.classList.toggle('active', t === activeTab);
  });

  if (activeTab === 'home') renderHomeScreen();
  else if (activeTab === 'markets') renderMarketsScreen();
  else if (activeTab === 'trade') renderTradeScreen();
  else if (activeTab === 'portfolio') renderPortfolioScreen();
  else if (activeTab === 'account') renderAccountScreen();
}

// ─── 8. NET EQUITY & PnL CALCULATIONS ────────────────────────────────────
function calculateUnrealizedPnL() {
  let totalPnL = 0;
  let totalMargin = 0;

  walletState.positions.forEach(pos => {
    const coin = COINS.find(c => c.id === pos.coinId) || selectedCoin;
    const curPrice = coin.price;
    const diff = pos.side === 'long' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
    const posPnL = diff * pos.size;
    totalPnL += posPnL;
    totalMargin += pos.margin;
  });

  return { totalPnL, totalMargin };
}

function getNetEquity() {
  const { totalPnL } = calculateUnrealizedPnL();
  return Math.max(0, walletState.cashBalance + totalPnL);
}

// ─── 9. HOME SCREEN RENDERING & PORTFOLIO GRAPH ──────────────────────────
function renderHomeScreen() {
  renderHomeBalanceCard();
  renderPortfolioCurve();
  renderHomeMarketIntel();
  renderHomeMarketList();
  initPortfolioScrubberListeners();
}

function renderHomeBalanceCard() {
  const netEquity = getNetEquity();
  const curSymEl = document.getElementById('hbal-curr-sym');
  const amountEl = document.getElementById('hbal-amount-val');

  if (curSymEl) curSymEl.textContent = getCurrencySymbol();
  if (amountEl && !isScrubbingPortfolio) {
    amountEl.textContent = walletState.balanceVisible ? fmtMoney(netEquity) : '••••••••';
  }
}

function setHomeChartType(type) {
  homeChartType = type;
  const lineBtn = document.getElementById('hct-line');
  const candlesBtn = document.getElementById('hct-candles');
  const curveSvg = document.getElementById('portfolio-curve-svg');
  const candlesSvg = document.getElementById('portfolio-candles-svg');

  if (lineBtn) lineBtn.classList.toggle('active', type === 'line');
  if (candlesBtn) candlesBtn.classList.toggle('active', type === 'candles');

  if (type === 'line') {
    if (curveSvg) curveSvg.classList.remove('hidden');
    if (candlesSvg) candlesSvg.classList.add('hidden');
  } else {
    if (curveSvg) curveSvg.classList.add('hidden');
    if (candlesSvg) candlesSvg.classList.remove('hidden');
  }

  renderPortfolioCurve();
}

function setPortfolioTimeframe(tf) {
  portfolioTimeframe = tf;
  const tfs = ['1D', '1W', '1M', '1Y', 'ALL'];
  tfs.forEach(t => {
    const btn = document.getElementById(`pct-${t.toLowerCase()}`);
    if (btn) btn.classList.toggle('active', t === tf);
  });
  renderPortfolioCurve();
}

function generatePortfolioDataForTimeframe(tf, currentEquity) {
  const equity = Math.max(100, currentEquity || 10000);
  let count = 24;
  let subLabel = '24h profit';
  let totalDeltaPct = 0.018; // +1.8% intraday default
  let noiseAmp = 0.008;

  if (tf === '1D') {
    count = 24;
    subLabel = '24h profit';
    totalDeltaPct = 0.018;
    noiseAmp = 0.009;
  } else if (tf === '1W') {
    count = 14;
    subLabel = '7d profit';
    totalDeltaPct = 0.045;
    noiseAmp = 0.018;
  } else if (tf === '1M') {
    count = 30;
    subLabel = '30d profit';
    totalDeltaPct = 0.082;
    noiseAmp = 0.026;
  } else if (tf === '1Y') {
    count = 12;
    subLabel = '1y profit';
    totalDeltaPct = 0.345;
    noiseAmp = 0.042;
  } else if (tf === 'ALL') {
    count = 16;
    subLabel = 'All-time profit';
    totalDeltaPct = 0.840;
    noiseAmp = 0.055;
  }

  const startEquity = equity / (1 + totalDeltaPct);
  const series = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const wave = Math.sin(progress * Math.PI * 3.5) * noiseAmp * equity;
    const micro = Math.cos(progress * Math.PI * 7.1) * (noiseAmp * 0.4) * equity;
    const trend = startEquity + (equity - startEquity) * Math.pow(progress, 0.95);
    const closeVal = i === count - 1 ? equity : Math.max(50, trend + wave + micro);

    const prevClose = i === 0 ? (startEquity * 0.995) : series[i - 1].close;
    const openVal = prevClose;
    const highVal = Math.max(openVal, closeVal) + Math.abs(closeVal - openVal) * 0.45 + (equity * 0.002);
    const lowVal = Math.min(openVal, closeVal) - Math.abs(closeVal - openVal) * 0.45 - (equity * 0.002);

    let timeLabel = '';
    if (tf === '1D') {
      const h = (24 - (count - 1 - i)) % 24;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 === 0 ? 12 : h % 12;
      timeLabel = `Today ${dispH}:00 ${ampm}`;
    } else if (tf === '1W') {
      const d = new Date(now.getTime() - (count - 1 - i) * 12 * 3600 * 1000);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      timeLabel = `${days[d.getDay()]} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
    } else if (tf === '1M') {
      const d = new Date(now.getTime() - (count - 1 - i) * 24 * 3600 * 1000);
      timeLabel = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    } else if (tf === '1Y') {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      timeLabel = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    } else {
      const qNum = ((Math.floor(now.getMonth() / 3) - (count - 1 - i)) % 4 + 4) % 4 + 1;
      const yr = now.getFullYear() - Math.floor((count - 1 - i) / 4);
      timeLabel = `Q${qNum} ${yr}`;
    }

    const pnl = closeVal - startEquity;
    const pnlPct = startEquity > 0 ? (pnl / startEquity) * 100 : 0;

    series.push({
      index: i,
      timeLabel,
      open: openVal,
      high: highVal,
      low: lowVal,
      close: closeVal,
      balance: closeVal,
      pnl,
      pnlPct
    });
  }

  return {
    series,
    subLabel,
    startEquity,
    endEquity: equity,
    totalDelta: equity - startEquity,
    totalDeltaPct: totalDeltaPct * 100
  };
}

function renderPortfolioCurve() {
  const curveSvg = document.getElementById('portfolio-curve-svg');
  const candlesSvg = document.getElementById('portfolio-candles-svg');
  const pathArea = document.getElementById('pcurve-area');
  const pathLine = document.getElementById('pcurve-line');
  const pnlSubEl = document.getElementById('hbal-pnl-sub');
  const pnlBadgeEl = document.getElementById('hbal-pnl-badge');

  const netEquity = getNetEquity();
  const { series, subLabel, totalDelta, totalDeltaPct } = generatePortfolioDataForTimeframe(portfolioTimeframe, netEquity);
  portfolioHistorySeries = series;

  if (pnlSubEl) pnlSubEl.textContent = subLabel;

  if (!isScrubbingPortfolio && pnlBadgeEl) {
    const isUp = totalDelta >= 0;
    pnlBadgeEl.className = `hbal-pnl-badge ${isUp ? 'up' : 'down'}`;
    pnlBadgeEl.textContent = `${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(Math.abs(totalDelta))} (${isUp ? '+' : ''}${totalDeltaPct.toFixed(2)}%)`;
  }

  const width = 400;
  const height = 130;
  const topPad = 14;
  const botPad = 16;
  const chartH = height - topPad - botPad;

  let minVal = Infinity;
  let maxVal = -Infinity;
  series.forEach(pt => {
    if (pt.low < minVal) minVal = pt.low;
    if (pt.high > maxVal) maxVal = pt.high;
  });
  if (minVal === maxVal) { minVal *= 0.98; maxVal *= 1.02; }
  const range = maxVal - minVal;

  function scaleY(val) {
    return topPad + (1 - (val - minVal) / range) * chartH;
  }

  const count = series.length;
  series.forEach((pt, idx) => {
    pt.x = (idx / (count - 1)) * (width - 24) + 12;
    pt.y = scaleY(pt.close);
  });

  // 1. Line mode rendering
  if (pathLine && pathArea) {
    let d = `M ${series[0].x} ${series[0].y}`;
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1];
      const curr = series[i];
      const mx = (prev.x + curr.x) / 2;
      d += ` C ${mx} ${prev.y}, ${mx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    pathLine.setAttribute('d', d);
    const areaD = `${d} L ${series[series.length - 1].x} ${height} L ${series[0].x} ${height} Z`;
    pathArea.setAttribute('d', areaD);

    const isUp = totalDelta >= 0;
    const strokeColor = isUp ? '#00c087' : '#f04f5e';
    pathLine.setAttribute('stroke', strokeColor);

    const gradStops = document.querySelectorAll('#pcurveGrad stop');
    if (gradStops && gradStops.length >= 2) {
      gradStops[0].setAttribute('stop-color', strokeColor);
      gradStops[1].setAttribute('stop-color', strokeColor);
    }
  }

  // 2. Candlesticks mode rendering
  if (candlesSvg) {
    candlesSvg.innerHTML = '';
    const slotW = (width - 16) / count;
    const candleW = Math.max(3.5, Math.min(13, slotW * 0.68));

    series.forEach(c => {
      const cx = 8 + (c.index + 0.5) * slotW;
      const isBull = c.close >= c.open;
      const color = isBull ? '#00c087' : '#f04f5e';
      const wickY1 = scaleY(c.high);
      const wickY2 = scaleY(c.low);
      const topY = scaleY(Math.max(c.open, c.close));
      const botY = scaleY(Math.min(c.open, c.close));
      const bodyH = Math.max(2.5, botY - topY);

      const wickLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      wickLine.setAttribute('x1', cx);
      wickLine.setAttribute('y1', wickY1);
      wickLine.setAttribute('x2', cx);
      wickLine.setAttribute('y2', wickY2);
      wickLine.setAttribute('stroke', color);
      wickLine.setAttribute('stroke-width', '1.4');
      wickLine.setAttribute('stroke-linecap', 'round');
      candlesSvg.appendChild(wickLine);

      const bodyRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bodyRect.setAttribute('x', cx - candleW / 2);
      bodyRect.setAttribute('y', topY);
      bodyRect.setAttribute('width', candleW);
      bodyRect.setAttribute('height', bodyH);
      bodyRect.setAttribute('rx', '1.5');
      bodyRect.setAttribute('fill', color);
      candlesSvg.appendChild(bodyRect);
    });
  }
}

function handlePortfolioScrub(clientX) {
  if (!portfolioHistorySeries || portfolioHistorySeries.length === 0) return;
  const wrap = document.getElementById('home-portfolio-curve-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const ratio = rect.width > 0 ? relX / rect.width : 0;
  const targetX = ratio * 400;

  let closestPoint = portfolioHistorySeries[0];
  let minDiff = Infinity;
  for (const pt of portfolioHistorySeries) {
    const diff = Math.abs(pt.x - targetX);
    if (diff < minDiff) {
      minDiff = diff;
      closestPoint = pt;
    }
  }

  const scrubberLine = document.getElementById('portfolio-scrubber-line');
  const scrubberTip = document.getElementById('portfolio-scrubber-tooltip');
  const tipVal = document.getElementById('pst-val');
  const tipTime = document.getElementById('pst-time');
  const amountEl = document.getElementById('hbal-amount-val');
  const pnlBadgeEl = document.getElementById('hbal-pnl-badge');

  const pctPos = (closestPoint.x / 400) * 100;
  if (scrubberLine) {
    scrubberLine.classList.remove('hidden');
    scrubberLine.style.left = `${pctPos}%`;
  }
  if (scrubberTip) {
    scrubberTip.classList.remove('hidden');
    const constrainedPct = Math.max(14, Math.min(86, pctPos));
    scrubberTip.style.left = `${constrainedPct}%`;
  }

  if (tipVal) tipVal.textContent = `${getCurrencySymbol()}${fmtMoney(closestPoint.balance)}`;
  if (tipTime) tipTime.textContent = closestPoint.timeLabel;
  if (amountEl && walletState.balanceVisible) {
    amountEl.textContent = fmtMoney(closestPoint.balance);
  }
  if (pnlBadgeEl) {
    const isUp = closestPoint.pnl >= 0;
    pnlBadgeEl.className = `hbal-pnl-badge ${isUp ? 'up' : 'down'}`;
    pnlBadgeEl.textContent = `${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(Math.abs(closestPoint.pnl))} (${isUp ? '+' : ''}${closestPoint.pnlPct.toFixed(2)}%)`;
  }
}

function initPortfolioScrubberListeners() {
  if (scrubberListenersInitialized) return;
  const target = document.getElementById('portfolio-touch-target');
  if (!target) return;

  function onStart(e) {
    isScrubbingPortfolio = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    handlePortfolioScrub(clientX);
  }

  function onMove(e) {
    if (!isScrubbingPortfolio) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    handlePortfolioScrub(clientX);
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
  }

  function onEnd() {
    if (!isScrubbingPortfolio) return;
    isScrubbingPortfolio = false;
    const scrubberLine = document.getElementById('portfolio-scrubber-line');
    const scrubberTip = document.getElementById('portfolio-scrubber-tooltip');
    if (scrubberLine) scrubberLine.classList.add('hidden');
    if (scrubberTip) scrubberTip.classList.add('hidden');

    renderHomeBalanceCard();
    renderPortfolioCurve();
  }

  target.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  target.addEventListener('touchstart', onStart, { passive: false });
  target.addEventListener('touchmove', onMove, { passive: false });
  target.addEventListener('touchend', onEnd);
  target.addEventListener('touchcancel', onEnd);

  scrubberListenersInitialized = true;
}

function tradeTopGainer() {
  const sorted = [...COINS].sort((a, b) => b.change - a.change);
  if (sorted.length > 0) {
    selectCoinAndTrade(sorted[0].id);
    showToast(`🚀 Opened ${sorted[0].symbol} (+${sorted[0].change.toFixed(2)}%) Top Gainer`, 'success');
  }
}

function renderHomeMarketIntel() {
  const sorted = [...COINS].sort((a, b) => b.change - a.change);
  const top = sorted[0];
  const symEl = document.getElementById('intel-tg-sym');
  const chgEl = document.getElementById('intel-tg-chg');
  if (symEl && top) symEl.textContent = top.symbol;
  if (chgEl && top) {
    chgEl.textContent = `${top.change >= 0 ? '+' : ''}${top.change.toFixed(1)}%`;
    chgEl.className = `intel-change ${top.change >= 0 ? 'up' : 'down'}`;
  }

  const btc = COINS.find(c => c.id === 'bitcoin');
  const aiEl = document.getElementById('intel-ai-verdict');
  if (aiEl && btc) {
    if (btc.change > 1.2) {
      aiEl.textContent = 'Strong Buy';
      aiEl.className = 'intel-val strong-buy';
    } else if (btc.change < -1.2) {
      aiEl.textContent = 'Bearish Alert';
      aiEl.className = 'intel-val down';
    } else {
      aiEl.textContent = 'Accumulate';
      aiEl.className = 'intel-val';
    }
  }
}

function setHomeMarketTab(tab) {
  homeMarketTab = tab;
  ['all', 'gainers', 'losers'].forEach(t => {
    const b = document.getElementById(`hmh-tab-${t}`);
    if (b) b.classList.toggle('active', t === tab);
  });
  renderHomeMarketList();
}

function renderHomeMarketList() {
  const container = document.getElementById('home-coin-list-container');
  if (!container) return;

  let list = [...COINS];
  if (homeMarketTab === 'gainers') {
    list.sort((a, b) => b.change - a.change);
  } else if (homeMarketTab === 'losers') {
    list.sort((a, b) => a.change - b.change);
  }

  container.innerHTML = list.slice(0, 8).map(coin => {
    const isUp = coin.change >= 0;
    const sparkColor = isUp ? '#00c087' : '#f04f5e';
    // Generate mini SVG sparkline
    const sparkD = isUp 
      ? 'M 0 20 Q 16 16, 32 10 T 64 4' 
      : 'M 0 4 Q 16 8, 32 16 T 64 20';

    return `
      <div class="coin-row-card" onclick="selectCoinAndTrade('${coin.id}')">
        <div class="coin-row-left">
          <img class="coin-avatar-img" src="${coin.icon}" alt="${coin.name}" loading="lazy" />
          <div class="coin-meta-col">
            <div class="coin-sym-row">
              <span class="coin-sym-name">${coin.symbol}</span>
              <span class="coin-lev-badge">${coin.maxLev}x</span>
            </div>
            <span class="coin-full-name">${coin.name}</span>
          </div>
        </div>

        <div class="coin-sparkline-wrap">
          <svg class="coin-sparkline-svg" viewBox="0 0 64 24" fill="none">
            <path d="${sparkD}" stroke="${sparkColor}" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>

        <div class="coin-price-col">
          <span class="coin-cur-price">${getCurrencySymbol()}${fmtPrice(coin.price)}</span>
          <span class="coin-chg-badge ${isUp ? 'up' : 'down'}">
            ${isUp ? '+' : ''}${coin.change.toFixed(2)}%
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── 10. MARKETS SCREEN RENDERING ────────────────────────────────────────
function renderMarketsScreen() {
  const container = document.getElementById('markets-coin-list-container');
  if (!container) return;

  let list = [...COINS];

  // Category Filter
  if (marketCategory !== 'all') {
    list = list.filter(c => c.category === marketCategory || (marketCategory === 'futures' && c.maxLev >= 75));
  }

  // Search filter
  if (marketSearchQuery) {
    const q = marketSearchQuery.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }

  // Sort
  if (marketSortBy === 'price') {
    list.sort((a, b) => marketSortAsc ? a.price - b.price : b.price - a.price);
  } else if (marketSortBy === 'change') {
    list.sort((a, b) => marketSortAsc ? a.change - b.change : b.change - a.change);
  } else if (marketSortBy === 'name') {
    list.sort((a, b) => marketSortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
  }

  container.innerHTML = list.map(c => {
    const isUp = c.change >= 0;
    return `
      <div class="mkt-coin-item" onclick="selectCoinAndTrade('${c.id}')">
        <div class="coin-row-left">
          <img class="coin-avatar-img" src="${c.icon}" alt="${c.name}" style="width:28px;height:28px;" />
          <div class="coin-meta-col">
            <div class="coin-sym-row">
              <span class="coin-sym-name" style="font-size:13.5px;">${c.symbol}</span>
              <span class="coin-lev-badge">${c.maxLev}x</span>
            </div>
            <span class="coin-full-name">${c.name}</span>
          </div>
        </div>

        <div class="coin-price-col">
          <span class="coin-cur-price" style="font-size:13px;">${getCurrencySymbol()}${fmtPrice(c.price)}</span>
          <span style="font-size:10px; color:#8b92a4;">Vol: $${c.vol}</span>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          <span class="coin-chg-badge ${isUp ? 'up' : 'down'}" style="font-size:12px;">
            ${isUp ? '+' : ''}${c.change.toFixed(2)}%
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function handleMarketSearch(val) {
  marketSearchQuery = val.trim();
  renderMarketsScreen();
}

function clearMarketSearch() {
  marketSearchQuery = '';
  const input = document.getElementById('markets-search-input');
  if (input) input.value = '';
  renderMarketsScreen();
}

function setMarketCategory(cat) {
  marketCategory = cat;
  ['all', 'futures', 'spot', 'l1', 'l2', 'ai', 'meme', 'defi'].forEach(c => {
    const chip = document.getElementById(`mcat-${c}`);
    if (chip) chip.classList.toggle('active', c === cat);
  });
  renderMarketsScreen();
}

function sortMarketList(field) {
  if (marketSortBy === field) {
    marketSortAsc = !marketSortAsc;
  } else {
    marketSortBy = field;
    marketSortAsc = false;
  }
  renderMarketsScreen();
}

// ─── 11. TRADE SCREEN & CANDLESTICK CHART ENGINE ─────────────────────────

function renderTradingViewChart() {
  const iframe = document.getElementById('tradingview-chart-iframe');
  if (!iframe) return;

  const tvSymbol = selectedCoin.tvSymbol || ('BINANCE:' + (selectedCoin.binanceSym || 'BTCUSDT'));
  const tvIntervalMap = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30',
    '1h': '60', '2h': '120', '4h': '240', '1d': 'D', '1w': 'W', '1M': 'M'
  };
  const intervalCode = tvIntervalMap[chartInterval] || '60';

  const newSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview-chart-iframe&symbol=${encodeURIComponent(tvSymbol)}&interval=${intervalCode}&theme=dark&style=1&timezone=Etc%2FUTC&studies=%5B%5D&hide_side_toolbar=1&hide_top_toolbar=0&allow_symbol_change=0&save_image=0&locale=en`;

  if (!iframe.src || !iframe.src.includes(`symbol=${encodeURIComponent(tvSymbol)}`) || !iframe.src.includes(`interval=${intervalCode}`)) {
    iframe.src = newSrc;
  }
}

function openFullscreenChart() {
  const modal = document.getElementById('tv-fullscreen-modal');
  const iframe = document.getElementById('tv-fullscreen-iframe');
  const pairEl = document.getElementById('tv-fs-pair');
  const priceEl = document.getElementById('tv-fs-price');
  const chgEl = document.getElementById('tv-fs-change');
  if (!modal || !iframe) return;

  const tvSymbol = selectedCoin.tvSymbol || ('BINANCE:' + (selectedCoin.binanceSym || 'BTCUSDT'));
  const tvIntervalMap = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30',
    '1h': '60', '2h': '120', '4h': '240', '1d': 'D', '1w': 'W', '1M': 'M'
  };
  const intervalCode = tvIntervalMap[chartInterval] || '60';

  if (pairEl) pairEl.textContent = selectedCoin.pair;
  if (priceEl) priceEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
  if (chgEl) {
    const isUp = selectedCoin.change >= 0;
    chgEl.className = `tv-fs-change ${isUp ? 'up' : 'down'}`;
    chgEl.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
  }

  const url = `https://s.tradingview.com/widgetembed/?frameElementId=tv-fullscreen-iframe&symbol=${encodeURIComponent(tvSymbol)}&interval=${intervalCode}&theme=dark&style=1&timezone=Etc%2FUTC&studies=%5B%5D&hide_side_toolbar=0&hide_top_toolbar=0&allow_symbol_change=1&save_image=1&locale=en`;
  iframe.src = url;
  modal.classList.remove('hidden');
}

function closeFullscreenChart() {
  const modal = document.getElementById('tv-fullscreen-modal');
  const iframe = document.getElementById('tv-fullscreen-iframe');
  if (modal) modal.classList.add('hidden');
  if (iframe) iframe.src = '';
}

function selectCoinAndTrade(coinId) {
  const coin = COINS.find(c => c.id === coinId);
  if (coin) {
    selectedCoin = coin;
    switchBottomTab('trade');
    renderTradeScreen();
    renderTradingViewChart();
    fetchRealBinanceCandles();
  }
}

function renderTradeScreen() {
  // Update header asset details
  const curIcon = document.getElementById('trade-cur-icon');
  const curSym = document.getElementById('trade-cur-sym');
  const curFull = document.getElementById('trade-cur-fullname');
  const livePriceEl = document.getElementById('trade-header-price');
  const liveChangeEl = document.getElementById('trade-header-change');

  if (curIcon) curIcon.src = selectedCoin.icon;
  if (curSym) curSym.textContent = selectedCoin.pair;
  if (curFull) curFull.textContent = `${selectedCoin.name} Perpetual`;

  const isUp = selectedCoin.change >= 0;
  if (livePriceEl) livePriceEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
  if (liveChangeEl) {
    liveChangeEl.className = `trade-live-change ${isUp ? 'up' : 'down'}`;
    liveChangeEl.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
  }

  // Update floating dock button subtitles
  const buySub = document.getElementById('dock-buy-sub');
  const sellSub = document.getElementById('dock-sell-sub');
  if (buySub) buySub.textContent = `Up to ${selectedCoin.maxLev}x`;
  if (sellSub) sellSub.textContent = `Up to ${selectedCoin.maxLev}x`;

  // Render Orderbook & Positions
  renderTradingViewChart();
  renderOrderbook();
  renderPositions();
  renderOrders();
}

// ─── 12. EXACT 11 TIMEFRAMES CANDLESTICK ENGINE ──────────────────────────
// Timeframes: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 1d, 1w, 1M
function setChartInterval(interval) {
  chartInterval = interval;
  const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M'];
  intervals.forEach(i => {
    const btn = document.getElementById(`ctf-${i}`);
    if (btn) btn.classList.toggle('active', i === interval);
  });
  showToast(`Timeframe: ${interval}`, 'info');
  renderTradingViewChart();
  fetchRealBinanceCandles();
}

async function fetchRealBinanceCandles() {
  const loader = document.getElementById('chart-loading-indicator');
  if (loader) loader.classList.remove('hidden');

  const binanceTfMap = {
    '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
    '1h': '1h', '2h': '2h', '4h': '4h', '1d': '1d', '1w': '1w', '1M': '1M'
  };

  const bTf = binanceTfMap[chartInterval] || '1h';
  const sym = selectedCoin.binanceSym || 'BTCUSDT';

  const urls = [
    `https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=${bTf}&limit=32`,
    `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${bTf}&limit=32`
  ];

  let loaded = false;
  for (const u of urls) {
    try {
      const ctl = new AbortController();
      const tmr = setTimeout(() => ctl.abort(), 3500);
      const resp = await fetch(u, { signal: ctl.signal });
      clearTimeout(tmr);

      if (resp.ok) {
        const klines = await resp.json();
        if (Array.isArray(klines) && klines.length > 0) {
          chartCandlesData = klines.map(k => ({
            time: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            vol: parseFloat(k[5])
          }));
          loaded = true;
          break;
        }
      }
    } catch (err) {
      // Fall through to next endpoint
    }
  }

  if (!loaded) {
    generateSimulatedCandles();
  }

  if (loader) loader.classList.add('hidden');
  renderCandlestickSvg();
}

function generateSimulatedCandles() {
  const base = selectedCoin.price;
  chartCandlesData = [];
  let cur = base * 0.98;
  for (let i = 0; i < 30; i++) {
    const delta = (Math.random() - 0.48) * (base * 0.015);
    const open = cur;
    const close = cur + delta;
    const high = Math.max(open, close) + Math.random() * (base * 0.008);
    const low = Math.min(open, close) - Math.random() * (base * 0.008);
    chartCandlesData.push({ time: Date.now() - (30 - i) * 60000, open, high, low, close, vol: Math.random() * 50 });
    cur = close;
  }
  // Ensure last close matches current selected coin price
  chartCandlesData[chartCandlesData.length - 1].close = selectedCoin.price;
}

function renderCandlestickSvg() {
  const svg = document.getElementById('candlestick-svg');
  if (!svg || chartCandlesData.length === 0) return;

  const width = 400;
  const height = 240;
  const paddingX = 10;
  const paddingY = 24;

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  chartCandlesData.forEach(c => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  const priceRange = Math.max(0.0001, maxPrice - minPrice);
  const candleCount = chartCandlesData.length;
  const candleWidth = Math.max(4, Math.floor((width - paddingX * 2) / candleCount) - 3);

  const priceToY = (p) => {
    return height - paddingY - ((p - minPrice) / priceRange) * (height - paddingY * 2);
  };

  let svgElements = `
    <!-- Grid Lines & Price Labels -->
    <line x1="0" y1="60" x2="${width}" y2="60" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
    <line x1="0" y1="120" x2="${width}" y2="120" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
    <line x1="0" y1="180" x2="${width}" y2="180" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
  `;

  // Draw each Candlestick
  chartCandlesData.forEach((c, idx) => {
    const x = paddingX + idx * (candleWidth + 3);
    const isBull = c.close >= c.open;
    const candleColor = isBull ? '#00c087' : '#f04f5e';

    const yHigh = priceToY(c.high);
    const yLow = priceToY(c.low);
    const yOpen = priceToY(c.open);
    const yClose = priceToY(c.close);

    const bodyY = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

    svgElements += `
      <!-- Wick -->
      <line x1="${x + candleWidth / 2}" y1="${yHigh}" x2="${x + candleWidth / 2}" y2="${yLow}" stroke="${candleColor}" stroke-width="1.2"/>
      <!-- Candle Body -->
      <rect x="${x}" y="${bodyY}" width="${candleWidth}" height="${bodyHeight}" fill="${candleColor}" rx="1"/>
    `;
  });

  // Current Price Dashed Line & Badge
  const curY = priceToY(selectedCoin.price);
  svgElements += `
    <line x1="0" y1="${curY}" x2="${width}" y2="${curY}" stroke="#ff9900" stroke-width="1.2" stroke-dasharray="4 3"/>
    <rect x="${width - 72}" y="${curY - 10}" width="70" height="20" rx="4" fill="#ff9900"/>
    <text x="${width - 37}" y="${curY + 4}" fill="#080b11" font-size="10.5" font-weight="800" font-family="'JetBrains Mono', monospace" text-anchor="middle">
      ${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}
    </text>
  `;

  svg.innerHTML = svgElements;
}

// ─── 13. ORDERBOOK (DOM) RENDERING ───────────────────────────────────────
function renderOrderbook() {
  const bidsWrap = document.getElementById('ob-bids-rows');
  const asksWrap = document.getElementById('ob-asks-rows');
  if (!bidsWrap || !asksWrap) return;

  const basePrice = selectedCoin.price;
  let bidsHtml = '';
  let asksHtml = '';

  for (let i = 0; i < 6; i++) {
    const bidP = basePrice * (1 - (i + 1) * 0.0004);
    const bidS = (Math.random() * 1.5 + 0.1).toFixed(3);
    const barW = Math.min(95, Math.floor(Math.random() * 70 + 25));

    bidsHtml += `
      <div class="ob-row bid">
        <span class="ob-size">${bidS}</span>
        <span class="ob-price">${fmtPrice(bidP)}</span>
        <div class="ob-row-bar" style="width:${barW}%;"></div>
      </div>
    `;

    const askP = basePrice * (1 + (i + 1) * 0.0004);
    const askS = (Math.random() * 1.5 + 0.1).toFixed(3);
    const askBarW = Math.min(95, Math.floor(Math.random() * 70 + 25));

    asksHtml += `
      <div class="ob-row ask">
        <span class="ob-price">${fmtPrice(askP)}</span>
        <span class="ob-size">${askS}</span>
        <div class="ob-row-bar" style="width:${askBarW}%;"></div>
      </div>
    `;
  }

  bidsWrap.innerHTML = bidsHtml;
  asksWrap.innerHTML = asksHtml;
}

function setTradeSubtab(tab) {
  ['orderbook', 'positions', 'orders'].forEach(t => {
    const btn = document.getElementById(`tsub-${t}`);
    const panel = document.getElementById(`tpanel-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (panel) panel.classList.toggle('hidden', t !== tab);
  });
}

// ─── 14. SLIDE-UP ORDER BOTTOM SHEET (COINBASE STYLE) ───────────────────
function openOrderSheet(side) {
  sheetSide = side; // 'long' or 'short'

  const backdrop = document.getElementById('order-sheet-backdrop');
  const badge = document.getElementById('sheet-side-badge');
  const pairTitle = document.getElementById('sheet-pair-title');
  const confirmBtn = document.getElementById('sheet-confirm-btn');
  const sizeInput = document.getElementById('sheet-size-input');
  const unitLabel = document.getElementById('sheet-qty-unit-label');
  const sizeDenom = document.getElementById('sheet-size-denom');

  if (badge) {
    badge.className = `sheet-side-badge ${side}`;
    badge.textContent = side === 'long' ? 'BUY / LONG' : 'SELL / SHORT';
  }

  if (pairTitle) pairTitle.textContent = `${selectedCoin.pair} Perpetual`;
  if (unitLabel) unitLabel.textContent = selectedCoin.symbol;
  if (sizeDenom) sizeDenom.textContent = selectedCoin.symbol;

  if (confirmBtn) {
    confirmBtn.className = `sheet-confirm-btn ${side === 'long' ? 'buy' : 'sell'}`;
    confirmBtn.textContent = `Confirm ${side === 'long' ? 'Buy / Long' : 'Sell / Short'} Order`;
  }

  // Calculate sensible default position size (around 5% of cash)
  const defaultNotional = walletState.cashBalance * 0.05 * sheetLeverage;
  sheetSizeCoins = Math.max(0.001, parseFloat((defaultNotional / selectedCoin.price).toFixed(4)));
  if (sizeInput) sizeInput.value = sheetSizeCoins;

  // Set leverage slider max to coin max
  const levSlider = document.getElementById('sheet-leverage-slider');
  if (levSlider) {
    levSlider.max = selectedCoin.maxLev;
    levSlider.value = Math.min(sheetLeverage, selectedCoin.maxLev);
  }

  updateOrderSheetCalculations();

  if (backdrop) backdrop.classList.remove('hidden');
}

function closeOrderSheet() {
  const backdrop = document.getElementById('order-sheet-backdrop');
  if (backdrop) backdrop.classList.add('hidden');
}

function setOrderSheetType(type) {
  sheetOrderType = type;
  const mBtn = document.getElementById('sot-market');
  const lBtn = document.getElementById('sot-limit');
  const limitInputWrap = document.getElementById('sheet-limit-input-wrap');

  if (mBtn) mBtn.classList.toggle('active', type === 'market');
  if (lBtn) lBtn.classList.toggle('active', type === 'limit');
  if (limitInputWrap) limitInputWrap.classList.toggle('hidden', type !== 'limit');

  updateOrderSheetCalculations();
}

function setOrderSheetLeverage(lev) {
  sheetLeverage = Math.min(lev, selectedCoin.maxLev);
  const slider = document.getElementById('sheet-leverage-slider');
  if (slider) slider.value = sheetLeverage;

  const chips = document.querySelectorAll('.sc-chip');
  chips.forEach(c => {
    c.classList.toggle('active', c.textContent.trim() === `${sheetLeverage}x`);
  });

  updateOrderSheetCalculations();
}

function handleLeverageSliderInput(val) {
  sheetLeverage = parseInt(val, 10);
  const badge = document.getElementById('sheet-lev-value-badge');
  if (badge) badge.textContent = `${sheetLeverage}x`;

  const chips = document.querySelectorAll('.sc-chip');
  chips.forEach(c => {
    c.classList.toggle('active', c.textContent.trim() === `${sheetLeverage}x`);
  });

  updateOrderSheetCalculations();
}

function handleSizeInput(val) {
  sheetSizeCoins = Math.max(0.0001, parseFloat(val) || 0);
  updateOrderSheetCalculations();
}

function setOrderSheetPct(pct) {
  // Size = (Available Cash * Leverage * pct) / Price
  const availableCash = walletState.cashBalance;
  const maxNotional = availableCash * sheetLeverage * pct;
  sheetSizeCoins = Math.max(0.0001, parseFloat((maxNotional / selectedCoin.price).toFixed(4)));

  const sizeInput = document.getElementById('sheet-size-input');
  if (sizeInput) sizeInput.value = sheetSizeCoins;

  updateOrderSheetCalculations();
}

function updateOrderSheetCalculations() {
  const badge = document.getElementById('sheet-lev-value-badge');
  if (badge) badge.textContent = `${sheetLeverage}x`;

  const price = sheetOrderType === 'limit' 
    ? (parseFloat(document.getElementById('sheet-limit-price')?.value) || selectedCoin.price)
    : selectedCoin.price;

  const notionalUsd = sheetSizeCoins * price;
  const reqMarginUsd = notionalUsd / sheetLeverage;

  // Liquidation Price calculation:
  // Long: Entry * (1 - (1/lev)*0.9)
  // Short: Entry * (1 + (1/lev)*0.9)
  const liqFactor = (1 / sheetLeverage) * 0.9;
  const liqPrice = sheetSide === 'long' 
    ? price * (1 - liqFactor) 
    : price * (1 + liqFactor);

  const notionalEl = document.getElementById('scalc-notional');
  const marginEl = document.getElementById('scalc-margin');
  const liqEl = document.getElementById('scalc-liq-price');

  if (notionalEl) notionalEl.textContent = `${getCurrencySymbol()}${fmtMoney(notionalUsd)}`;
  if (marginEl) marginEl.textContent = `${getCurrencySymbol()}${fmtMoney(reqMarginUsd)}`;
  if (liqEl) liqEl.textContent = `${getCurrencySymbol()}${fmtPrice(Math.max(0, liqPrice))}`;
}

// ─── 15. ORDER EXECUTION (REAL WORKING PAPER TRADING) ───────────────────
function executeOrderFromSheet() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (typeof updateNetworkStatus === 'function') updateNetworkStatus(false);
    showToast('Cannot execute trade while offline. Please connect to internet.', 'error');
    return;
  }

  const sess = getAuthSession();
  const dbUsers = getRegisteredUsers();
  const isValidDbUser = sess && sess.email && dbUsers.some(u => u.email.toLowerCase() === sess.email.toLowerCase());
  if (!sess || sess.isGuest || !isValidDbUser) {
    showToast('Authentication required. Please sign in with a registered account to trade.', 'error');
    openAuthModal('login');
    return;
  }

  const price = sheetOrderType === 'limit' 
    ? (parseFloat(document.getElementById('sheet-limit-price')?.value) || selectedCoin.price)
    : selectedCoin.price;

  const notionalUsd = sheetSizeCoins * price;
  const reqMarginUsd = notionalUsd / sheetLeverage;

  if (reqMarginUsd > walletState.cashBalance) {
    showToast(`❌ Insufficient demo funds! Required: ${getCurrencySymbol()}${fmtMoney(reqMarginUsd)}, Available: ${getCurrencySymbol()}${fmtMoney(walletState.cashBalance)}`, 'error');
    return;
  }

  if (sheetOrderType === 'limit') {
    // Add pending limit order
    walletState.orders.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      pair: selectedCoin.pair,
      side: sheetSide,
      price: price,
      size: sheetSizeCoins,
      leverage: sheetLeverage,
      margin: reqMarginUsd,
      created_at: new Date().toISOString()
    });
    saveWalletState();
    closeOrderSheet();
    showToast(`Pending Limit Order placed: ${sheetSizeCoins} ${selectedCoin.symbol} @ ${getCurrencySymbol()}${fmtPrice(price)}`, 'info');
  } else {
    // Market order executes immediately
    walletState.cashBalance = Math.max(0, walletState.cashBalance - reqMarginUsd);

    const liqFactor = (1 / sheetLeverage) * 0.9;
    const liqPrice = sheetSide === 'long' 
      ? price * (1 - liqFactor) 
      : price * (1 + liqFactor);

    walletState.positions.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      pair: selectedCoin.pair,
      side: sheetSide,
      entryPrice: price,
      size: sheetSizeCoins,
      leverage: sheetLeverage,
      margin: reqMarginUsd,
      liqPrice: Math.max(0, liqPrice),
      created_at: new Date().toISOString()
    });

    saveWalletState();
    closeOrderSheet();
    showToast(`✅ ${sheetSide === 'long' ? 'Long' : 'Short'} order filled: ${sheetSizeCoins} ${selectedCoin.symbol} @ ${getCurrencySymbol()}${fmtPrice(price)}!`, 'success');
  }

  // Update views
  renderAllViews();
}

function closePosition(posId) {
  const idx = walletState.positions.findIndex(p => p.id === posId);
  if (idx === -1) return;

  const pos = walletState.positions[idx];
  const coin = COINS.find(c => c.id === pos.coinId) || selectedCoin;
  const curPrice = coin.price;

  const diff = pos.side === 'long' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
  const pnlUsd = diff * pos.size;

  // Return margin + realized PnL
  walletState.cashBalance = Math.max(0, walletState.cashBalance + pos.margin + pnlUsd);

  // Record trade history
  walletState.tradesHistory.unshift({
    id: Date.now(),
    symbol: pos.symbol,
    side: pos.side,
    size: pos.size,
    entryPrice: pos.entryPrice,
    closePrice: curPrice,
    leverage: pos.leverage,
    pnl: pnlUsd,
    closed_at: new Date().toISOString()
  });

  // Remove open position
  walletState.positions.splice(idx, 1);
  saveWalletState();

  const isProfit = pnlUsd >= 0;
  showToast(`Position Closed! Realized PnL: ${isProfit ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnlUsd)}`, isProfit ? 'success' : 'error');

  renderAllViews();
}

function cancelPendingOrder(orderId) {
  const idx = walletState.orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;
  walletState.orders.splice(idx, 1);
  saveWalletState();
  showToast('Pending Limit Order canceled', 'info');
  renderOrders();
}

// ─── 16. POSITIONS & ORDERS PANEL RENDERERS ──────────────────────────────
function renderPositions() {
  const container = document.getElementById('trade-positions-container');
  const countBadge = document.getElementById('tsub-pos-count');
  if (countBadge) countBadge.textContent = walletState.positions.length;

  if (!container) return;

  if (walletState.positions.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <span style="font-size:24px;">💼</span>
        <span style="font-weight:700; color:#ffffff;">No Open Positions</span>
        <span>Tap "Buy / Long" or "Sell / Short" to open a live paper trade.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = walletState.positions.map(pos => {
    const coin = COINS.find(c => c.id === pos.coinId) || selectedCoin;
    const curPrice = coin.price;
    const diff = pos.side === 'long' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
    const pnlUsd = diff * pos.size;
    const roe = pos.margin > 0 ? (pnlUsd / pos.margin) * 100 : 0;
    const isUp = pnlUsd >= 0;

    return `
      <div class="pos-card-item">
        <div class="pos-card-header">
          <div class="pos-card-sym-wrap">
            <span class="pos-dir-badge ${pos.side}">${pos.side.toUpperCase()}</span>
            <span class="pos-sym-title">${pos.pair}</span>
            <span class="pos-lev-text">${pos.leverage}x</span>
          </div>
          <div class="pos-pnl-header ${isUp ? 'up' : 'down'}">
            ${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnlUsd)} (${isUp ? '+' : ''}${roe.toFixed(2)}%)
          </div>
        </div>

        <div class="pos-card-grid">
          <div class="pos-metric">
            <span class="pos-k">Entry Price</span>
            <span class="pos-v">${getCurrencySymbol()}${fmtPrice(pos.entryPrice)}</span>
          </div>
          <div class="pos-metric">
            <span class="pos-k">Mark Price</span>
            <span class="pos-v">${getCurrencySymbol()}${fmtPrice(curPrice)}</span>
          </div>
          <div class="pos-metric">
            <span class="pos-k">Liq. Price</span>
            <span class="pos-v" style="color:#ffaa33;">${getCurrencySymbol()}${fmtPrice(pos.liqPrice)}</span>
          </div>
          <div class="pos-metric">
            <span class="pos-k">Size</span>
            <span class="pos-v">${pos.size} ${pos.symbol}</span>
          </div>
          <div class="pos-metric">
            <span class="pos-k">Margin</span>
            <span class="pos-v">${getCurrencySymbol()}${fmtMoney(pos.margin)}</span>
          </div>
          <div class="pos-metric">
            <span class="pos-k">Mode</span>
            <span class="pos-v">Isolated</span>
          </div>
        </div>

        <button class="pos-close-btn" onclick="closePosition(${pos.id})">Close Position</button>
      </div>
    `;
  }).join('');
}

function renderOrders() {
  const container = document.getElementById('trade-orders-container');
  const countBadge = document.getElementById('tsub-ord-count');
  if (countBadge) countBadge.textContent = walletState.orders.length;

  if (!container) return;

  if (walletState.orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <span style="font-size:24px;">📋</span>
        <span style="font-weight:700; color:#ffffff;">No Pending Orders</span>
        <span>Limit orders waiting to trigger will appear here.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = walletState.orders.map(ord => {
    return `
      <div class="pos-card-item">
        <div class="pos-card-header">
          <div class="pos-card-sym-wrap">
            <span class="pos-dir-badge ${ord.side}">LIMIT ${ord.side.toUpperCase()}</span>
            <span class="pos-sym-title">${ord.pair}</span>
            <span class="pos-lev-text">${ord.leverage}x</span>
          </div>
          <button class="pos-close-btn" onclick="cancelPendingOrder(${ord.id})">Cancel</button>
        </div>
        <div class="pos-card-grid">
          <div class="pos-metric"><span class="pos-k">Target Price</span><span class="pos-v">${getCurrencySymbol()}${fmtPrice(ord.price)}</span></div>
          <div class="pos-metric"><span class="pos-k">Size</span><span class="pos-v">${ord.size} ${ord.symbol}</span></div>
          <div class="pos-metric"><span class="pos-k">Margin</span><span class="pos-v">${getCurrencySymbol()}${fmtMoney(ord.margin)}</span></div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── 17. PORTFOLIO & ASSETS SCREEN RENDERING ─────────────────────────────
function renderPortfolioScreen() {
  const netEquity = getNetEquity();
  const { totalPnL, totalMargin } = calculateUnrealizedPnL();

  const pfCurrEl = document.getElementById('pf-curr-sym');
  const pfValEl = document.getElementById('pf-total-val');
  const freeCashEl = document.getElementById('pfm-free-cash');
  const usedMarginEl = document.getElementById('pfm-used-margin');
  const unPnLEl = document.getElementById('pfm-unrealized-pnl');
  const riskEl = document.getElementById('pfm-risk-ratio');
  const posCountEl = document.getElementById('pf-active-pos-count');

  if (pfCurrEl) pfCurrEl.textContent = getCurrencySymbol();
  if (pfValEl) pfValEl.textContent = fmtMoney(netEquity);
  if (freeCashEl) freeCashEl.textContent = `${getCurrencySymbol()}${fmtMoney(walletState.cashBalance)}`;
  if (usedMarginEl) usedMarginEl.textContent = `${getCurrencySymbol()}${fmtMoney(totalMargin)}`;

  if (unPnLEl) {
    const isUp = totalPnL >= 0;
    unPnLEl.className = `pfm-v ${isUp ? 'up' : 'down'}`;
    unPnLEl.textContent = `${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(totalPnL)}`;
  }

  if (riskEl) {
    const riskRatio = netEquity > 0 ? (totalMargin / netEquity) * 100 : 0;
    riskEl.textContent = `${riskRatio.toFixed(1)}% (${riskRatio > 65 ? 'High' : 'Safe'})`;
  }

  if (posCountEl) posCountEl.textContent = walletState.positions.length;

  // Render Positions list in Portfolio
  const posContainer = document.getElementById('pf-positions-container');
  if (posContainer) {
    if (walletState.positions.length === 0) {
      posContainer.innerHTML = `<div style="text-align:center; padding:18px; color:#555f75; font-size:12px;">No active positions</div>`;
    } else {
      posContainer.innerHTML = walletState.positions.map(pos => {
        const coin = COINS.find(c => c.id === pos.coinId) || selectedCoin;
        const curPrice = coin.price;
        const diff = pos.side === 'long' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
        const pnl = diff * pos.size;
        const isUp = pnl >= 0;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:12px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="pos-dir-badge ${pos.side}" style="font-size:9px;">${pos.side.toUpperCase()}</span>
              <span style="font-weight:700;">${pos.pair} (${pos.leverage}x)</span>
            </div>
            <div style="text-align:right;">
              <span class="${isUp ? 'up' : 'down'}" style="font-weight:800; font-family:'JetBrains Mono',monospace;">${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnl)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render Trade Ledger History
  const histContainer = document.getElementById('pf-history-container');
  if (histContainer) {
    if (walletState.tradesHistory.length === 0) {
      histContainer.innerHTML = `<div style="text-align:center; padding:18px; color:#555f75; font-size:12px;">No trade history yet</div>`;
    } else {
      histContainer.innerHTML = walletState.tradesHistory.slice(0, 10).map(t => {
        const isUp = t.pnl >= 0;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:12px;">
            <div>
              <div style="font-weight:700;">${t.symbol} <span style="font-size:10px; color:#ffaa33;">${t.side.toUpperCase()} ${t.leverage}x</span></div>
              <div style="font-size:10px; color:#555f75;">Size: ${t.size} • Close: ${getCurrencySymbol()}${fmtPrice(t.closePrice)}</div>
            </div>
            <div style="text-align:right;">
              <div class="${isUp ? 'up' : 'down'}" style="font-weight:800; font-family:'JetBrains Mono',monospace;">${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(t.pnl)}</div>
              <div style="font-size:10px; color:#555f75;">${new Date(t.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// ─── 18. COIN PICKER MODAL ───────────────────────────────────────────────
function openCoinPickerModal() {
  const modal = document.getElementById('coin-picker-modal');
  if (modal) modal.classList.remove('hidden');
  renderCoinPickerList('');
}

function closeCoinPickerModal() {
  const modal = document.getElementById('coin-picker-modal');
  if (modal) modal.classList.add('hidden');
}

function filterCoinPicker(query) {
  renderCoinPickerList(query.trim().toLowerCase());
}

function renderCoinPickerList(query = '') {
  const container = document.getElementById('coin-picker-list-container');
  if (!container) return;

  const list = query 
    ? COINS.filter(c => c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query))
    : COINS;

  container.innerHTML = list.map(c => `
    <div class="coin-row-card" style="padding:10px 12px; margin-bottom:4px;" onclick="selectCoinFromPicker('${c.id}')">
      <div class="coin-row-left">
        <img class="coin-avatar-img" src="${c.icon}" alt="${c.name}" style="width:28px;height:28px;" />
        <div class="coin-meta-col">
          <span class="coin-sym-name">${c.pair}</span>
          <span class="coin-full-name">${c.name}</span>
        </div>
      </div>
      <div class="coin-price-col">
        <span class="coin-cur-price">${getCurrencySymbol()}${fmtPrice(c.price)}</span>
        <span class="coin-chg-badge ${c.change >= 0 ? 'up' : 'down'}">${c.change >= 0 ? '+' : ''}${c.change.toFixed(2)}%</span>
      </div>
    </div>
  `).join('');
}

function selectCoinFromPicker(coinId) {
  const coin = COINS.find(c => c.id === coinId);
  if (coin) {
    selectedCoin = coin;
    closeCoinPickerModal();
    renderTradeScreen();
    fetchRealBinanceCandles();
  }
}

// ─── 19. LIVE PRICE TICK STREAMING (BINANCE API + SIMULATOR) ───────────
async function fetchLiveBinanceTickers() {
  const endpoints = [
    'https://data-api.binance.vision/api/v3/ticker/24hr',
    'https://api.binance.com/api/v3/ticker/24hr',
    '/api/prices'
  ];

  let success = false;
  for (const url of endpoints) {
    try {
      const ctl = new AbortController();
      const tmr = setTimeout(() => ctl.abort(), 2500);
      const resp = await fetch(url, { signal: ctl.signal });
      clearTimeout(tmr);

      if (resp.ok) {
        const data = await resp.json();
        const tickerMap = new Map();
        if (Array.isArray(data)) {
          data.forEach(t => tickerMap.set(t.symbol, t));
        } else if (data && data.prices) {
          Object.keys(data.prices).forEach(k => {
            const p = data.prices[k];
            if (p && p.price) {
              const symKey = (k === 'gold' ? 'PAXGUSDT' : (k.toUpperCase() + 'USDT'));
              tickerMap.set(symKey, {
                lastPrice: p.price,
                priceChangePercent: p.change24h || 0,
                highPrice: p.high24h || p.price * 1.02,
                lowPrice: p.low24h || p.price * 0.98,
                quoteVolume: p.volume24h || 50000000
              });
            }
          });
        }

        if (tickerMap.size > 0) {
          COINS.forEach(c => {
            const t = tickerMap.get(c.binanceSym);
            if (t) {
              c.price = parseFloat(t.lastPrice);
              c.change = parseFloat(t.priceChangePercent);
              c.high = parseFloat(t.highPrice);
              c.low = parseFloat(t.lowPrice);
              if (t.quoteVolume) {
                const qv = parseFloat(t.quoteVolume);
                c.vol = qv >= 1e9 ? (qv / 1e9).toFixed(2) + 'B' : (qv / 1e6).toFixed(1) + 'M';
              }
            }
          });
          success = true;
          break;
        }
      }
    } catch (err) {}
  }

  // Also query Coinbase USD for BTC, ETH, SOL and Gold-API for live Gold Spot (XAU/USD)
  try {
    const cbCtl = new AbortController();
    const cbTmr = setTimeout(() => cbCtl.abort(), 1200);
    const [btcR, ethR, solR, goldR] = await Promise.all([
      fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { signal: cbCtl.signal }).then(r => r.json()).catch(() => null),
      fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot', { signal: cbCtl.signal }).then(r => r.json()).catch(() => null),
      fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot', { signal: cbCtl.signal }).then(r => r.json()).catch(() => null),
      fetch('https://api.gold-api.com/price/XAU', { signal: cbCtl.signal }).then(r => r.json()).catch(() => null)
    ]);
    clearTimeout(cbTmr);

    if (btcR && btcR.data && btcR.data.amount) {
      const btc = COINS.find(c => c.id === 'bitcoin');
      if (btc) btc.price = parseFloat(btcR.data.amount);
    }
    if (ethR && ethR.data && ethR.data.amount) {
      const eth = COINS.find(c => c.id === 'ethereum');
      if (eth) eth.price = parseFloat(ethR.data.amount);
    }
    if (solR && solR.data && solR.data.amount) {
      const sol = COINS.find(c => c.id === 'solana');
      if (sol) sol.price = parseFloat(solR.data.amount);
    }
    if (goldR && goldR.price) {
      const gold = COINS.find(c => c.id === 'gold');
      if (gold) {
        gold.price = parseFloat(goldR.price);
        if (gold.high < gold.price) gold.high = parseFloat((gold.price * 1.003).toFixed(2));
        if (gold.low > gold.price) gold.low = parseFloat((gold.price * 0.997).toFixed(2));
      }
    }
  } catch (cbErr) {}

  checkPendingOrdersTrigger();
  renderLivePriceUpdates();
}

function simulatePriceFluctuations() {
  // Pure authentic data: NO random drift simulation!
}

function checkPendingOrdersTrigger() {
  // Check if any pending limit orders should execute
  if (walletState.orders.length === 0) return;

  const remaining = [];
  walletState.orders.forEach(ord => {
    const coin = COINS.find(c => c.id === ord.coinId);
    if (!coin) { remaining.push(ord); return; }

    const isTriggered = ord.side === 'long' 
      ? coin.price <= ord.price 
      : coin.price >= ord.price;

    if (isTriggered && ord.margin <= walletState.cashBalance) {
      // Execute order
      walletState.cashBalance = Math.max(0, walletState.cashBalance - ord.margin);
      const liqFactor = (1 / ord.leverage) * 0.9;
      const liqPrice = ord.side === 'long' 
        ? ord.price * (1 - liqFactor) 
        : ord.price * (1 + liqFactor);

      walletState.positions.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        coinId: ord.coinId,
        symbol: ord.symbol,
        pair: ord.pair,
        side: ord.side,
        entryPrice: ord.price,
        size: ord.size,
        leverage: ord.leverage,
        margin: ord.margin,
        liqPrice: Math.max(0, liqPrice),
        created_at: new Date().toISOString()
      });

      showToast(`🎯 Limit order executed! ${ord.side.toUpperCase()} ${ord.size} ${ord.symbol} @ ${getCurrencySymbol()}${fmtPrice(ord.price)}`, 'success');
    } else {
      remaining.push(ord);
    }
  });

  if (remaining.length !== walletState.orders.length) {
    walletState.orders = remaining;
    saveWalletState();
    renderAllViews();
  }
}

function renderLivePriceUpdates() {
  if (activeTab === 'home') {
    renderHomeBalanceCard();
    renderHomeMarketIntel();
    renderHomeMarketList();
  } else if (activeTab === 'markets') {
    renderMarketsScreen();
  } else if (activeTab === 'trade') {
    const livePriceEl = document.getElementById('trade-header-price');
    const liveChangeEl = document.getElementById('trade-header-change');
    const isUp = selectedCoin.change >= 0;
    if (livePriceEl) livePriceEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
    if (liveChangeEl) {
      liveChangeEl.className = `trade-live-change ${isUp ? 'up' : 'down'}`;
      liveChangeEl.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
    }
    renderPositions();
    renderOrderbook();
  } else if (activeTab === 'portfolio') {
    renderPortfolioScreen();
  } else if (activeTab === 'account') {
    renderAccountScreen();
  }

  // Live sync fullscreen TradingView modal header if open
  const fsModal = document.getElementById('tv-fullscreen-modal');
  if (fsModal && !fsModal.classList.contains('hidden')) {
    const fsPrice = document.getElementById('tv-fs-price');
    const fsChange = document.getElementById('tv-fs-change');
    if (fsPrice) fsPrice.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
    if (fsChange) {
      const isUp = selectedCoin.change >= 0;
      fsChange.className = `tv-fs-change ${isUp ? 'up' : 'down'}`;
      fsChange.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
    }
  }
}

function renderAllViews() {
  renderHomeScreen();
  renderMarketsScreen();
  renderTradeScreen();
  renderPortfolioScreen();
  renderAccountScreen();
}

// ─── 19. ACCOUNTS & PROFILE SCREEN CONTROLLER ────────────────────────────
function renderAccountScreen() {
  const dpImg = document.getElementById('account-dp-img');
  const nameEl = document.getElementById('account-display-name');
  const emailEl = document.getElementById('account-display-email');
  const uidEl = document.getElementById('account-display-uid');
  const refillBalEl = document.getElementById('account-refill-balance-display');
  const currStatusEl = document.getElementById('acc-curr-status');

  if (dpImg && userProfile.avatar) dpImg.src = userProfile.avatar;
  if (nameEl) nameEl.textContent = userProfile.name;
  if (emailEl) emailEl.textContent = userProfile.email;
  if (uidEl) uidEl.textContent = `UID: ${userProfile.uid}`;

  // Highlight active preset chip if applicable
  ['cyberpunk', 'bitcoin', 'ethereum', 'bull', 'fox'].forEach(key => {
    const btn = document.getElementById(`pab-${key}`);
    if (btn) btn.classList.toggle('active', userProfile.selectedPreset === key);
  });

  // Update current available cash in refill card
  if (refillBalEl) {
    refillBalEl.textContent = `${getCurrencySymbol()}${fmtPrice(walletState.cashBalance)}`;
  }
  if (currStatusEl) {
    currStatusEl.textContent = `${walletState.currency} (${getCurrencySymbol()})`;
  }
}

function triggerAvatarUpload() {
  const input = document.getElementById('account-dp-file-input');
  if (input) input.click();
}

function handleAvatarFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    userProfile.avatar = dataUrl;
    userProfile.selectedPreset = null;
    saveUserProfile();
    renderAccountScreen();
    showToast('Profile photo updated successfully!', 'success');
  };
  reader.readAsDataURL(file);
}

function selectPresetAvatar(presetKey) {
  if (PRESET_AVATARS[presetKey]) {
    userProfile.avatar = PRESET_AVATARS[presetKey];
    userProfile.selectedPreset = presetKey;
    saveUserProfile();
    renderAccountScreen();
    showToast(`Avatar updated to ${presetKey}!`, 'success');
  }
}

function openProfileEditModal() {
  const modal = document.getElementById('edit-profile-modal-backdrop');
  const nameInput = document.getElementById('epm-input-name');
  const emailInput = document.getElementById('epm-input-email');
  if (nameInput) nameInput.value = userProfile.name;
  if (emailInput) emailInput.value = userProfile.email;
  if (modal) modal.classList.remove('hidden');
}

function closeProfileEditModal() {
  const modal = document.getElementById('edit-profile-modal-backdrop');
  if (modal) modal.classList.add('hidden');
}

function handleProfileEditSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('epm-input-name');
  const emailInput = document.getElementById('epm-input-email');
  if (nameInput && nameInput.value.trim()) {
    userProfile.name = nameInput.value.trim();
  }
  if (emailInput && emailInput.value.trim()) {
    userProfile.email = emailInput.value.trim();
  }
  saveUserProfile();
  renderAccountScreen();
  closeProfileEditModal();
  showToast('Profile updated successfully!', 'success');
}

function copyAccountUID() {
  const uidText = userProfile.uid;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(uidText).then(() => {
      showToast(`UID ${uidText} copied to clipboard!`, 'info');
    }).catch(() => {
      showToast(`UID: ${uidText}`, 'info');
    });
  } else {
    showToast(`UID: ${uidText}`, 'info');
  }
}

function resetDemoAccountFull() {
  if (confirm('Are you sure you want to reset your virtual account to $10,000 and clear all positions?')) {
    walletState = {
      cashBalance: 10000.00,
      positions: [],
      orders: [],
      tradesHistory: [],
      balanceVisible: true,
      currency: walletState.currency || 'USD'
    };
    saveWalletState();
    renderAllViews();
    showToast('Demo Account successfully reset to $10,000', 'success');
  }
}

// ─── 20. INITIALIZATION ON BOOT ──────────────────────────────────────────
let liveTickerInterval = null;

function initVTradeApp() {
  console.log('🚀 Initializing VTrade 120 FPS Paper Trading App...');

  // Ensure native mobile safe areas are properly applied
  try {
    const isCap = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const isAnd = /Android/i.test(navigator.userAgent);
    if (isCap || isAnd) {
      document.documentElement.classList.add('is-native-apk', 'is-mobile-app');
    }
  } catch (e) {}

  // Setup Currency Button state
  const iconEl = document.getElementById('curr-toggle-icon');
  const labelEl = document.getElementById('curr-toggle-label');
  if (iconEl) iconEl.textContent = getCurrencySymbol();
  if (labelEl) labelEl.textContent = walletState.currency;

  // Initialize luxury theme
  initAppTheme();

  // Initialize TradingView-style Network Monitor
  initNetworkMonitor();

  // Check auth session & strictly validate against database users
  const sess = getAuthSession();
  const dbUsers = getRegisteredUsers();
  const isValidDbUser = sess && sess.email && dbUsers.some(u => u.email.toLowerCase() === sess.email.toLowerCase());

  if (sess && !sess.isGuest && isValidDbUser) {
    userProfile.name = sess.username;
    userProfile.email = sess.email;
    saveUserProfile();
    updateAccountAuthUI();
  } else {
    clearAuthSession();
    updateAccountAuthUI();
    openAuthModal('login');
  }

  // Render TradingView Chart for active coin
  renderTradingViewChart();

  // Render initial screen
  switchBottomTab('home');

  // Initial fetch of candlesticks
  fetchRealBinanceCandles();

  // Start continuous 3-second live price ticker
  fetchLiveBinanceTickers();
  if (!liveTickerInterval) {
    liveTickerInterval = setInterval(fetchLiveBinanceTickers, 1500);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(initVTradeApp, 100);
  });
}
