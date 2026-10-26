/**
 * ══════════════════════════════════════════════════════════════════════════
 * VTRADE – 120 FPS HIGH PERFORMANCE CRYPTO PAPER TRADING ENGINE
 * Fully Functional, Real-time Binance feeds, Coinbase-style Luxury UX
 * ══════════════════════════════════════════════════════════════════════════
 */

const INR_RATE = 83.50; // 1 USD = 83.50 INR

function getCoinDisplayPair(coin) {
  if (!coin) return '';
  if (coin.id === 'gold' || coin.symbol === 'XAU') return 'GOLD/USDT';
  return coin.pair;
}

const COINS = [
  {
    "id": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "pair": "BTC/USDT",
    "icon": "icons/btc.png",
    "binanceSym": "BTCUSDT",
    "category": "futures",
    "maxLev": 150,
    "price": 80418.01,
    "change": -0.45,
    "high": 80951.57,
    "low": 79368.67,
    "vol": "1.1B",
    "tvSymbol": "BINANCE:BTCUSDT",
    "open": 80782,
    "change24h": -0.45
  },
  {
    "id": "ethereum",
    "symbol": "ETH",
    "name": "Ethereum",
    "pair": "ETH/USDT",
    "icon": "icons/eth.png",
    "binanceSym": "ETHUSDT",
    "category": "futures",
    "maxLev": 150,
    "price": 2326.16,
    "change": -0.83,
    "high": 2365.4,
    "low": 2293.09,
    "vol": "415.0M",
    "tvSymbol": "BINANCE:ETHUSDT",
    "open": 2345.74,
    "change24h": -0.83
  },
  {
    "id": "gold",
    "symbol": "XAU",
    "name": "Gold Spot",
    "pair": "XAU/USD",
    "icon": "gold_spot.svg",
    "binanceSym": "PAXGUSDT",
    "tvSymbol": "TVC:GOLD",
    "category": "futures",
    "maxLev": 100,
    "price": 4022.74,
    "open": 3992.6,
    "change": 0.68,
    "high": 4026.74,
    "low": 3977.93,
    "vol": "8.5M",
    "change24h": 0.68
  },
  {
    "id": "solana",
    "symbol": "SOL",
    "name": "Solana",
    "pair": "SOL/USDT",
    "icon": "icons/sol.png",
    "binanceSym": "SOLUSDT",
    "category": "l1",
    "maxLev": 100,
    "price": 102.11,
    "change": 0.44,
    "high": 102.27,
    "low": 99.88,
    "vol": "138.1M",
    "tvSymbol": "BINANCE:SOLUSDT",
    "open": 101.66,
    "change24h": 0.44
  },
  {
    "id": "ripple",
    "symbol": "XRP",
    "name": "XRP",
    "pair": "XRP/USDT",
    "icon": "icons/xrp.png",
    "binanceSym": "XRPUSDT",
    "category": "l1",
    "maxLev": 100,
    "price": 1.3,
    "change": 0.01,
    "high": 1.31,
    "low": 1.27,
    "vol": "96.2M",
    "tvSymbol": "BINANCE:XRPUSDT",
    "open": 1.3,
    "change24h": 0.01
  },
  {
    "id": "binancecoin",
    "symbol": "BNB",
    "name": "BNB",
    "pair": "BNB/USDT",
    "icon": "icons/bnb.png",
    "binanceSym": "BNBUSDT",
    "category": "l1",
    "maxLev": 100,
    "price": 745.15,
    "change": 0.39,
    "high": 746.07,
    "low": 732.45,
    "vol": "65.6M",
    "tvSymbol": "BINANCE:BNBUSDT",
    "open": 742.23,
    "change24h": 0.39
  },
  {
    "id": "dogecoin",
    "symbol": "DOGE",
    "name": "Dogecoin",
    "pair": "DOGE/USDT",
    "icon": "icons/doge.png",
    "binanceSym": "DOGEUSDT",
    "category": "meme",
    "maxLev": 75,
    "price": 0.0778,
    "change": 0.69,
    "high": 0.0779,
    "low": 0.076,
    "vol": "24.6M",
    "tvSymbol": "BINANCE:DOGEUSDT",
    "open": 0.0773,
    "change24h": 0.69
  },
  {
    "id": "cardano",
    "symbol": "ADA",
    "name": "Cardano",
    "pair": "ADA/USDT",
    "icon": "icons/ada.png",
    "binanceSym": "ADAUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.2066,
    "change": 0.63,
    "high": 0.2071,
    "low": 0.2005,
    "vol": "12.9M",
    "tvSymbol": "BINANCE:ADAUSDT",
    "open": 0.2053,
    "change24h": 0.63
  },
  {
    "id": "avalanche-2",
    "symbol": "AVAX",
    "name": "Avalanche",
    "pair": "AVAX/USDT",
    "icon": "icons/avax.png",
    "binanceSym": "AVAXUSDT",
    "category": "l1",
    "maxLev": 75,
    "price": 9.01,
    "change": 1.12,
    "high": 9.02,
    "low": 8.77,
    "vol": "9.3M",
    "tvSymbol": "BINANCE:AVAXUSDT",
    "open": 8.91,
    "change24h": 1.12
  },
  {
    "id": "sui",
    "symbol": "SUI",
    "name": "Sui",
    "pair": "SUI/USDT",
    "icon": "icons/sui.png",
    "binanceSym": "SUIUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.9253,
    "change": 0.97,
    "high": 0.9343,
    "low": 0.9001,
    "vol": "33.4M",
    "tvSymbol": "BINANCE:SUIUSDT",
    "open": 0.9164,
    "change24h": 0.97
  },
  {
    "id": "near",
    "symbol": "NEAR",
    "name": "NEAR Protocol",
    "pair": "NEAR/USDT",
    "icon": "icons/near.png",
    "binanceSym": "NEARUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 4.64,
    "change": 2.88,
    "high": 4.7,
    "low": 4.43,
    "vol": "95.3M",
    "tvSymbol": "BINANCE:NEARUSDT",
    "open": 4.51,
    "change24h": 2.88
  },
  {
    "id": "aptos",
    "symbol": "APT",
    "name": "Aptos",
    "pair": "APT/USDT",
    "icon": "icons/apt.png",
    "binanceSym": "APTUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.7101,
    "change": 1.28,
    "high": 0.7136,
    "low": 0.6845,
    "vol": "4.5M",
    "tvSymbol": "BINANCE:APTUSDT",
    "open": 0.7011,
    "change24h": 1.28
  },
  {
    "id": "polkadot",
    "symbol": "DOT",
    "name": "Polkadot",
    "pair": "DOT/USDT",
    "icon": "icons/dot.png",
    "binanceSym": "DOTUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 1.03,
    "change": -0.48,
    "high": 1.05,
    "low": 1,
    "vol": "4.7M",
    "tvSymbol": "BINANCE:DOTUSDT",
    "open": 1.04,
    "change24h": -0.48
  },
  {
    "id": "tron",
    "symbol": "TRX",
    "name": "TRON",
    "pair": "TRX/USDT",
    "icon": "icons/trx.png",
    "binanceSym": "TRXUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.3311,
    "change": 0.61,
    "high": 0.3317,
    "low": 0.329,
    "vol": "23.3M",
    "tvSymbol": "BINANCE:TRXUSDT",
    "open": 0.3291,
    "change24h": 0.61
  },
  {
    "id": "the-open-network",
    "symbol": "TON",
    "name": "Toncoin",
    "pair": "TON/USDT",
    "icon": "icons/ton.png",
    "binanceSym": "TONUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 1.6,
    "change": 0.95,
    "high": 1.64,
    "low": 1.58,
    "vol": "7.7M",
    "tvSymbol": "BINANCE:TONUSDT",
    "open": 1.58,
    "change24h": 0.95
  },
  {
    "id": "filecoin",
    "symbol": "FIL",
    "name": "Filecoin",
    "pair": "FIL/USDT",
    "icon": "icons/fil.png",
    "binanceSym": "FILUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.926,
    "change": 0.29,
    "high": 0.9326,
    "low": 0.8974,
    "vol": "7.8M",
    "tvSymbol": "BINANCE:FILUSDT",
    "open": 0.9233,
    "change24h": 0.29
  },
  {
    "id": "internet-computer",
    "symbol": "ICP",
    "name": "Internet Computer",
    "pair": "ICP/USDT",
    "icon": "icons/icp.png",
    "binanceSym": "ICPUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 2.65,
    "change": 0.19,
    "high": 2.67,
    "low": 2.56,
    "vol": "5.2M",
    "tvSymbol": "BINANCE:ICPUSDT",
    "open": 2.64,
    "change24h": 0.19
  },
  {
    "id": "sei-network",
    "symbol": "SEI",
    "name": "Sei",
    "pair": "SEI/USDT",
    "icon": "icons/sei.png",
    "binanceSym": "SEIUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.0532,
    "change": 0.23,
    "high": 0.0537,
    "low": 0.0517,
    "vol": "2.8M",
    "tvSymbol": "BINANCE:SEIUSDT",
    "open": 0.0531,
    "change24h": 0.23
  },
  {
    "id": "celestia",
    "symbol": "TIA",
    "name": "Celestia",
    "pair": "TIA/USDT",
    "icon": "icons/tia.png",
    "binanceSym": "TIAUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.5415,
    "change": 2.07,
    "high": 0.5445,
    "low": 0.5182,
    "vol": "4.3M",
    "tvSymbol": "BINANCE:TIAUSDT",
    "open": 0.5305,
    "change24h": 2.07
  },
  {
    "id": "algorand",
    "symbol": "ALGO",
    "name": "Algorand",
    "pair": "ALGO/USDT",
    "icon": "icons/algo.png",
    "binanceSym": "ALGOUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.1051,
    "change": 0.86,
    "high": 0.1067,
    "low": 0.1028,
    "vol": "1.6M",
    "tvSymbol": "BINANCE:ALGOUSDT",
    "open": 0.1042,
    "change24h": 0.86
  },
  {
    "id": "hedera-hashgraph",
    "symbol": "HBAR",
    "name": "Hedera",
    "pair": "HBAR/USDT",
    "icon": "icons/hbar.png",
    "binanceSym": "HBARUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.0777,
    "change": 0.81,
    "high": 0.0782,
    "low": 0.0763,
    "vol": "5.2M",
    "tvSymbol": "BINANCE:HBARUSDT",
    "open": 0.0771,
    "change24h": 0.81
  },
  {
    "id": "cosmos",
    "symbol": "ATOM",
    "name": "Cosmos Hub",
    "pair": "ATOM/USDT",
    "icon": "icons/atom.png",
    "binanceSym": "ATOMUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 1.66,
    "change": 1.78,
    "high": 1.66,
    "low": 1.61,
    "vol": "1.6M",
    "tvSymbol": "BINANCE:ATOMUSDT",
    "open": 1.63,
    "change24h": 1.78
  },
  {
    "id": "stellar",
    "symbol": "XLM",
    "name": "Stellar",
    "pair": "XLM/USDT",
    "icon": "icons/xlm.png",
    "binanceSym": "XLMUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.1701,
    "change": 0.35,
    "high": 0.1706,
    "low": 0.1666,
    "vol": "7.1M",
    "tvSymbol": "BINANCE:XLMUSDT",
    "open": 0.1695,
    "change24h": 0.35
  },
  {
    "id": "fantom",
    "symbol": "FTM",
    "name": "Fantom",
    "pair": "FTM/USDT",
    "icon": "icons/ftm.png",
    "binanceSym": "FTMUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.6994,
    "change": -0.77,
    "high": 0.7111,
    "low": 0.69,
    "vol": "1.3M",
    "tvSymbol": "BINANCE:FTMUSDT",
    "open": 0.7048,
    "change24h": -0.77
  },
  {
    "id": "vechain",
    "symbol": "VET",
    "name": "VeChain",
    "pair": "VET/USDT",
    "icon": "icons/vet.png",
    "binanceSym": "VETUSDT",
    "category": "l1",
    "maxLev": 50,
    "price": 0.006647,
    "change": -1.89,
    "high": 0.006954,
    "low": 0.00632,
    "vol": "1.8M",
    "tvSymbol": "BINANCE:VETUSDT",
    "open": 0.006775,
    "change24h": -1.89
  },
  {
    "id": "litecoin",
    "symbol": "LTC",
    "name": "Litecoin",
    "pair": "LTC/USDT",
    "icon": "icons/ltc.png",
    "binanceSym": "LTCUSDT",
    "category": "spot",
    "maxLev": 50,
    "price": 57.13,
    "change": 0.62,
    "high": 57.34,
    "low": 56.01,
    "vol": "10.3M",
    "tvSymbol": "BINANCE:LTCUSDT",
    "open": 56.78,
    "change24h": 0.62
  },
  {
    "id": "bitcoin-cash",
    "symbol": "BCH",
    "name": "Bitcoin Cash",
    "pair": "BCH/USDT",
    "icon": "icons/bch.png",
    "binanceSym": "BCHUSDT",
    "category": "spot",
    "maxLev": 50,
    "price": 277.7,
    "change": 0.98,
    "high": 284.7,
    "low": 273.9,
    "vol": "6.8M",
    "tvSymbol": "BINANCE:BCHUSDT",
    "open": 275,
    "change24h": 0.98
  },
  {
    "id": "ethereum-classic",
    "symbol": "ETC",
    "name": "Ethereum Classic",
    "pair": "ETC/USDT",
    "icon": "icons/etc.png",
    "binanceSym": "ETCUSDT",
    "category": "spot",
    "maxLev": 50,
    "price": 7.62,
    "change": 1.06,
    "high": 7.63,
    "low": 7.39,
    "vol": "2.1M",
    "tvSymbol": "BINANCE:ETCUSDT",
    "open": 7.54,
    "change24h": 1.06
  },
  {
    "id": "uniswap",
    "symbol": "UNI",
    "name": "Uniswap",
    "pair": "UNI/USDT",
    "icon": "icons/uni.png",
    "binanceSym": "UNIUSDT",
    "category": "defi",
    "maxLev": 75,
    "price": 7.1,
    "change": 4.16,
    "high": 7.14,
    "low": 6.78,
    "vol": "25.5M",
    "tvSymbol": "BINANCE:UNIUSDT",
    "open": 6.82,
    "change24h": 4.16
  },
  {
    "id": "chainlink",
    "symbol": "LINK",
    "name": "Chainlink",
    "pair": "LINK/USDT",
    "icon": "icons/link.png",
    "binanceSym": "LINKUSDT",
    "category": "defi",
    "maxLev": 75,
    "price": 11.55,
    "change": 1.05,
    "high": 11.59,
    "low": 11.27,
    "vol": "15.1M",
    "tvSymbol": "BINANCE:LINKUSDT",
    "open": 11.43,
    "change24h": 1.05
  },
  {
    "id": "aave",
    "symbol": "AAVE",
    "name": "Aave",
    "pair": "AAVE/USDT",
    "icon": "icons/aave.png",
    "binanceSym": "AAVEUSDT",
    "category": "defi",
    "maxLev": 75,
    "price": 137.88,
    "change": 1,
    "high": 139.02,
    "low": 133.61,
    "vol": "13.2M",
    "tvSymbol": "BINANCE:AAVEUSDT",
    "open": 136.51,
    "change24h": 1
  },
  {
    "id": "maker",
    "symbol": "MKR",
    "name": "Maker",
    "pair": "MKR/USDT",
    "icon": "icons/mkr.png",
    "binanceSym": "MKRUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 1813.7,
    "change": 0.76,
    "high": 1830,
    "low": 1780.6,
    "vol": "0.4M",
    "tvSymbol": "BINANCE:MKRUSDT",
    "open": 1800,
    "change24h": 0.76
  },
  {
    "id": "curve-dao-token",
    "symbol": "CRV",
    "name": "Curve DAO",
    "pair": "CRV/USDT",
    "icon": "icons/crv.png",
    "binanceSym": "CRVUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.3516,
    "change": 2,
    "high": 0.3547,
    "low": 0.3368,
    "vol": "3.7M",
    "tvSymbol": "BINANCE:CRVUSDT",
    "open": 0.3447,
    "change24h": 2
  },
  {
    "id": "lido-dao",
    "symbol": "LDO",
    "name": "Lido DAO",
    "pair": "LDO/USDT",
    "icon": "icons/ldo.png",
    "binanceSym": "LDOUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.3761,
    "change": 2.54,
    "high": 0.3765,
    "low": 0.3591,
    "vol": "1.8M",
    "tvSymbol": "BINANCE:LDOUSDT",
    "open": 0.3668,
    "change24h": 2.54
  },
  {
    "id": "pendle",
    "symbol": "PENDLE",
    "name": "Pendle",
    "pair": "PENDLE/USDT",
    "icon": "icons/pendle.png",
    "binanceSym": "PENDLEUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 1.98,
    "change": 0,
    "high": 2,
    "low": 1.91,
    "vol": "2.2M",
    "tvSymbol": "BINANCE:PENDLEUSDT",
    "open": 1.98,
    "change24h": 0
  },
  {
    "id": "injective-protocol",
    "symbol": "INJ",
    "name": "Injective",
    "pair": "INJ/USDT",
    "icon": "icons/inj.png",
    "binanceSym": "INJUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 7.95,
    "change": 3.3,
    "high": 8.16,
    "low": 7.53,
    "vol": "11.2M",
    "tvSymbol": "BINANCE:INJUSDT",
    "open": 7.7,
    "change24h": 3.3
  },
  {
    "id": "jupiter-exchange-solana",
    "symbol": "JUP",
    "name": "Jupiter",
    "pair": "JUP/USDT",
    "icon": "icons/jup.png",
    "binanceSym": "JUPUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.2837,
    "change": -0.42,
    "high": 0.2876,
    "low": 0.2739,
    "vol": "1.9M",
    "tvSymbol": "BINANCE:JUPUSDT",
    "open": 0.2849,
    "change24h": -0.42
  },
  {
    "id": "thorchain",
    "symbol": "RUNE",
    "name": "THORChain",
    "pair": "RUNE/USDT",
    "icon": "icons/rune.png",
    "binanceSym": "RUNEUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.637,
    "change": 1.43,
    "high": 0.637,
    "low": 0.618,
    "vol": "1.5M",
    "tvSymbol": "BINANCE:RUNEUSDT",
    "open": 0.628,
    "change24h": 1.43
  },
  {
    "id": "havven",
    "symbol": "SNX",
    "name": "Synthetix",
    "pair": "SNX/USDT",
    "icon": "icons/snx.png",
    "binanceSym": "SNXUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.1988,
    "change": 1.17,
    "high": 0.199,
    "low": 0.1934,
    "vol": "0.2M",
    "tvSymbol": "BINANCE:SNXUSDT",
    "open": 0.1965,
    "change24h": 1.17
  },
  {
    "id": "dydx-chain",
    "symbol": "DYDX",
    "name": "dYdX",
    "pair": "DYDX/USDT",
    "icon": "icons/dydx.png",
    "binanceSym": "DYDXUSDT",
    "category": "defi",
    "maxLev": 50,
    "price": 0.109,
    "change": 2.64,
    "high": 0.1097,
    "low": 0.1056,
    "vol": "0.6M",
    "tvSymbol": "BINANCE:DYDXUSDT",
    "open": 0.1062,
    "change24h": 2.64
  },
  {
    "id": "arbitrum",
    "symbol": "ARB",
    "name": "Arbitrum",
    "pair": "ARB/USDT",
    "icon": "icons/arb.png",
    "binanceSym": "ARBUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.1718,
    "change": 2.2,
    "high": 0.1737,
    "low": 0.1655,
    "vol": "7.6M",
    "tvSymbol": "BINANCE:ARBUSDT",
    "open": 0.1681,
    "change24h": 2.2
  },
  {
    "id": "optimism",
    "symbol": "OP",
    "name": "Optimism",
    "pair": "OP/USDT",
    "icon": "icons/op.png",
    "binanceSym": "OPUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.1125,
    "change": 0.99,
    "high": 0.1128,
    "low": 0.1087,
    "vol": "2.5M",
    "tvSymbol": "BINANCE:OPUSDT",
    "open": 0.1114,
    "change24h": 0.99
  },
  {
    "id": "polygon-ecosystem-token",
    "symbol": "POL",
    "name": "Polygon Ecosystem",
    "pair": "POL/USDT",
    "icon": "icons/pol.png",
    "binanceSym": "POLUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.0911,
    "change": 2.68,
    "high": 0.0914,
    "low": 0.088,
    "vol": "2.7M",
    "tvSymbol": "BINANCE:POLUSDT",
    "open": 0.0887,
    "change24h": 2.68
  },
  {
    "id": "starknet",
    "symbol": "STRK",
    "name": "Starknet",
    "pair": "STRK/USDT",
    "icon": "icons/strk.png",
    "binanceSym": "STRKUSDT",
    "category": "l2",
    "maxLev": 50,
    "price": 0.0458,
    "change": 0.84,
    "high": 0.0464,
    "low": 0.0442,
    "vol": "4.7M",
    "tvSymbol": "BINANCE:STRKUSDT",
    "open": 0.0454,
    "change24h": 0.84
  },
  {
    "id": "shiba-inu",
    "symbol": "SHIB",
    "name": "Shiba Inu",
    "pair": "SHIB/USDT",
    "icon": "icons/shib.png",
    "binanceSym": "SHIBUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00000489,
    "change": 0.2,
    "high": 0.00000491,
    "low": 0.00000479,
    "vol": "2.0M",
    "tvSymbol": "BINANCE:SHIBUSDT",
    "open": 0.00000488,
    "change24h": 0.2
  },
  {
    "id": "pepe",
    "symbol": "PEPE",
    "name": "Pepe",
    "pair": "PEPE/USDT",
    "icon": "icons/pepe.png",
    "binanceSym": "PEPEUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00000437,
    "change": -1.13,
    "high": 0.00000447,
    "low": 0.00000421,
    "vol": "24.8M",
    "tvSymbol": "BINANCE:PEPEUSDT",
    "open": 0.00000442,
    "change24h": -1.13
  },
  {
    "id": "dogwifcoin",
    "symbol": "WIF",
    "name": "dogwifhat",
    "pair": "WIF/USDT",
    "icon": "icons/wif.png",
    "binanceSym": "WIFUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.1818,
    "change": 1,
    "high": 0.1822,
    "low": 0.1755,
    "vol": "1.1M",
    "tvSymbol": "BINANCE:WIFUSDT",
    "open": 0.18,
    "change24h": 1
  },
  {
    "id": "bonk",
    "symbol": "BONK",
    "name": "Bonk",
    "pair": "BONK/USDT",
    "icon": "icons/bonk.png",
    "binanceSym": "BONKUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00000304,
    "change": 0,
    "high": 0.00000306,
    "low": 0.00000295,
    "vol": "1.7M",
    "tvSymbol": "BINANCE:BONKUSDT",
    "open": 0.00000304,
    "change24h": 0
  },
  {
    "id": "floki",
    "symbol": "FLOKI",
    "name": "Floki",
    "pair": "FLOKI/USDT",
    "icon": "icons/floki.png",
    "binanceSym": "FLOKIUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00002308,
    "change": 0.17,
    "high": 0.00002322,
    "low": 0.00002252,
    "vol": "0.8M",
    "tvSymbol": "BINANCE:FLOKIUSDT",
    "open": 0.00002304,
    "change24h": 0.17
  },
  {
    "id": "book-of-meme",
    "symbol": "BOME",
    "name": "BOOK OF MEME",
    "pair": "BOME/USDT",
    "icon": "icons/bome.png",
    "binanceSym": "BOMEUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.000635,
    "change": 1.62,
    "high": 0.000656,
    "low": 0.000602,
    "vol": "1.2M",
    "tvSymbol": "BINANCE:BOMEUSDT",
    "open": 0.000625,
    "change24h": 1.62
  },
  {
    "id": "memecoin",
    "symbol": "MEME",
    "name": "Memecoin",
    "pair": "MEME/USDT",
    "icon": "icons/meme.png",
    "binanceSym": "MEMEUSDT",
    "category": "meme",
    "maxLev": 50,
    "price": 0.00047,
    "change": 0.64,
    "high": 0.000471,
    "low": 0.000456,
    "vol": "0.3M",
    "tvSymbol": "BINANCE:MEMEUSDT",
    "open": 0.000467,
    "change24h": 0.64
  },
  {
    "id": "render-token",
    "symbol": "RENDER",
    "name": "Render",
    "pair": "RENDER/USDT",
    "icon": "icons/render.png",
    "binanceSym": "RENDERUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 1.75,
    "change": 2.99,
    "high": 1.77,
    "low": 1.68,
    "vol": "2.5M",
    "tvSymbol": "BINANCE:RENDERUSDT",
    "open": 1.7,
    "change24h": 2.99
  },
  {
    "id": "fetch-ai",
    "symbol": "FET",
    "name": "Artificial Superintelligence",
    "pair": "FET/USDT",
    "icon": "icons/fet.png",
    "binanceSym": "FETUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 0.1778,
    "change": 1.43,
    "high": 0.1783,
    "low": 0.1715,
    "vol": "6.2M",
    "tvSymbol": "BINANCE:FETUSDT",
    "open": 0.1753,
    "change24h": 1.43
  },
  {
    "id": "bittensor",
    "symbol": "TAO",
    "name": "Bittensor",
    "pair": "TAO/USDT",
    "icon": "icons/tao.png",
    "binanceSym": "TAOUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 255,
    "change": 1.47,
    "high": 255.4,
    "low": 247.3,
    "vol": "11.3M",
    "tvSymbol": "BINANCE:TAOUSDT",
    "open": 251.3,
    "change24h": 1.47
  },
  {
    "id": "worldcoin-wld",
    "symbol": "WLD",
    "name": "Worldcoin",
    "pair": "WLD/USDT",
    "icon": "icons/wld.png",
    "binanceSym": "WLDUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 0.4481,
    "change": -1.56,
    "high": 0.4648,
    "low": 0.4346,
    "vol": "27.7M",
    "tvSymbol": "BINANCE:WLDUSDT",
    "open": 0.4552,
    "change24h": -1.56
  },
  {
    "id": "the-graph",
    "symbol": "GRT",
    "name": "The Graph",
    "pair": "GRT/USDT",
    "icon": "icons/grt.png",
    "binanceSym": "GRTUSDT",
    "category": "ai",
    "maxLev": 50,
    "price": 0.0224,
    "change": -0.71,
    "high": 0.0229,
    "low": 0.0219,
    "vol": "0.6M",
    "tvSymbol": "BINANCE:GRTUSDT",
    "open": 0.0226,
    "change24h": -0.71
  }
];

// ─── 2. PERSISTENT STATE ─────────────────────────────────────────────────
const WALLET_STORAGE_KEY = 'vtrade_paper_wallet_v3';

function loadWalletState() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      if (state && Array.isArray(state.positions)) {
        state.positions = state.positions.filter(p => !(p.entryPrice === 82296.78 || p.id === 1729340000000));
      }
      return state;
    }
  } catch (e) {
    console.warn('Failed to load wallet state, initializing fresh:', e);
  }
  return {
    cashBalance: 10000.00, // $10,000 USD cash
    positions: [],
    orders: [],
    tradesHistory: [],
    balanceVisible: true,
    currency: 'USD'
  };
}

let walletState = loadWalletState();

let hasSyncedWithCloudOnce = false;

function saveWalletState() {
  try {
    walletState.lastUpdated = Date.now();
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletState));

    // Debounced background sync to Cloud Database
    const sess = getAuthSession();
    if (sess && sess.email && !sess.isGuest) {
      // CRITICAL: Never push default/unverified local wallet to cloud database until we've pulled cloud state once!
      // This protects users from having their cloud account balance overwritten by default $10,000 on fresh install / login
      if (!hasSyncedWithCloudOnce) {
        return;
      }
      fetch(getApiEndpoint('/api/wallet/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sess.email,
          cashBalance: walletState.cashBalance,
          positions: walletState.positions || [],
          orders: walletState.orders || [],
          tradesHistory: walletState.tradesHistory || [],
          updatedAt: walletState.lastUpdated
        })
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to save wallet state:', e);
  }
  syncDesktopHeaderState();
}

let isSyncingWallet = false;

async function pushWalletToCloud(email) {
  const ctl = new AbortController();
  const tmr = setTimeout(() => ctl.abort(), 4000);
  try {
    await fetch(getApiEndpoint('/api/wallet/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        cashBalance: walletState.cashBalance,
        positions: walletState.positions || [],
        orders: walletState.orders || [],
        tradesHistory: walletState.tradesHistory || [],
        updatedAt: walletState.lastUpdated || Date.now()
      }),
      signal: ctl.signal
    });
  } catch (e) {
  } finally {
    clearTimeout(tmr);
  }
}

function applyCloudWallet(cloud) {
  if (!cloud || typeof cloud.cashBalance !== 'number') return;
  walletState.cashBalance = cloud.cashBalance;
  if (Array.isArray(cloud.positions)) {
    walletState.positions = cloud.positions.filter(p => !(p.entryPrice === 82296.78 || p.id === 1729340000000));
  }
  if (Array.isArray(cloud.orders)) walletState.orders = cloud.orders;
  if (Array.isArray(cloud.tradesHistory)) walletState.tradesHistory = cloud.tradesHistory;
  walletState.lastUpdated = cloud.updatedAt || Date.now();
  try { localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletState)); } catch (e) {}

  // Explicitly trigger positions & orders renderers
  if (typeof renderPositions === 'function') renderPositions();
  if (typeof renderOrders === 'function') renderOrders();
  if (typeof renderHomeBalanceCard === 'function') renderHomeBalanceCard();
  if (typeof renderPortfolioScreen === 'function') renderPortfolioScreen();
  if (typeof renderAccountScreen === 'function') renderAccountScreen();
  if (typeof renderTradeBottomLedger === 'function') renderTradeBottomLedger();
  if (typeof syncDesktopHeaderState === 'function') syncDesktopHeaderState();
}

async function syncWalletWithCloud(forcePush = false) {
  if (isSyncingWallet) return;
  const sess = getAuthSession();
  if (!sess || !sess.email || sess.isGuest) return;
  const email = sess.email.toLowerCase();

  isSyncingWallet = true;
  try {
    const isApk = isNativePlatform();
    const localUpdatedAt = walletState.lastUpdated || 0;
    const hasCustomLocalData = walletState && (
      walletState.cashBalance !== 10000 ||
      (walletState.positions && walletState.positions.length > 0) ||
      (walletState.tradesHistory && walletState.tradesHistory.length > 0)
    );

    if (forcePush) {
      await pushWalletToCloud(email);
      hasSyncedWithCloudOnce = true;
      return;
    }

    // Fetch latest cloud state
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 4000);
    const resp = await fetch(getApiEndpoint(`/api/wallet/sync?email=${encodeURIComponent(email)}`), {
      signal: ctl.signal
    });
    clearTimeout(tmr);

    if (resp.ok) {
      const cloud = await resp.json();
      const cloudUpdatedAt = cloud.updatedAt || 0;

      // Case 0: First sync after boot/reinstall/login -> ALWAYS pull cloud if it exists!
      if (!hasSyncedWithCloudOnce && cloud.exists) {
        applyCloudWallet(cloud);
      }
      // Case 1: If cloud has active open positions and local has none, ALWAYS PULL CLOUD!
      else if (cloud.exists && cloud.positions && cloud.positions.length > 0 && (!walletState.positions || walletState.positions.length === 0)) {
        applyCloudWallet(cloud);
      }
      // Case 2: If cloud has different number of positions
      else if (cloud.exists && cloud.positions && walletState.positions && cloud.positions.length !== walletState.positions.length) {
        if (cloudUpdatedAt >= localUpdatedAt || cloud.positions.length > walletState.positions.length) {
          applyCloudWallet(cloud);
        } else {
          await pushWalletToCloud(email);
        }
      }
      // Case 3: Cloud has newer timestamp than local -> Pull cloud!
      else if (cloud.exists && cloudUpdatedAt > localUpdatedAt) {
        applyCloudWallet(cloud);
      }
      // Case 4: Local was updated more recently due to a local user trade
      else if (localUpdatedAt > cloudUpdatedAt && hasCustomLocalData) {
        await pushWalletToCloud(email);
      }
      // Case 5: Any balance or state mismatch fallback -> Pull cloud!
      else if (cloud.exists && cloud.cashBalance !== walletState.cashBalance) {
        applyCloudWallet(cloud);
      }
      hasSyncedWithCloudOnce = true;
    }
  } catch (err) {
  } finally {
    isSyncingWallet = false;
  }
}

async function triggerManualCloudWalletSync() {
  const sess = getAuthSession();
  if (!sess || !sess.email || sess.isGuest) {
    showToast('Please sign in to sync cloud portfolio', 'warning');
    openAuthModal('login');
    return;
  }
  const syncBtn = document.getElementById('acc-cloud-sync-btn');
  const syncStatus = document.getElementById('acc-cloud-sync-status');
  if (syncBtn) {
    syncBtn.textContent = 'Syncing...';
    syncBtn.style.opacity = '0.7';
  }
  if (syncStatus) syncStatus.textContent = 'Contacting Render Cloud...';

  try {
    await syncWalletWithCloud(false);
    if (syncBtn) {
      syncBtn.textContent = 'Synced ✓';
      syncBtn.style.opacity = '1';
    }
    const posCount = (walletState.positions && walletState.positions.length) || 0;
    if (syncStatus) syncStatus.textContent = `Synced at ${new Date().toLocaleTimeString()} ($${fmtMoney(walletState.cashBalance)} • ${posCount} pos)`;
    showToast(`Cloud Portfolio Synced! Balance: $${fmtMoney(walletState.cashBalance)} (${posCount} Open Position${posCount === 1 ? '' : 's'})`, 'success');
    setTimeout(() => {
      if (syncBtn) syncBtn.textContent = 'Sync Now';
    }, 3000);
  } catch (err) {
    if (syncBtn) syncBtn.textContent = 'Retry';
    if (syncStatus) syncStatus.textContent = 'Sync failed. Check connection.';
    showToast('Portfolio sync failed: ' + (err.message || 'Network error'), 'error');
  }
}

// ─── 2.05 IN-APP OTA UPDATE ENGINE ─────────────────────────────────────────
const CURRENT_APP_VERSION = '3.0.0';
const CURRENT_VERSION_CODE = 21;
let latestUpdateInfo = null;

async function checkForAppUpdates(isManual = false) {
  try {
    const statusEl = document.getElementById('app-update-status');
    if (isManual && statusEl) {
      statusEl.textContent = 'Checking...';
    }

    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 4500);
    const resp = await fetch(getApiEndpoint('/api/version'), { signal: ctl.signal });
    clearTimeout(tmr);

    if (resp.ok) {
      const data = await resp.json();
      latestUpdateInfo = data;
      const isNewer = (data.latestVersionCode && data.latestVersionCode > CURRENT_VERSION_CODE) ||
                      (data.latestVersion && data.latestVersion !== CURRENT_APP_VERSION);

      if (isNewer) {
        if (statusEl) {
          statusEl.textContent = `New v${data.latestVersion} Available!`;
          statusEl.style.color = '#ffb700';
        }
        showUpdateModal(data);
      } else {
        if (statusEl) {
          statusEl.textContent = 'Up to Date ✓';
          statusEl.style.color = '#10b981';
        }
        if (isManual) {
          showToast(`You are on the latest version (v${CURRENT_APP_VERSION})!`, 'success');
        }
      }
    } else {
      if (isManual && statusEl) statusEl.textContent = 'Check Failed';
    }
  } catch (err) {
    const statusEl = document.getElementById('app-update-status');
    if (isManual && statusEl) statusEl.textContent = 'Network Error';
  }
}

function showUpdateModal(info) {
  const modal = document.getElementById('vtrade-update-modal');
  if (!modal) return;
  const verEl = document.getElementById('update-new-version');
  const descEl = document.getElementById('update-changelog-desc');
  const laterBtn = document.getElementById('update-later-btn');

  if (verEl) verEl.textContent = `Version v${info.latestVersion || '2.9'}`;
  if (descEl) descEl.textContent = info.changelog || 'Performance improvements and bug fixes.';
  if (laterBtn && info.forceUpdate) laterBtn.style.display = 'none';

  modal.classList.remove('hidden');
}

function dismissUpdateModal() {
  const modal = document.getElementById('vtrade-update-modal');
  if (modal) modal.classList.add('hidden');
}

function startAppUpdateDownload() {
  const url = (latestUpdateInfo && latestUpdateInfo.downloadUrl) || getApiEndpoint('/vtrade.apk');
  showToast('Downloading update...', 'info');

  if (typeof window !== 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VTrade.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  dismissUpdateModal();
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
    const drawerEl = document.getElementById(`drawer-theme-${t}`);
    if (drawerEl) drawerEl.classList.toggle('active', t === themeName);
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
    const drawerEl = document.getElementById(`drawer-theme-${t}`);
    if (drawerEl) drawerEl.classList.toggle('active', t === saved);
  });
}

// ─── 2.3 LUXURY AUTHENTICATION & IN-APP DATABASE ENGINE (RASTA 1) ─────────
const AUTH_SESSION_KEY = 'vtrade_auth_session_v3';
const USER_DB_STORAGE_KEY = 'vtrade_users_master_db_v5';

// Clean initial database users (only testtrader for automated testing suites)
const SEED_DATABASE_USERS = [
  { id: 1, username: 'testtrader', email: 'test@example.com', password: 'password123', balance: 10000 },
  { id: 2, username: 'trader2', email: 'trader2@test.com', password: 'password123', balance: 10000 }
];

function isNativePlatform() {
  try {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      return true;
    }
    if (typeof window !== 'undefined' && (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:')) {
      return true;
    }
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) && !window.location.port) {
      return true;
    }
  } catch (e) {}
  return false;
}

const CLOUD_API_BASE = 'https://vtrade-crypto.onrender.com';

function getApiEndpoint(path) {
  if (typeof window !== 'undefined') {
    if (isNativePlatform() || window.location.protocol === 'capacitor:' || window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
      return CLOUD_API_BASE + path;
    }
  }
  return path;
}

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

function clearAuthAlert() {
  const alertEl = document.getElementById('auth-inline-alert');
  if (alertEl) {
    alertEl.textContent = '';
    alertEl.className = 'auth-inline-alert hidden';
  }
}

function showAuthAlert(msg, type = 'error') {
  const alertEl = document.getElementById('auth-inline-alert');
  if (alertEl) {
    alertEl.textContent = msg;
    alertEl.className = `auth-inline-alert ${type}`;
    alertEl.classList.remove('hidden');
  }
}

function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('auth-modal-close-btn');
  if (!modal) return;
  clearAuthAlert();
  switchAuthTab(defaultTab);
  modal.classList.remove('hidden');

  if (closeBtn) closeBtn.classList.remove('hidden');
}

function closeAuthModal() {
  dismissAuthModal(true);
}

function dismissAuthModal(force = false) {
  const sess = getAuthSession();
  const isAuthed = !!(sess && !sess.isGuest && sess.email);
  if (!force && !isAuthed) {
    const card = document.querySelector('.auth-modal-card');
    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 450);
    }
    return;
  }
  clearAuthAlert();
  const modal = document.getElementById('auth-modal-overlay');
  if (modal) modal.classList.add('hidden');
}

function handleBackdropClick() {
  const sess = getAuthSession();
  if (!sess || sess.isGuest || !sess.email) {
    // Option B: No intrusive toast/alert popup; lightly animate modal card
    const card = document.querySelector('.auth-modal-card');
    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 450);
    }
    return;
  }
  dismissAuthModal(true);
}

function switchAuthTab(tab) {
  clearAuthAlert();
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

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId) || document.getElementById('auth-' + inputId) || document.getElementById(inputId.replace('auth-', ''));
  if (!input) return;
  const isPwd = input.type === 'password';
  input.type = isPwd ? 'text' : 'password';
  const targetBtn = btn || (input.parentElement ? input.parentElement.querySelector('.auth-pwd-toggle, .auth-eye-btn') : null);
  if (targetBtn) {
    targetBtn.textContent = isPwd ? '🙈' : '👁';
  }
}

function quickFillAuthModal(email, password) {
  const emailInput = document.getElementById('auth-login-email') || document.getElementById('login-email');
  const pwdInput = document.getElementById('auth-login-password') || document.getElementById('login-password');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = password;
  clearAuthAlert();
  showToast(`Loaded account for ${email}. Click "Sign In to Terminal"!`, 'info');
}

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USER_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const initial = [...SEED_DATABASE_USERS];
  try {
    localStorage.setItem(USER_DB_STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
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
    return userRecord;
  } catch (e) {
    console.error('Failed to save registered user:', e);
  }
}

async function handleForgotPassword(event) {
  if (event) event.preventDefault();
  const emailInput = document.getElementById('auth-login-email') || document.getElementById('login-email');
  const currentVal = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const emailPrompt = prompt('Enter your registered Email Address to reset password:', currentVal);
  if (!emailPrompt) return;

  const cleanEmail = emailPrompt.trim().toLowerCase();
  const dbUsers = getRegisteredUsers();
  let user = dbUsers.find(u => u.email.toLowerCase() === cleanEmail);

  // If not found in local storage (e.g. fresh reinstall), check cloud server
  let cloudAccountExists = false;
  if (!user) {
    try {
      const ctl = new AbortController();
      const tmr = setTimeout(() => ctl.abort(), 8000);
      const resp = await fetch(getApiEndpoint('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, checkOnly: true }),
        signal: ctl.signal
      });
      clearTimeout(tmr);
      if (resp.ok) {
        cloudAccountExists = true;
      } else if (resp.status === 404) {
        showAuthAlert('⚠️ Account is not registered. Please create an account first.', 'error');
        showToast('Account is not registered. Please create an account first.', 'error');
        switchAuthTab('register');
        const regEmail = document.getElementById('auth-register-email') || document.getElementById('register-email');
        if (regEmail) regEmail.value = cleanEmail;
        return;
      }
    } catch (e) {}
  }

  if (!user && !cloudAccountExists) {
    showAuthAlert('⚠️ Account is not registered. Please create an account first.', 'error');
    showToast('Account is not registered. Please create an account first.', 'error');
    switchAuthTab('register');
    const regEmail = document.getElementById('auth-register-email') || document.getElementById('register-email');
    if (regEmail) regEmail.value = cleanEmail;
    return;
  }

  const newPwd = prompt(`Enter new password for ${cleanEmail} (minimum 6 characters):`);
  if (!newPwd) return;
  if (newPwd.length < 6) {
    showAuthAlert('Password must be at least 6 characters long', 'error');
    showToast('Password must be at least 6 characters long', 'error');
    return;
  }

  // 1. Try cloud server password reset
  let cloudUpdated = false;
  try {
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 8000);
    const resp = await fetch(getApiEndpoint('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, newPassword: newPwd }),
      signal: ctl.signal
    });
    clearTimeout(tmr);
    if (resp.ok) {
      cloudUpdated = true;
    }
  } catch (err) {}

  if (user) {
    user.password = newPwd;
    saveRegisteredUser(user);
  } else {
    saveRegisteredUser({
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: newPwd,
      balance: 10000
    });
  }

  clearAuthAlert();
  showToast('Password reset successfully! Please sign in with your new password.', 'success');
  if (emailInput) emailInput.value = cleanEmail;
  const pwdInput = document.getElementById('auth-login-password') || document.getElementById('login-password');
  if (pwdInput) pwdInput.value = newPwd;
}

function handleForgotPasswordClick() {
  handleForgotPassword();
}

async function handleAuthLogin(event) {
  if (event) event.preventDefault();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (typeof updateNetworkStatus === 'function') updateNetworkStatus(false);
    showAuthAlert('Internet connection is required to sign in.', 'error');
    showToast('Internet connection is required to sign in. Please connect to internet.', 'error');
    return;
  }

  const emailInput = document.getElementById('auth-login-email') || document.getElementById('login-email');
  const pwdInput = document.getElementById('auth-login-password') || document.getElementById('login-password');
  const rememberBox = document.getElementById('auth-login-remember') || document.getElementById('login-remember');
  const loginBtn = document.getElementById('auth-login-submit') || document.querySelector('#auth-login-form button[type="submit"]') || document.getElementById('login-submit-btn');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!email || !password) {
    showAuthAlert('Please enter both email and password', 'error');
    showToast('Please enter both email and password', 'error');
    return;
  }

  // 1. In-App Persistent Database First Priority (Instant, reliable, standalone)
  const dbUsers = getRegisteredUsers();
  const registered = dbUsers.find(u => u.email.toLowerCase() === email);

  if (registered && registered.password === password) {
    // Password matched & user is verified!
    clearAuthAlert();
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
    if (typeof syncDesktopHeaderState === 'function') syncDesktopHeaderState();
    if (typeof renderDesktopAuthPage === 'function') renderDesktopAuthPage();
    if (typeof renderAllViews === 'function') renderAllViews();
    showToast(`Welcome back, ${registered.username}!`, 'success');
    syncWalletWithCloud(false);

    // Auto-sync this account to Render cloud database so it works on web too
    fetch(getApiEndpoint('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: registered.username, email: registered.email, password: registered.password })
    }).catch(() => {});
    return;
  }

  // 2. Cloud Server Sync Check (Enables accounts registered on Web or across reinstalls to log in instantly!)
  const originalBtnText = loginBtn ? loginBtn.innerHTML : '';
  if (loginBtn) {
    loginBtn.innerHTML = '<span>Signing in...</span>';
    loginBtn.disabled = true;
  }

  try {
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 15000); // 15-second timeout for cloud cold starts
    const resp = await fetch(getApiEndpoint('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: ctl.signal
    });
    clearTimeout(tmr);

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      clearAuthAlert();
      if (typeof data.balance === 'number') {
        walletState.cashBalance = data.balance;
      }
      saveRegisteredUser({
        username: data.username || email.split('@')[0],
        email: data.email || email,
        password: password,
        balance: (typeof data.balance === 'number') ? data.balance : 10000
      });
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
      if (typeof syncDesktopHeaderState === 'function') syncDesktopHeaderState();
      if (typeof renderDesktopAuthPage === 'function') renderDesktopAuthPage();
      if (typeof renderAllViews === 'function') renderAllViews();
      showToast(`Welcome back, ${sess.username}!`, 'success');
      await syncWalletWithCloud(false);
      return;
    } else if (resp.status === 401) {
      showAuthAlert('🔒 Incorrect password. Please try again.', 'error');
      showToast('Incorrect password. Please try again.', 'error');
      return;
    } else if (resp.status === 404) {
      if (registered) {
        // Exists locally with stale password, and not on cloud
        showAuthAlert('🔒 Incorrect password. Please try again.', 'error');
        showToast('Incorrect password. Please try again.', 'error');
        return;
      }
      // ONLY HTTP 404 means user is truly not registered in database
      showAuthAlert('⚠️ Account is not registered. Please create an account first.', 'error');
      showToast('Account is not registered. Please create an account first.', 'error');
      switchAuthTab('register');
      const regEmail = document.getElementById('auth-register-email') || document.getElementById('register-email');
      if (regEmail) regEmail.value = email;
      return;
    } else {
      const errData = await resp.json().catch(() => ({}));
      showAuthAlert(errData.error || 'Login failed. Please try again.', 'error');
      return;
    }
  } catch (err) {
    if (registered) {
      showAuthAlert('🔒 Incorrect password. Please try again.', 'error');
      showToast('Incorrect password. Please try again.', 'error');
      return;
    }
    if (err.name === 'AbortError') {
      showAuthAlert('⚠️ Server connection timed out. Please check your internet connection.', 'error');
      showToast('Connection timed out. Please try again.', 'error');
    } else {
      showAuthAlert('⚠️ Unable to connect to server. Please check your internet connection.', 'error');
      showToast('Unable to connect to server.', 'error');
    }
  } finally {
    if (loginBtn) {
      loginBtn.innerHTML = originalBtnText || '<span>Sign In to Trade</span><span class="auth-btn-arrow">→</span>';
      loginBtn.disabled = false;
    }
  }
}

async function handleAuthRegister(event) {
  if (event) event.preventDefault();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (typeof updateNetworkStatus === 'function') updateNetworkStatus(false);
    showAuthAlert('Internet connection is required to create an account.', 'error');
    showToast('Internet connection is required to create an account. Please connect to internet.', 'error');
    return;
  }

  const nameInput = document.getElementById('auth-register-username') || document.getElementById('register-name');
  const emailInput = document.getElementById('auth-register-email') || document.getElementById('register-email');
  const pwdInput = document.getElementById('auth-register-password') || document.getElementById('register-password');
  const regBtn = document.getElementById('auth-register-submit') || document.querySelector('#auth-register-form button[type="submit"]') || document.getElementById('register-submit-btn');

  const username = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!username || !email || !password) {
    showAuthAlert('Please fill in all registration fields', 'error');
    showToast('Please fill in all registration fields', 'error');
    return;
  }
  if (password.length < 6) {
    showAuthAlert('Password must be at least 6 characters', 'error');
    showToast('Password must be at least 6 characters long', 'error');
    return;
  }

  // 1. Check if user already exists in local in-app database
  const dbUsers = getRegisteredUsers();
  const exists = dbUsers.some(u => u.email.toLowerCase() === email);
  if (exists) {
    showAuthAlert('⚠️ Account already exists! Please Sign In.', 'error');
    showToast('Account already exists! Please Sign In.', 'error');
    switchAuthTab('login');
    const loginEmail = document.getElementById('auth-login-email') || document.getElementById('login-email');
    if (loginEmail) loginEmail.value = email;
    return;
  }

  const originalBtnText = regBtn ? regBtn.innerHTML : '';
  if (regBtn) {
    regBtn.innerHTML = '<span>Creating Account...</span>';
    regBtn.disabled = true;
  }

  try {
    // 2. Central Cloud Server Sync - MUST await and verify server database persistence!
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 15000);
    const resp = await fetch(getApiEndpoint('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
      signal: ctl.signal
    });
    clearTimeout(tmr);

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      clearAuthAlert();
      saveRegisteredUser({
        username: data.username || username,
        email: data.email || email,
        password: password,
        balance: (typeof data.balance === 'number') ? data.balance : 10000
      });
      const sess = {
        token: data.token || ('vtrade_auth_' + Date.now()),
        username: data.username || username,
        email: data.email || email,
        isGuest: false,
        loggedInAt: Date.now()
      };
      saveAuthSession(sess);
      userProfile.name = sess.username;
      userProfile.email = sess.email;
      saveUserProfile();
      dismissAuthModal(true);
      updateAccountAuthUI();
      renderAccountScreen();
      if (typeof syncDesktopHeaderState === 'function') syncDesktopHeaderState();
      if (typeof renderDesktopAuthPage === 'function') renderDesktopAuthPage();
      if (typeof renderAllViews === 'function') renderAllViews();
      showToast(`Account created! Welcome to VTrade, ${sess.username}!`, 'success');
      syncWalletWithCloud(true);
      return;
    } else {
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 400 && data.error && data.error.includes('already exists')) {
        showAuthAlert('⚠️ Account already exists! Please Sign In.', 'error');
        showToast('Account already exists! Please Sign In.', 'error');
        switchAuthTab('login');
        const loginEmail = document.getElementById('auth-login-email') || document.getElementById('login-email');
        if (loginEmail) loginEmail.value = email;
        return;
      }
      showAuthAlert(data.error || 'Registration failed. Please try again.', 'error');
      showToast(data.error || 'Registration failed.', 'error');
      return;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      showAuthAlert('⚠️ Server connection timed out. Please check your internet connection.', 'error');
      showToast('Connection timed out. Please try again.', 'error');
    } else {
      // Offline / Network fallback: allow local registration so offline standalone works
      clearAuthAlert();
      saveRegisteredUser({ username, email, password, balance: 10000 });
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
      if (typeof syncDesktopHeaderState === 'function') syncDesktopHeaderState();
      if (typeof renderDesktopAuthPage === 'function') renderDesktopAuthPage();
      if (typeof renderAllViews === 'function') renderAllViews();
      showToast(`Account created offline! Welcome to VTrade, ${username}!`, 'success');
    }
  } finally {
    if (regBtn) {
      regBtn.innerHTML = originalBtnText || '<span>Create Free Trading Account</span><span class="auth-btn-arrow">⚡</span>';
      regBtn.disabled = false;
    }
  }
}

function continueAsGuestTrader() {
  showToast('Guest trading is disabled. Please create an account or sign in.', 'warning');
  switchAuthTab('register');
}

function handleAccountAuthClick() {
  const sess = getAuthSession();
  if (sess && !sess.isGuest && sess.email) {
    if (confirm(`Currently signed in as ${sess.username} (${sess.email}). Do you want to sign out?`)) {
      const loggedOutEmail = sess.email;
      clearAuthSession();
      userProfile.name = 'Trader';
      userProfile.email = '';
      saveUserProfile();
      updateAccountAuthUI();
      renderAccountScreen();
      showToast('Signed out successfully', 'info');
      localStorage.setItem('vtrade_show_onboarding_on_relaunch', 'true');
      localStorage.removeItem('vtrade_onboarding_completed');
      clearAuthAlert();
      openAuthModal('login');
      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = loggedOutEmail;
      const pwdInput = document.getElementById('login-password');
      if (pwdInput) pwdInput.value = '';
    }
  } else {
    clearAuthAlert();
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
      liveTickerInterval = setInterval(fetchLiveBinanceTickers, 10000);
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
function persistSelectedCoinState() {
  if (!selectedCoin || !selectedCoin.id) return;
  try {
    localStorage.setItem('vtrade_selected_coin_state', JSON.stringify({
      id: selectedCoin.id,
      symbol: selectedCoin.symbol,
      price: selectedCoin.price,
      change: selectedCoin.change,
      change24h: selectedCoin.change24h,
      chartChange: selectedCoin.chartChange,
      candleOpen: selectedCoin.candleOpen,
      open24h: selectedCoin.open24h,
      high: selectedCoin.high,
      low: selectedCoin.low,
      vol: selectedCoin.vol,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

let activeTab = 'home';
let selectedCoin = (function() {
  try {
    const saved = localStorage.getItem('vtrade_selected_coin');
    const cachedStateRaw = localStorage.getItem('vtrade_selected_coin_state');
    let coin = null;
    if (saved && typeof COINS !== 'undefined') {
      coin = COINS.find(item => item.id === saved || item.symbol.toLowerCase() === saved.toLowerCase());
    }
    if (!coin && typeof COINS !== 'undefined' && COINS[0]) {
      coin = COINS[0];
    }
    if (coin && cachedStateRaw) {
      const cached = JSON.parse(cachedStateRaw);
      if (cached && (cached.id === coin.id || !saved || saved === coin.id)) {
        if (typeof cached.price === 'number' && cached.price > 0) coin.price = cached.price;
        if (typeof cached.change === 'number') coin.change = cached.change;
        if (typeof cached.change24h === 'number') coin.change24h = cached.change24h;
        if (typeof cached.chartChange === 'number') coin.chartChange = cached.chartChange;
        if (typeof cached.candleOpen === 'number' && cached.candleOpen > 0) coin.candleOpen = cached.candleOpen;
        if (typeof cached.open24h === 'number' && cached.open24h > 0) coin.open24h = cached.open24h;
        if (typeof cached.high === 'number' && cached.high > 0) coin.high = cached.high;
        if (typeof cached.low === 'number' && cached.low > 0) coin.low = cached.low;
        if (cached.vol) coin.vol = cached.vol;
      }
    }
    if (coin) return coin;
  } catch (e) {}
  return (typeof COINS !== 'undefined' && COINS[0]) ? COINS[0] : { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 80450 };
})();
let chartInterval = (function() {
  try {
    const saved = localStorage.getItem('vtrade_chart_interval');
    if (saved) return saved;
  } catch (e) {}
  return '1h';
})();
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

// ─── 6. CUSTOMIZABLE ACCOUNT BALANCE & REFILL CONTROLLER ─────────────────────
function openCustomBalanceModal() {
  const modal = document.getElementById('custom-balance-modal');
  const input = document.getElementById('cbm-amount-input');
  if (!modal) return;
  const currentAmt = (typeof walletState !== 'undefined' && walletState.cashBalance) ? walletState.cashBalance : 10000;
  if (input) {
    input.value = currentAmt;
  }
  setCustomBalancePresetActive(currentAmt);
  modal.classList.remove('hidden');
  setTimeout(() => { if (input) input.select(); }, 50);
}

function closeCustomBalanceModal() {
  const modal = document.getElementById('custom-balance-modal');
  if (modal) modal.classList.add('hidden');
}

function setCustomBalancePresetActive(amt) {
  const presets = [1000, 5000, 10000, 50000, 100000];
  const btns = document.querySelectorAll('.cbm-preset-btn');
  btns.forEach((btn, idx) => {
    btn.classList.toggle('active', presets[idx] === Number(amt));
  });
}

function setCustomBalanceInput(amt) {
  const input = document.getElementById('cbm-amount-input');
  if (input) {
    input.value = amt;
    input.focus();
  }
  setCustomBalancePresetActive(amt);
}

function applyCustomBalance() {
  const input = document.getElementById('cbm-amount-input');
  if (!input) return;
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) {
    showToast('Please enter a valid amount greater than 0', 'error');
    return;
  }
  if (typeof walletState !== 'undefined') {
    walletState.cashBalance = val;
    saveWalletState();
  }
  showToast(`🎉 Account balance set to ${getCurrencySymbol()}${fmtMoney(val)}!`, 'success');
  closeCustomBalanceModal();
  renderAllViews();
}

function refillPaperDemoBalance() {
  const customAmount = arguments[0];
  const amt = (typeof customAmount === 'number' && customAmount > 0) ? customAmount : 10000.00;
  if (typeof walletState !== 'undefined') {
    walletState.cashBalance = amt;
    saveWalletState();
  }
  showToast(`🎉 Balance updated to ${getCurrencySymbol()}${fmtMoney(amt)}!`, 'success');
  renderAllViews();
}

function clearTradeHistory() {
  walletState.tradesHistory = [];
  saveWalletState();
  renderPortfolioScreen();
  showToast('Trade ledger cleared', 'info');
}

// ─── 7. BOTTOM NAVIGATION CONTROLLER & ANIMATION ENGINE ─────────────────
function switchBottomTab(tab) {
  if (tab === 'account') {
    if (typeof openProfileDrawer === 'function') {
      openProfileDrawer();
    }
    return;
  }
  activeTab = tab || 'home';
  if (activeTab === 'vtrade') activeTab = 'trade';
  try {
    if (activeTab && activeTab !== 'account' && activeTab !== 'auth') {
      localStorage.setItem('vtrade_active_tab', activeTab);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + activeTab);
      } else if (typeof window !== 'undefined') {
        window.location.hash = '#' + activeTab;
      }
    }
  } catch (e) {}
  if (document.documentElement && typeof document.documentElement.removeAttribute === 'function') {
    document.documentElement.removeAttribute('data-initial-tab');
  }
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('trade-screen-active', activeTab === 'trade');
  }

  const tabs = ['home', 'markets', 'trade', 'portfolio', 'account', 'auth'];
  tabs.forEach(t => {
    const btn = document.getElementById(`vnav-${t}`);
    const dbtn = document.getElementById(`dnav-${t}`);
    const screen = document.getElementById(`screen-${t}`);
    const isTarget = t === activeTab;
    if (btn) btn.classList.toggle('active', isTarget);
    if (dbtn) dbtn.classList.toggle('active', isTarget);
    if (screen) {
      if (isTarget && !screen.classList.contains('active')) {
        screen.classList.add('entering');
        requestAnimationFrame(() => {
          setTimeout(() => screen.classList.remove('entering'), 30);
        });
      }
      screen.classList.toggle('active', isTarget);
    }
  });

  if (activeTab === 'home') {
    renderHomeScreen();
    if (typeof initHeroGlassBlockInteractions === 'function') initHeroGlassBlockInteractions();
  }
  else if (activeTab === 'markets') renderMarketsScreen();
  else if (activeTab === 'trade') renderTradeScreen();
  else if (activeTab === 'portfolio') renderPortfolioScreen();
  else if (activeTab === 'account') renderAccountScreen();
  else if (activeTab === 'auth') renderDesktopAuthPage();

  if (activeTab !== 'home' && typeof cleanUpGsapScrollAnimations === 'function') {
    cleanUpGsapScrollAnimations();
  }

  syncDesktopHeaderState();
  updateNavIndicator();
  if (typeof initScrollRevealEngine === 'function') initScrollRevealEngine();
  if (typeof initSpotlightAndTiltCards === 'function') initSpotlightAndTiltCards();
}

function updateNavIndicator() {
  const activeLink = document.querySelector('.desktop-header-nav .dnav-link.active');
  const indicator = document.getElementById('dnav-indicator-pill');
  const nav = document.getElementById('desktop-header-nav');
  if (!activeLink || !indicator || !nav) return;

  const linkRect = activeLink.getBoundingClientRect();
  const navRect = nav.getBoundingClientRect();
  const left = linkRect.left - navRect.left;
  const width = linkRect.width;

  if (width > 0) {
    indicator.style.left = `${left + 10}px`;
    indicator.style.width = `${Math.max(16, width - 20)}px`;
  }
}

function initHeroTextAnimation() {
  const headline = document.getElementById('lhs-headline');
  if (!headline) return;

  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const words = headline.querySelectorAll('.hero-word-wrap');

  if (words.length > 0) {
    words.forEach((w, idx) => {
      if (isReduced) {
        w.classList.add('revealed');
      } else {
        w.style.transitionDelay = `${idx * 65}ms`;
        requestAnimationFrame(() => {
          setTimeout(() => w.classList.add('revealed'), 50 + idx * 60);
        });
      }
    });
  }
}

// ══════════════════════ GSAP & SCROLLTRIGGER ANIMATION ENGINE ══════════════════════
let activeGsapTriggers = [];

function cleanUpGsapScrollAnimations() {
  if (typeof window === 'undefined') return;
  if (window.ScrollTrigger) {
    try {
      window.ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    } catch (err) {}
  }
  activeGsapTriggers = [];
}

function getActiveGsapScroller() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const homeScreen = document.getElementById('screen-home');
  if (!homeScreen) return window;
  if (window.innerWidth >= 1024) {
    return homeScreen;
  }
  const homeScroll = homeScreen.querySelector('.home-scroll-container');
  if (homeScroll && window.getComputedStyle(homeScroll).overflowY === 'auto') {
    return homeScroll;
  }
  return window;
}

let heroGlassRafId = null;
let heroGlassPointerActive = false;

function initHeroGlassBlockInteractions() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const heroBlock = document.getElementById('vtrade-hero-glass-block') || document.querySelector('.landing-hero-section');
  if (!heroBlock) return;

  if (heroBlock.dataset.heroGlassBound) return;
  heroBlock.dataset.heroGlassBound = 'true';

  const isFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // On touch devices or reduced motion, preserve native performance without continuous tracking
  if (!isFinePointer || isReducedMotion) return;

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;

  let currentTiltX = 0;
  let currentTiltY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;

  let spotlightOpacity = 0;
  let targetOpacity = 0;

  function updateHeroGlassFrame() {
    // 0.10 smooth LERP for fluid, non-jumping light follow
    currentX += (targetX - currentX) * 0.10;
    currentY += (targetY - currentY) * 0.10;
    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;
    spotlightOpacity += (targetOpacity - spotlightOpacity) * 0.08;

    heroBlock.style.setProperty('--hero-spotlight-x', `${currentX.toFixed(1)}px`);
    heroBlock.style.setProperty('--hero-spotlight-y', `${currentY.toFixed(1)}px`);
    heroBlock.style.setProperty('--hero-spotlight-opacity', spotlightOpacity.toFixed(3));

    // Subtle 3D Tilt (maximum ~2.2 degrees for optimal text contrast and readability)
    if (!isReducedMotion) {
      heroBlock.style.transform = `perspective(1100px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg) translateZ(0)`;
    }

    const isMoving = Math.abs(targetX - currentX) > 0.15 ||
                     Math.abs(targetY - currentY) > 0.15 ||
                     Math.abs(targetTiltX - currentTiltX) > 0.01 ||
                     Math.abs(targetTiltY - currentTiltY) > 0.01 ||
                     Math.abs(targetOpacity - spotlightOpacity) > 0.01;

    if (heroGlassPointerActive || isMoving) {
      heroGlassRafId = requestAnimationFrame(updateHeroGlassFrame);
    } else {
      heroGlassRafId = null;
      if (!heroGlassPointerActive) {
        heroBlock.style.transform = '';
      }
    }
  }

  function onPointerMove(e) {
    const rect = heroBlock.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    targetOpacity = 1;

    // Calculate restrained 3D tilt angles (-2.2deg to +2.2deg)
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    targetTiltX = ((targetY - cy) / cy) * -2.2;
    targetTiltY = ((targetX - cx) / cx) * 2.2;

    heroGlassPointerActive = true;
    if (!heroGlassRafId) {
      heroGlassRafId = requestAnimationFrame(updateHeroGlassFrame);
    }
  }

  function onPointerEnter(e) {
    heroGlassPointerActive = true;
    heroBlock.classList.add('hero-glass-hovered');
    onPointerMove(e);
  }

  function onPointerLeave() {
    heroGlassPointerActive = false;
    heroBlock.classList.remove('hero-glass-hovered');
    const rect = heroBlock.getBoundingClientRect();
    targetX = rect.width / 2;
    targetY = rect.height / 2;
    targetTiltX = 0;
    targetTiltY = 0;
    targetOpacity = 0;

    if (!heroGlassRafId) {
      heroGlassRafId = requestAnimationFrame(updateHeroGlassFrame);
    }
  }

  heroBlock.addEventListener('pointerenter', onPointerEnter);
  heroBlock.addEventListener('pointermove', onPointerMove);
  heroBlock.addEventListener('pointerleave', onPointerLeave);
}

function initHeroGsapTimeline() {
  if (typeof window === 'undefined' || !window.gsap) return;
  const heroSec = document.querySelector('.landing-hero-section');
  if (!heroSec || heroSec.dataset.gsapHeroDone) return;
  heroSec.dataset.gsapHeroDone = 'true';

  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) {
    const words = heroSec.querySelectorAll('.hero-word-wrap');
    words.forEach(w => w.classList.add('revealed'));
    return;
  }

  const tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
  const badge = heroSec.querySelector('.lhs-badge');
  const words = heroSec.querySelectorAll('.hero-word-wrap');
  const subtext = heroSec.querySelector('.lhs-subtext');
  const ctas = heroSec.querySelectorAll('.lhs-cta-row > *');
  const metrics = heroSec.querySelectorAll('.lhs-m-item');

  if (badge) tl.fromTo(badge, { opacity: 0, y: -16, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.55 });
  if (words.length > 0) {
    words.forEach(w => w.classList.add('revealed'));
    tl.fromTo(words, { opacity: 0, y: 22, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, stagger: 0.05 }, '-=0.25');
  }
  if (subtext) tl.fromTo(subtext, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55 }, '-=0.35');
  if (ctas.length > 0) tl.fromTo(ctas, { opacity: 0, y: 16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.3)' }, '-=0.3');
  if (metrics.length > 0) tl.fromTo(metrics, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 }, '-=0.25');
}

function animateSpotlightBentoCards() {
  if (typeof window === 'undefined' || !window.gsap) return;
  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bentoGrid = document.getElementById('home-spotlight-bento');
  if (!bentoGrid) return;
  const cards = bentoGrid.querySelectorAll('.bento-card');
  if (cards.length === 0) return;

  if (isReduced) {
    cards.forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
    return;
  }

  window.gsap.fromTo(cards,
    { opacity: 0, y: 28, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' }
  );
}

function initGsapScrollTriggerAnimations() {
  if (typeof window === 'undefined' || !window.gsap || !window.ScrollTrigger) return;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);

  // Clean up previous triggers to prevent duplicate animations during re-renders
  cleanUpGsapScrollAnimations();

  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scroller = getActiveGsapScroller();

  if (isReduced) {
    document.querySelectorAll('.reveal-on-scroll, .home-market-intel-grid, .intel-card, .bento-card, .feature-card').forEach(el => {
      el.classList.add('is-revealed');
      if (el.style) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.clipPath = 'none';
      }
    });
    return;
  }

  // 1. Scroll-Triggered Text Reveals (Staggered word & line animation for section titles)
  const titles = document.querySelectorAll('.home-bento-section .section-title, .home-features-section .section-title, .apk-showcase-title');
  titles.forEach(title => {
    if (!title.dataset.gsapSplit) {
      title.dataset.gsapSplit = 'true';
      const words = title.innerText.trim().split(/\s+/);
      title.innerHTML = words.map(w => `<span class="gsap-word-wrap"><span class="gsap-word-inner">${w}&nbsp;</span></span>`).join('');
    }
    const innerWords = title.querySelectorAll('.gsap-word-inner');
    if (innerWords.length > 0) {
      const trig = ScrollTrigger.create({
        trigger: title,
        scroller: scroller,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo(innerWords,
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.65, stagger: 0.04, ease: 'power3.out' }
          );
        }
      });
      activeGsapTriggers.push(trig);
    }
  });

  // 2. Section Entrance Animations (opacity, y-position, and clean clearProps)
  const entranceSections = document.querySelectorAll('.reveal-on-scroll, .home-bento-section, .home-features-section, .vtrade-footer');
  entranceSections.forEach(sec => {
    sec.classList.add('is-revealed');
    const trig = ScrollTrigger.create({
      trigger: sec,
      scroller: scroller,
      start: 'top 95%',
      once: true,
      onEnter: () => {
        sec.classList.add('is-revealed');
        gsap.fromTo(sec,
          { opacity: 0, y: 38, clipPath: 'inset(3% 0% 3% 0% round 24px)' },
          { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 0.85, ease: 'power2.out', clearProps: 'clipPath' }
        );
      }
    });
    activeGsapTriggers.push(trig);
  });

  // 3. Staggered Card Reveals (Market intel cards & platform feature cards)
  const intelGrid = document.querySelector('.home-market-intel-grid');
  if (intelGrid) {
    intelGrid.classList.add('is-revealed');
    const intelCards = intelGrid.querySelectorAll('.intel-card');
    const trig = ScrollTrigger.create({
      trigger: intelGrid,
      scroller: scroller,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.fromTo(intelCards,
          { opacity: 0, y: 32, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.1, ease: 'back.out(1.2)' }
        );
      }
    });
    activeGsapTriggers.push(trig);
  }

  const featuresGrid = document.querySelector('.features-bento-grid');
  if (featuresGrid) {
    const featCards = featuresGrid.querySelectorAll('.feature-card');
    const trig = ScrollTrigger.create({
      trigger: featuresGrid,
      scroller: scroller,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.fromTo(featCards,
          { opacity: 0, y: 30, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out' }
        );
      }
    });
    activeGsapTriggers.push(trig);
  }

  // 3c. Spotlight Market Cards Staggered Sequential Entrance (BTC, ETH, GOLD, SOL)
  const bentoSec = document.querySelector('.home-bento-section');
  const bentoGrid = document.getElementById('home-spotlight-bento');
  if (bentoSec && bentoGrid) {
    const cards = bentoGrid.querySelectorAll('.bento-card');
    if (cards.length > 0) {
      const trig = ScrollTrigger.create({
        trigger: bentoSec,
        scroller: scroller,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo(cards,
            { opacity: 0, y: 32, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.09, ease: 'power2.out', clearProps: 'transform' }
          );
        }
      });
      activeGsapTriggers.push(trig);
    }
  }

  // 4. Selective Pinned Section (Desktop only - 3D smartphones interactive separation on scroll)
  const isDesktop = window.innerWidth >= 1024;
  const showcaseSec = document.getElementById('home-apk-showcase-section');
  const phoneBack = document.getElementById('apk-phone-back');
  const phoneFront = document.getElementById('apk-phone-front');

  if (isDesktop && showcaseSec && phoneBack && phoneFront) {
    const pinTrigger = ScrollTrigger.create({
      trigger: showcaseSec,
      scroller: scroller,
      start: 'top top+=90',
      end: '+=240',
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(phoneBack, {
          x: -p * 22,
          z: p * 35,
          rotationY: -18 + p * 8,
          rotationX: 10 - p * 4,
          force3D: true
        });
        gsap.set(phoneFront, {
          x: p * 22,
          z: p * 55,
          rotationY: -12 + p * 6,
          rotationX: 8 - p * 4,
          force3D: true
        });
      }
    });
    activeGsapTriggers.push(pinTrigger);
  }

  // 5. Scroll-Linked Parallax Effects (Ambient Aurora & Beam Rays)
  const heroAurora = document.querySelector('.hero-ambient-aurora');
  const heroBeam = document.querySelector('.hero-beam-ray');
  const heroSection = document.querySelector('.landing-hero-section');

  if (heroSection && (heroAurora || heroBeam)) {
    const parallaxTrigger = ScrollTrigger.create({
      trigger: heroSection,
      scroller: scroller,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        if (heroAurora) gsap.set(heroAurora, { y: p * 50, scale: 1 + p * 0.12 });
        if (heroBeam) gsap.set(heroBeam, { y: p * 70, opacity: 0.9 - p * 0.4 });
      }
    });
    activeGsapTriggers.push(parallaxTrigger);
  }

  // 6. Timeline-Based Sequence (Coordinated entrance of headings, copy, QR code, badges, stats)
  if (showcaseSec) {
    showcaseSec.classList.add('is-revealed');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: showcaseSec,
        scroller: scroller,
        start: 'top 82%',
        once: true
      }
    });

    const eyebrow = showcaseSec.querySelector('.apk-eyebrow-pill');
    const title = showcaseSec.querySelector('.apk-showcase-title');
    const desc = showcaseSec.querySelector('.apk-showcase-desc');
    const badges = showcaseSec.querySelectorAll('.apk-qr-card, .apk-badge-btn');
    const stats = showcaseSec.querySelectorAll('.apk-stat-col');
    const mockup = showcaseSec.querySelector('.apk-mockup-stage');

    if (eyebrow) tl.fromTo(eyebrow, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
    if (title) tl.fromTo(title, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, '-=0.25');
    if (desc) tl.fromTo(desc, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    if (badges.length > 0) tl.fromTo(badges, { scale: 0.94, opacity: 0, y: 14 }, { scale: 1, opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(1.3)' }, '-=0.2');
    if (stats.length > 0) tl.fromTo(stats, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power2.out' }, '-=0.25');
    if (mockup) tl.fromTo(mockup, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.75, ease: 'power3.out' }, '-=0.5');

    if (tl.scrollTrigger) activeGsapTriggers.push(tl.scrollTrigger);
  }
}

function initScrollRevealEngine() {
  const elements = document.querySelectorAll('.reveal-on-scroll, .home-market-intel-grid');
  // Immediately ensure all sections are revealed so there is zero black screen
  elements.forEach(el => {
    el.classList.add('is-revealed');
    if (el.style) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    }
  });

  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) {
    return;
  }

  // If GSAP and ScrollTrigger are loaded, execute the rich GSAP ScrollTrigger engine
  if (typeof window !== 'undefined' && window.gsap && window.ScrollTrigger) {
    initGsapScrollTriggerAnimations();
    return;
  }

  // Graceful fallback to IntersectionObserver if GSAP is not yet loaded or in lightweight headless environments
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach(el => observer.observe(el));
  } else {
    elements.forEach(el => el.classList.add('is-revealed'));
  }
}

function initSpotlightAndTiltCards() {
  if (typeof window === 'undefined' || !window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
  const cards = document.querySelectorAll('.spotlight-card, .tilt-card');
  cards.forEach(card => {
    if (card.dataset.spotlightBound) return;
    card.dataset.spotlightBound = 'true';

    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

      if (card.classList.contains('tilt-card')) {
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotX = ((y - cy) / cy) * -3.5;
        const rotY = ((x - cx) / cx) * 3.5;
        card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
      }
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
      if (card.classList.contains('tilt-card')) {
        card.style.transform = '';
      }
    });
  });
}

function toggleSharkFAQ(element) {
  if (!element) return;
  const faqItem = element.closest('.shark-faq-item');
  if (!faqItem) return;
  const answer = faqItem.querySelector('.sfi-answer');
  const toggleIcon = faqItem.querySelector('.sfi-toggle-icon');
  
  const isExpanded = faqItem.classList.contains('active');
  if (isExpanded) {
    faqItem.classList.remove('active');
    if (answer) answer.classList.add('hidden');
    if (toggleIcon) toggleIcon.textContent = '+';
  } else {
    // Accordion behavior: close other items in the same list
    const parentList = faqItem.parentElement;
    if (parentList) {
      const allItems = parentList.querySelectorAll('.shark-faq-item');
      allItems.forEach(item => {
        if (item !== faqItem) {
          item.classList.remove('active');
          const ans = item.querySelector('.sfi-answer');
          const icon = item.querySelector('.sfi-toggle-icon');
          if (ans) ans.classList.add('hidden');
          if (icon) icon.textContent = '+';
        }
      });
    }
    faqItem.classList.add('active');
    if (answer) answer.classList.remove('hidden');
    if (toggleIcon) toggleIcon.textContent = '−';
  }
}

window.updateNavIndicator = updateNavIndicator;
window.initHeroTextAnimation = initHeroTextAnimation;
window.initHeroGlassBlockInteractions = initHeroGlassBlockInteractions;
window.initScrollRevealEngine = initScrollRevealEngine;
window.initSpotlightAndTiltCards = initSpotlightAndTiltCards;
window.toggleSharkFAQ = toggleSharkFAQ;
window.initGsapScrollTriggerAnimations = initGsapScrollTriggerAnimations;
window.cleanUpGsapScrollAnimations = cleanUpGsapScrollAnimations;
window.getActiveGsapScroller = getActiveGsapScroller;
window.initHeroGsapTimeline = initHeroGsapTimeline;
window.animateSpotlightBentoCards = animateSpotlightBentoCards;
window.initSpotlightMarketCardPointers = initSpotlightMarketCardPointers;
window.updateSpotlightBentoPrices = updateSpotlightBentoPrices;

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
  renderHomeSpotlightBento();
  renderHomeMarketList();
  initPortfolioScrubberListeners();
}

let lastRecordedSpotlightPrices = {};

function renderHomeSpotlightBento() {
  const bentoGrid = document.getElementById('home-spotlight-bento');
  if (!bentoGrid || typeof COINS === 'undefined') return;

  const spotlightIds = ['bitcoin', 'ethereum', 'gold', 'solana'];
  const spotlightCoins = spotlightIds.map(id => COINS.find(c => c.id === id)).filter(Boolean);

  bentoGrid.innerHTML = spotlightCoins.map(c => {
    const isUp = c.change >= 0;
    const displayPair = getCoinDisplayPair(c);
    lastRecordedSpotlightPrices[c.id] = c.price;
    return `
      <div class="bento-card spotlight-card spotlight-market-card smc-${c.id}" id="spotlight-card-${c.id}" data-coin="${c.id}" onclick="selectCoinAndTrade('${c.id}')">
        <div class="smc-spotlight" aria-hidden="true"></div>
        <div class="smc-edge-beam" aria-hidden="true"></div>
        <div class="bento-card-top">
          <div class="bento-card-asset">
            <img src="${c.icon}" alt="${c.symbol}" class="bento-coin-icon bento-coin-${c.id}" onerror="handleCoinIconError(this, '${c.symbol}', '${c.category}')" />
            <div>
              <div class="bento-sym">${displayPair}</div>
              <div class="bento-name">${c.name}</div>
            </div>
          </div>
          <span class="coin-lev-badge">${c.maxLev}x</span>
        </div>
        <div class="bento-price-row">
          <span class="bento-price" id="spotlight-price-${c.id}">${getCurrencySymbol()}${fmtPrice(c.price)}</span>
          <span class="bento-chg ${isUp ? 'up' : 'down'}" id="spotlight-chg-${c.id}">${isUp ? '+' : ''}${c.change ? c.change.toFixed(2) : '0.00'}%</span>
        </div>
        <div class="smc-bottom-row">
          <span class="smc-vol" id="spotlight-vol-${c.id}">24h Vol: ${c.vol || 'N/A'}</span>
          <span class="smc-trade-desk">Trade Desk <span class="smc-trade-arrow">→</span></span>
        </div>
      </div>
    `;
  }).join('');

  initSpotlightMarketCardPointers();
  if (typeof initSpotlightAndTiltCards === 'function') initSpotlightAndTiltCards();
  if (typeof animateSpotlightBentoCards === 'function') animateSpotlightBentoCards();
  if (typeof window !== 'undefined' && window.ScrollTrigger) window.ScrollTrigger.refresh();
}

function initSpotlightMarketCardPointers() {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isFine) return;

  const cards = document.querySelectorAll('.spotlight-market-card');
  cards.forEach(card => {
    if (card.dataset.smcBound) return;
    card.dataset.smcBound = 'true';

    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--card-mouse-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--card-mouse-y', `${y.toFixed(1)}px`);
      card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--card-mouse-x');
      card.style.removeProperty('--card-mouse-y');
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  });
}

function updateSpotlightBentoPrices() {
  if (typeof document === 'undefined' || typeof COINS === 'undefined') return;
  const spotlightIds = ['bitcoin', 'ethereum', 'gold', 'solana'];

  spotlightIds.forEach(id => {
    const coin = COINS.find(c => c.id === id);
    if (!coin) return;

    const priceEl = document.getElementById(`spotlight-price-${id}`);
    const chgEl = document.getElementById(`spotlight-chg-${id}`);
    const volEl = document.getElementById(`spotlight-vol-${id}`);

    if (priceEl) {
      const prevPrice = lastRecordedSpotlightPrices[id];
      if (typeof prevPrice === 'number' && prevPrice !== coin.price) {
        triggerPriceFlash(priceEl, coin.price, prevPrice);
      }
      priceEl.textContent = `${getCurrencySymbol()}${fmtPrice(coin.price)}`;
    }

    if (chgEl) {
      const isUp = coin.change >= 0;
      chgEl.className = `bento-chg ${isUp ? 'up' : 'down'}`;
      chgEl.textContent = `${isUp ? '+' : ''}${coin.change ? coin.change.toFixed(2) : '0.00'}%`;
    }

    if (volEl && coin.vol) {
      volEl.textContent = `24h Vol: ${coin.vol}`;
    }

    lastRecordedSpotlightPrices[id] = coin.price;
  });
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

// ─── UNIVERSAL COIN ICON ERROR FALLBACK ──────────────────────────────
function handleCoinIconError(imgEl, symbol, category) {
  if (!imgEl) return;
  imgEl.onerror = null;

  const paletteMap = {
    l1: ['#3b82f6', '#1d4ed8'],
    l2: ['#8b5cf6', '#6d28d9'],
    defi: ['#ec4899', '#be185d'],
    meme: ['#f59e0b', '#d97706'],
    ai: ['#06b6d4', '#0891b2'],
    commodities: ['#fbbf24', '#d97706'],
    futures: ['#10b981', '#047857'],
    default: ['#6366f1', '#4338ca']
  };

  const palette = paletteMap[category] || paletteMap.default;
  const sym = (symbol || 'COIN').slice(0, 4).toUpperCase();
  const fontSize = sym.length <= 3 ? 12 : 9.5;
  const textY = fontSize === 12 ? 20.5 : 19.5;

  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="g_${sym}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="100%" stop-color="${palette[1]}"/></linearGradient></defs><circle cx="16" cy="16" r="15" fill="url(#g_${sym})" stroke="rgba(255,255,255,0.25)" stroke-width="1"/><text x="16" y="${textY}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" letter-spacing="-0.3">${sym}</text></svg>`;

  imgEl.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgData);
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
          <img class="coin-avatar-img" src="${coin.icon}" alt="${coin.name}" loading="lazy" onerror="handleCoinIconError(this, '${coin.symbol}', '${coin.category || ''}')" />
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
  const tbody = document.getElementById('markets-table-body');
  const container = document.getElementById('markets-coin-list-container');
  if (!tbody && !container) return;

  let list = [...COINS];

  // Category Filter
  if (marketCategory !== 'all') {
    list = list.filter(c => c.category === marketCategory || (marketCategory === 'futures' && (c.maxLev >= 75 || c.id === 'gold')));
  }

  // Search filter
  if (marketSearchQuery) {
    const q = marketSearchQuery.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || (c.id === 'gold' && 'gold/usdt'.includes(q)));
  }

  // Sort
  if (marketSortBy === 'price') {
    list.sort((a, b) => marketSortAsc ? a.price - b.price : b.price - a.price);
  } else if (marketSortBy === 'change') {
    list.sort((a, b) => marketSortAsc ? a.change - b.change : b.change - a.change);
  } else if (marketSortBy === 'name') {
    list.sort((a, b) => marketSortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
  } else if (marketSortBy === 'vol') {
    list.sort((a, b) => marketSortAsc ? (parseFloat(a.vol) || 0) - (parseFloat(b.vol) || 0) : (parseFloat(b.vol) || 0) - (parseFloat(a.vol) || 0));
  }

  if (tbody) {
    tbody.innerHTML = list.map(c => {
      const isUp = c.change >= 0;
      const displayPair = getCoinDisplayPair(c);
      return `
        <tr onclick="selectCoinAndTrade('${c.id}')" style="cursor: pointer;">
          <td>
            <div class="mkt-cell-asset">
              <img src="${c.icon}" alt="${c.symbol}" class="mkt-coin-avatar" onerror="handleCoinIconError(this, '${c.symbol}', '${c.category || ''}')" />
              <div class="mkt-cell-names">
                <span class="mkt-cell-sym">${displayPair}</span>
                <span class="mkt-cell-fullname">${c.name}</span>
              </div>
            </div>
          </td>
          <td style="text-align: right; font-family: var(--font-price); font-weight: 700;">${getCurrencySymbol()}${fmtPrice(c.price)}</td>
          <td style="text-align: right;">
            <span class="coin-chg-badge ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${c.change ? c.change.toFixed(2) : '0.00'}%</span>
          </td>
          <td style="text-align: right; color: #8b92a4; font-family: var(--font-price); font-size: 13px;">${getCurrencySymbol()}${fmtPrice(c.high || c.price)} / ${getCurrencySymbol()}${fmtPrice(c.low || c.price)}</td>
          <td style="text-align: right; color: #8b92a4; font-size: 13px;">${c.vol ? (c.vol.includes('M') || c.vol.includes('B') ? c.vol : '$' + c.vol) : 'N/A'}</td>
          <td style="text-align: center;"><span class="coin-lev-badge">${c.maxLev}x</span></td>
          <td style="text-align: right;">
            <button class="mkt-trade-btn" onclick="event.stopPropagation(); selectCoinAndTrade('${c.id}')">Trade</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (container) {
    container.innerHTML = list.map(c => {
      const isUp = c.change >= 0;
      const displayPair = getCoinDisplayPair(c);
      return `
        <div class="mkt-coin-item" onclick="selectCoinAndTrade('${c.id}')">
          <div class="coin-row-left">
            <img class="coin-avatar-img" src="${c.icon}" alt="${c.name}" style="width:28px;height:28px;" onerror="handleCoinIconError(this, '${c.symbol}', '${c.category || ''}')" />
            <div class="coin-meta-col">
              <div class="coin-sym-row">
                <span class="coin-sym-name" style="font-size:13.5px;">${displayPair}</span>
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
              ${isUp ? '+' : ''}${c.change ? c.change.toFixed(2) : '0.00'}%
            </span>
          </div>
        </div>
      `;
    }).join('');
  }
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

function sortMarkets(field) {
  sortMarketList(field);
}

// ─── 11. TRADE SCREEN & CANDLESTICK CHART ENGINE ─────────────────────────

const DEFAULT_CHART_SETTINGS = {
  upColor: '#00c087',
  downColor: '#f04f5e',
  bgColor: '#080b11',
  grid: 'hidden',
  chartStyle: '1',
  timezone: 'Etc/UTC',
  showCountdown: true,
  indicators: []
};

let currentChartSettings = { ...DEFAULT_CHART_SETTINGS };
let activeChartIndicators = [];
let chartCountdownEnabled = true;

function loadChartSettings() {
  try {
    const raw = localStorage.getItem('vtrade_tv_chart_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        currentChartSettings = { ...DEFAULT_CHART_SETTINGS, ...parsed };
      }
    }
    const savedInd = localStorage.getItem('vtrade_chart_indicators');
    if (savedInd) {
      let parsed = JSON.parse(savedInd);
      if (Array.isArray(parsed) && parsed.length > 2) {
        localStorage.removeItem('vtrade_chart_indicators');
        parsed = [];
      }
      activeChartIndicators = parsed || [];
    } else {
      activeChartIndicators = [];
    }
    const savedCd = localStorage.getItem('vtrade_chart_countdown');
    if (savedCd !== null) {
      chartCountdownEnabled = (savedCd === 'true');
    } else if (typeof currentChartSettings.showCountdown === 'boolean') {
      chartCountdownEnabled = currentChartSettings.showCountdown;
    }
  } catch (e) {}
}

function saveChartSettings() {
  try {
    currentChartSettings.indicators = [...activeChartIndicators];
    currentChartSettings.showCountdown = chartCountdownEnabled;
    localStorage.setItem('vtrade_tv_chart_settings', JSON.stringify(currentChartSettings));
    localStorage.setItem('vtrade_chart_indicators', JSON.stringify(activeChartIndicators));
    localStorage.setItem('vtrade_chart_countdown', chartCountdownEnabled ? 'true' : 'false');
  } catch (e) {}
}

loadChartSettings();

function getTradingViewOverrides() {
  loadChartSettings();
  const up = currentChartSettings.upColor || '#00c087';
  const down = currentChartSettings.downColor || '#f04f5e';
  const bg = currentChartSettings.bgColor || '#080b11';
  let gridColor = 'rgba(0, 0, 0, 0)';
  if (currentChartSettings.grid === 'subtle') gridColor = 'rgba(255, 255, 255, 0.04)';
  if (currentChartSettings.grid === 'visible') gridColor = 'rgba(255, 255, 255, 0.09)';

  const overrides = {
    "mainSeriesProperties.showCountdown": true,
    "scalesProperties.showCountdown": true,
    "mainSeriesProperties.highLowAvgPrice.highLowPriceLabelsVisible": false,
    "mainSeriesProperties.highLowAvgPrice.highLowPriceLinesVisible": false,
    "mainSeriesProperties.highLowAvgPrice.averageClosePriceLineVisible": false,
    "mainSeriesProperties.highLowAvgPrice.averageClosePriceLabelVisible": false,
    "mainSeriesProperties.showPrevClosePriceLine": false,
    "mainSeriesProperties.prevClosePriceLine.color": "rgba(0, 0, 0, 0)",
    "mainSeriesProperties.prevClosePriceLine.width": 0,
    "scalesProperties.showPrevClosePriceLabels": false,
    "mainSeriesProperties.prevClosePriceLabelsVisible": false,
    "scalesProperties.showSymbolLabels": false,
    "scalesProperties.showSymbolName": false,
    "scalesProperties.showSeriesTitle": false,
    "mainSeriesProperties.showSymbolLabels": false,
    "mainSeriesProperties.symbolNameLabelVisible": false,
    "mainSeriesProperties.showSymbolName": false,
    "mainSeriesProperties.bidAsk.bidLineVisible": false,
    "mainSeriesProperties.bidAsk.askLineVisible": false,
    "mainSeriesProperties.bidAsk.bidAskPriceLabelsVisible": false,
    "mainSeriesProperties.prePostMarket.preMarketPriceLineVisible": false,
    "mainSeriesProperties.prePostMarket.postMarketPriceLineVisible": false,
    "paneProperties.background": bg,
    "paneProperties.backgroundColor": bg,
    "paneProperties.backgroundType": "solid",
    "paneProperties.vertGridProperties.color": gridColor,
    "paneProperties.horzGridProperties.color": gridColor,
    "paneProperties.vertGridProperties.style": 0,
    "paneProperties.horzGridProperties.style": 0,
    "mainSeriesProperties.candleStyle.upColor": up,
    "mainSeriesProperties.candleStyle.downColor": down,
    "mainSeriesProperties.candleStyle.borderUpColor": up,
    "mainSeriesProperties.candleStyle.borderDownColor": down,
    "mainSeriesProperties.candleStyle.wickUpColor": up,
    "mainSeriesProperties.candleStyle.wickDownColor": down,
    "mainSeriesProperties.hollowCandleStyle.upColor": up,
    "mainSeriesProperties.hollowCandleStyle.downColor": down,
    "mainSeriesProperties.hollowCandleStyle.borderUpColor": up,
    "mainSeriesProperties.hollowCandleStyle.borderDownColor": down,
    "mainSeriesProperties.haStyle.upColor": up,
    "mainSeriesProperties.haStyle.downColor": down,
    "mainSeriesProperties.haStyle.borderUpColor": up,
    "mainSeriesProperties.haStyle.borderDownColor": down,
    "mainSeriesProperties.barStyle.upColor": up,
    "mainSeriesProperties.barStyle.downColor": down,
    "mainSeriesProperties.lineStyle.color": up,
    "mainSeriesProperties.areaStyle.linecolor": up
  };

  if (chartCountdownEnabled === false) {
    overrides["mainSeriesProperties.showCountdown"] = false;
    overrides["scalesProperties.showCountdown"] = false;
  }
  return overrides;
}

function renderTradingViewChart() {
  const forceReload = arguments[0] === true;
  const iframe = document.getElementById('tradingview-chart-iframe');
  if (!iframe) return;

  loadChartSettings();
  const overrides = getTradingViewOverrides();
  const defaultCountdownFeatures = chartCountdownEnabled ? ['countdown'] : [];
  const enabledFeatures = [
    ...defaultCountdownFeatures,
    'header_widget',
    'header_resolutions',
    'header_indicators',
    'header_symbol_search',
    'header_chart_type',
    'header_settings',
    'header_fullscreen_button',
    'use_localstorage_for_settings',
    'save_chart_properties_to_local_storage',
    'chart_template_storage',
    'study_templates',
    'side_toolbar_in_fullscreen_mode'
  ];

  const tvSymbol = selectedCoin.tvSymbol || ('BINANCE:' + (selectedCoin.binanceSym || 'BTCUSDT'));
  const tvIntervalMap = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30',
    '1h': '60', '2h': '120', '4h': '240', '1d': 'D', '1w': 'W', '1M': 'M'
  };
  const intervalCode = tvIntervalMap[chartInterval] || '60';

  let studiesParam = '';
  if (activeChartIndicators && activeChartIndicators.length > 0) {
    studiesParam = `&studies=${encodeURIComponent(JSON.stringify(activeChartIndicators))}`;
  }

  const up = currentChartSettings.upColor || '#00c087';
  const down = currentChartSettings.downColor || '#f04f5e';
  const bg = currentChartSettings.bgColor || '#080b11';
  let gridColor = 'rgba(0, 0, 0, 0)';
  if (currentChartSettings.grid === 'subtle') gridColor = 'rgba(255, 255, 255, 0.04)';
  if (currentChartSettings.grid === 'visible') gridColor = 'rgba(255, 255, 255, 0.09)';

  const widgetConfig = {
    autosize: true,
    symbol: tvSymbol,
    interval: intervalCode,
    timezone: currentChartSettings.timezone || 'Etc/UTC',
    theme: 'dark',
    style: String(currentChartSettings.chartStyle || '1'),
    locale: 'en',
    backgroundColor: bg,
    gridColor: gridColor,
    upColor: up,
    downColor: down,
    allow_symbol_change: true,
    calendar: false,
    hide_side_toolbar: false,
    hide_top_toolbar: false,
    withdateranges: false,
    save_image: true,
    enable_publishing: false,
    hideideas: true,
    disabled_features: ['show_symbol_labels', 'symbol_info'],
    enabled_features: enabledFeatures,
    overrides: overrides
  };
  if (activeChartIndicators && activeChartIndicators.length > 0) {
    widgetConfig.studies = activeChartIndicators;
  }

  const chartBox = document.getElementById('trade-candlestick-container');
  if (chartBox) {
    chartBox.style.backgroundColor = bg;
  }

  const reloadParam = forceReload ? `&_t=${Date.now()}` : '';
  const newSrc = `https://s.tradingview.com/embed-widget/advanced-chart/?frameElementId=tradingview-chart-iframe&hide_side_toolbar=0&locale=en${reloadParam}#${encodeURIComponent(JSON.stringify(widgetConfig))}`;

  const currentApplied = iframe.getAttribute('data-applied-url');
  if (forceReload || !iframe.src || currentApplied !== newSrc || iframe.src !== newSrc) {
    iframe.setAttribute('data-applied-url', newSrc);
    if (forceReload) {
      iframe.src = 'about:blank';
      setTimeout(() => {
        if (iframe) iframe.src = newSrc;
      }, 15);
    } else {
      iframe.src = newSrc;
    }
  }
  syncIndicatorsUI();
  updateCustomWatermark(selectedCoin ? selectedCoin.symbol : 'BTC');
}

// ─── Shark Exchange Style Top Right Toolbar Controller (Screenshot 2) ───
let currentChartLayout = '1x1';
let chartAutosaveEnabled = true;

function updateCustomWatermark(symbol) {
  const sym = (symbol || (typeof selectedCoin !== 'undefined' && selectedCoin && selectedCoin.symbol) || 'BTC').toUpperCase();
  const el = document.getElementById('tv-custom-watermark');
  if (el) {
    el.textContent = `${sym}-USDT · VTrade`;
  }
  const tagEl = document.getElementById('tcb-market-tag');
  if (tagEl) {
    const pt = (typeof localStorage !== 'undefined' && localStorage.getItem('vtrade_chart_price_type')) || 'mark';
    tagEl.textContent = `${sym}-USDT (${pt === 'mark' ? 'Mark' : 'Last'}) · VTrade`;
  }
}

function toggleTvLayoutMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('tv-tr-layout-menu');
  const saveMenu = document.getElementById('tv-tr-save-menu');
  if (saveMenu) saveMenu.classList.add('hidden');
  if (menu) menu.classList.toggle('hidden');
}

function toggleTvSaveMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('tv-tr-save-menu');
  const layoutMenu = document.getElementById('tv-tr-layout-menu');
  if (layoutMenu) layoutMenu.classList.add('hidden');
  if (menu) menu.classList.toggle('hidden');
}

function selectChartLayout(layout) {
  currentChartLayout = layout;
  const menu = document.getElementById('tv-tr-layout-menu');
  if (menu) {
    menu.classList.add('hidden');
    const items = menu.querySelectorAll('.tv-tr-dd-item');
    items.forEach(it => {
      const isAct = it.getAttribute('onclick') && it.getAttribute('onclick').includes(layout);
      it.classList.toggle('active', isAct);
      const chk = it.querySelector('.tv-tr-dd-check');
      if (chk) chk.textContent = isAct ? '✓' : '';
    });
  }
  showToast(`Chart layout updated: ${layout}`, 'info');
}

function saveCurrentChartLayout(e) {
  if (e) e.stopPropagation();
  try {
    const layoutState = {
      symbol: (typeof selectedCoin !== 'undefined' && selectedCoin) ? selectedCoin.symbol : 'BTC',
      interval: (typeof chartInterval !== 'undefined') ? chartInterval : '1h',
      priceType: localStorage.getItem('vtrade_chart_price_type') || 'mark',
      indicators: (typeof activeChartIndicators !== 'undefined') ? activeChartIndicators : [],
      countdown: typeof chartCountdownEnabled !== 'undefined' ? (chartCountdownEnabled !== false) : true,
      layout: currentChartLayout,
      settings: typeof currentChartSettings !== 'undefined' ? currentChartSettings : {},
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('vtrade_saved_chart_layout', JSON.stringify(layoutState));

    // Button visual feedback
    const lbl = document.getElementById('tv-tr-save-label');
    if (lbl) {
      lbl.textContent = 'Saved ✓';
      lbl.style.color = '#00c087';
      setTimeout(() => {
        lbl.textContent = 'Save';
        lbl.style.color = '';
      }, 1800);
    }
    const saveMenu = document.getElementById('tv-tr-save-menu');
    if (saveMenu) saveMenu.classList.add('hidden');
    showToast('✓ Chart layout saved to local storage', 'success');
  } catch (err) {
    console.error('Failed to save chart layout:', err);
  }
}

function toggleChartAutosave() {
  chartAutosaveEnabled = !chartAutosaveEnabled;
  localStorage.setItem('vtrade_chart_autosave', chartAutosaveEnabled ? 'true' : 'false');
  const statusEl = document.getElementById('tv-tr-autosave-status');
  if (statusEl) {
    statusEl.textContent = chartAutosaveEnabled ? 'ON' : 'OFF';
    statusEl.className = chartAutosaveEnabled ? 'tv-tr-badge-on' : 'tv-tr-badge-off';
  }
  showToast(`Auto-save: ${chartAutosaveEnabled ? 'Enabled' : 'Disabled'}`, 'info');
}

function promptRenameLayout() {
  const saveMenu = document.getElementById('tv-tr-save-menu');
  if (saveMenu) saveMenu.classList.add('hidden');
  const existing = localStorage.getItem('vtrade_chart_layout_name') || 'Default Layout';
  const name = prompt('Enter a name for this chart layout:', existing);
  if (name && name.trim()) {
    localStorage.setItem('vtrade_chart_layout_name', name.trim());
    showToast(`Layout renamed to "${name.trim()}"`, 'success');
    saveCurrentChartLayout();
  }
}

function restoreDefaultChartLayout() {
  const saveMenu = document.getElementById('tv-tr-save-menu');
  if (saveMenu) saveMenu.classList.add('hidden');
  if (confirm('Reset chart layout and indicators to default?')) {
    localStorage.removeItem('vtrade_saved_chart_layout');
    localStorage.removeItem('vtrade_chart_indicators');
    activeChartIndicators = ['Volume@tv-basicstudies'];
    chartInterval = '1h';
    renderTradingViewChart(true);
    showToast('Chart layout reset to default', 'info');
  }
}

function captureChartSnapshot() {
  showToast('📷 Chart snapshot captured!', 'success');
}

function toggleChartThemeNotification() {
  showToast('☼ Luxury Dark Mode Active (Obsidian OLED)', 'info');
}

function toggleChartFullscreen() {
  const box = document.getElementById('trade-candlestick-container');
  if (!box) return;
  if (!document.fullscreenElement) {
    if (box.requestFullscreen) {
      box.requestFullscreen().catch(() => openFullscreenChart());
    } else {
      openFullscreenChart();
    }
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('fullscreenchange', () => {
    const fsIcon = document.getElementById('tv-tr-fs-icon');
    if (!fsIcon) return;
    if (document.fullscreenElement) {
      fsIcon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>';
    } else {
      fsIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target || typeof e.target.closest !== 'function' || !e.target.closest('.tv-tr-item-wrap')) {
      const lMenu = document.getElementById('tv-tr-layout-menu');
      const sMenu = document.getElementById('tv-tr-save-menu');
      if (lMenu) lMenu.classList.add('hidden');
      if (sMenu) sMenu.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 's') {
      const tradeDesk = document.getElementById('trade-screen');
      if (tradeDesk && !tradeDesk.classList.contains('hidden')) {
        e.preventDefault();
        saveCurrentChartLayout();
      }
    }
  });
}

let currentFsTab = 'price';

function openFullscreenChart() {
  const forceReload = arguments[0] === true;
  const modal = document.getElementById('tv-fullscreen-modal');
  const iframe = document.getElementById('tv-fullscreen-iframe');
  const pairEl = document.getElementById('tv-fs-pair');
  const iconEl = document.getElementById('tv-fs-coin-icon');
  const chgEl = document.getElementById('tv-fs-change');
  const buySub = document.getElementById('tv-fs-buy-sub');
  const sellSub = document.getElementById('tv-fs-sell-sub');
  if (!modal || !iframe) return;

  loadChartSettings();
  const overrides = getTradingViewOverrides();
  const defaultCountdownFeatures = ['countdown'];
  const enabledFeatures = [
    ...defaultCountdownFeatures,
    'header_widget',
    'header_resolutions',
    'header_indicators',
    'header_symbol_search',
    'header_chart_type',
    'header_settings',
    'header_fullscreen_button',
    'use_localstorage_for_settings',
    'save_chart_properties_to_local_storage',
    'chart_template_storage',
    'study_templates',
    'side_toolbar_in_fullscreen_mode'
  ];

  const tvSymbol = selectedCoin.tvSymbol || ('BINANCE:' + (selectedCoin.binanceSym || 'BTCUSDT'));
  const tvIntervalMap = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30',
    '1h': '60', '2h': '120', '4h': '240', '1d': 'D', '1w': 'W', '1M': 'M'
  };
  const intervalCode = tvIntervalMap[chartInterval] || '60';

  if (iconEl) {
    iconEl.src = selectedCoin.icon;
    iconEl.onerror = function() { handleCoinIconError(this, selectedCoin.symbol, selectedCoin.category); };
  }
  if (pairEl) pairEl.textContent = `${selectedCoin.symbol}/USDT`;
  if (chgEl) {
    const activeChg = (selectedCoin.chartChange !== undefined && !isNaN(selectedCoin.chartChange))
      ? selectedCoin.chartChange
      : ((selectedCoin.change24h !== undefined && !isNaN(selectedCoin.change24h))
          ? selectedCoin.change24h
          : (typeof selectedCoin.change === 'number' && !isNaN(selectedCoin.change) ? selectedCoin.change : 0));
    const isUp = activeChg >= 0;
    chgEl.className = `tv-fs-change-pill ${isUp ? 'up' : 'down'}`;
    chgEl.textContent = `${isUp ? '+' : ''}${activeChg.toFixed(2)}%`;
  }
  if (buySub) buySub.textContent = `Up to ${selectedCoin.maxLev}x`;
  if (sellSub) sellSub.textContent = `Up to ${selectedCoin.maxLev}x`;

  const nameEl = document.getElementById('tv-fs-name');
  const catEl = document.getElementById('tv-fs-cat');
  const priceEl = document.getElementById('tv-fs-price');
  const highEl = document.getElementById('tv-fs-high');
  const lowEl = document.getElementById('tv-fs-low');
  const volEl = document.getElementById('tv-fs-vol');
  const levEl = document.getElementById('tv-fs-lev');
  if (nameEl) nameEl.textContent = selectedCoin.name || selectedCoin.symbol;
  if (catEl) catEl.textContent = (selectedCoin.category || 'Futures').toUpperCase();
  if (priceEl) priceEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
  if (highEl) highEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.high || selectedCoin.price * 1.018)}`;
  if (lowEl) lowEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.low || selectedCoin.price * 0.982)}`;
  if (volEl) volEl.textContent = `${selectedCoin.vol || '304.6M USDT'}`;
  if (levEl) levEl.textContent = `${selectedCoin.maxLev || 150}x`;

  switchFsTab('price');
  renderFsTabContent();

  let fsStudiesParam = '';
  if (activeChartIndicators && activeChartIndicators.length > 0) {
    fsStudiesParam = `&studies=${encodeURIComponent(JSON.stringify(activeChartIndicators))}`;
  }

  const up = currentChartSettings.upColor || '#00c087';
  const down = currentChartSettings.downColor || '#f04f5e';
  const bg = currentChartSettings.bgColor || '#080b11';
  let gridColor = 'rgba(0, 0, 0, 0)';
  if (currentChartSettings.grid === 'subtle') gridColor = 'rgba(255, 255, 255, 0.04)';
  if (currentChartSettings.grid === 'visible') gridColor = 'rgba(255, 255, 255, 0.09)';

  const fsWidgetConfig = {
    autosize: true,
    symbol: tvSymbol,
    interval: intervalCode,
    timezone: currentChartSettings.timezone || 'Etc/UTC',
    theme: 'dark',
    style: String(currentChartSettings.chartStyle || '1'),
    locale: 'en',
    backgroundColor: bg,
    gridColor: gridColor,
    upColor: up,
    downColor: down,
    allow_symbol_change: true,
    calendar: false,
    hide_side_toolbar: false,
    hide_top_toolbar: false,
    withdateranges: false,
    save_image: true,
    enable_publishing: false,
    hideideas: true,
    disabled_features: ['show_symbol_labels', 'symbol_info'],
    enabled_features: enabledFeatures,
    overrides: overrides
  };
  if (activeChartIndicators && activeChartIndicators.length > 0) {
    fsWidgetConfig.studies = activeChartIndicators;
  }

  const fsChartArea = document.querySelector('.tv-fs-chart-area');
  if (fsChartArea) {
    fsChartArea.style.backgroundColor = bg;
  }

  const reloadParam = forceReload ? `&_t=${Date.now()}` : '';
  const url = `https://s.tradingview.com/embed-widget/advanced-chart/?frameElementId=tv-fullscreen-iframe&hide_side_toolbar=0&locale=en${reloadParam}#${encodeURIComponent(JSON.stringify(fsWidgetConfig))}`;
  const currentApplied = iframe.getAttribute('data-applied-url');
  if (forceReload || !iframe.src || currentApplied !== url || iframe.src !== url) {
    iframe.setAttribute('data-applied-url', url);
    if (forceReload) {
      iframe.src = 'about:blank';
      setTimeout(() => {
        if (iframe) iframe.src = url;
      }, 15);
    } else {
      iframe.src = url;
    }
  }
  modal.classList.remove('hidden');
}

function closeFullscreenChart() {
  const modal = document.getElementById('tv-fullscreen-modal');
  const iframe = document.getElementById('tv-fullscreen-iframe');
  if (modal) modal.classList.add('hidden');
  if (iframe) iframe.src = '';
}

function switchFsTab(tab) {
  currentFsTab = tab;
  ['price', 'info', 'orderbook', 'trades'].forEach(t => {
    const btn = document.getElementById(`tv-fs-tab-${t}`);
    const panel = document.getElementById(`tv-fs-panel-${t === 'price' ? 'chart' : t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (panel) panel.classList.toggle('active', t === tab);
  });
  renderFsTabContent();
}

function renderFsTabContent() {
  if (currentFsTab === 'info') {
    const highEl = document.getElementById('tv-fs-info-high');
    const lowEl = document.getElementById('tv-fs-info-low');
    const volEl = document.getElementById('tv-fs-info-vol');
    const levEl = document.getElementById('tv-fs-info-lev');
    if (highEl) highEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.high || selectedCoin.price * 1.03)}`;
    if (lowEl) lowEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.low || selectedCoin.price * 0.97)}`;
    if (volEl) volEl.textContent = `${getCurrencySymbol()}${selectedCoin.vol || '12.4M'}`;
    if (levEl) levEl.textContent = `${selectedCoin.maxLev}x`;
  } else if (currentFsTab === 'orderbook') {
    renderFsOrderBook();
  } else if (currentFsTab === 'trades') {
    renderFsTrades();
  }
}

function renderFsOrderBook() {
  const asksEl = document.getElementById('tv-fs-ob-asks');
  const bidsEl = document.getElementById('tv-fs-ob-bids');
  const midEl = document.getElementById('tv-fs-ob-midprice');
  if (!asksEl || !bidsEl) return;

  const curPrice = selectedCoin.price;
  if (midEl) midEl.textContent = `${getCurrencySymbol()}${fmtPrice(curPrice)}`;

  let asksHtml = '';
  for (let i = 5; i >= 1; i--) {
    const p = curPrice * (1 + (i * 0.0006));
    const qty = (Math.random() * 2.5 + 0.1).toFixed(3);
    asksHtml += `<div class="tv-fs-trade-row sell"><span>${fmtPrice(p)}</span><span style="text-align:right;">${qty}</span></div>`;
  }
  asksEl.innerHTML = asksHtml;

  let bidsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const p = curPrice * (1 - (i * 0.0006));
    const qty = (Math.random() * 2.5 + 0.1).toFixed(3);
    bidsHtml += `<div class="tv-fs-trade-row buy"><span>${fmtPrice(p)}</span><span style="text-align:right;">${qty}</span></div>`;
  }
  bidsEl.innerHTML = bidsHtml;
}

function renderFsTrades() {
  const listEl = document.getElementById('tv-fs-trades-list');
  if (!listEl) return;
  const curPrice = selectedCoin.price;
  let rows = '';
  for (let i = 0; i < 10; i++) {
    const isBuy = Math.random() > 0.48;
    const p = curPrice * (1 + (Math.random() * 0.002 - 0.001));
    const qty = (Math.random() * 1.8 + 0.05).toFixed(3);
    const d = new Date(Date.now() - i * 1400);
    const tStr = d.toTimeString().split(' ')[0];
    rows += `<div class="tv-fs-trade-row ${isBuy ? 'buy' : 'sell'}"><span>${tStr}</span><span>${isBuy ? 'BUY' : 'SELL'}</span><span>${fmtPrice(p)}</span><span>${qty}</span></div>`;
  }
  listEl.innerHTML = rows;
}

function toggleFavoriteCurrentCoin() {
  const btn = document.getElementById('tv-fs-star-btn');
  if (!btn) return;
  const isFav = btn.classList.toggle('active');
  btn.style.color = isFav ? '#fbbf24' : '#cbd5e1';
  showToast(isFav ? `${selectedCoin.symbol} added to Watchlist` : `${selectedCoin.symbol} removed from Watchlist`);
}

function toggleFsSettings() {
  openFsSettings();
}

function openFsSettings() {
  loadChartSettings();
  syncChartSettingsUI();
  const modal = document.getElementById('tv-chart-settings-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeFsSettings() {
  const modal = document.getElementById('tv-chart-settings-modal');
  if (modal) modal.classList.add('hidden');
}

function syncPresetHighlight() {
  const up = (currentChartSettings.upColor || '').toLowerCase();
  const down = (currentChartSettings.downColor || '').toLowerCase();
  const classicBtn = document.getElementById('cs-preset-classic');
  const neonBtn = document.getElementById('cs-preset-neon');
  const luxuryBtn = document.getElementById('cs-preset-luxury');
  const cyberpunkBtn = document.getElementById('cs-preset-cyberpunk');
  const sunsetBtn = document.getElementById('cs-preset-sunset');
  const customBtn = document.getElementById('cs-preset-custom');
  const customDotUp = document.getElementById('cs-preset-dot-up');
  const customDotDown = document.getElementById('cs-preset-dot-down');

  if (customDotUp) customDotUp.style.backgroundColor = up;
  if (customDotDown) customDotDown.style.backgroundColor = down;

  const isClassic = (up === '#00c087' && down === '#f04f5e');
  const isNeon = (up === '#00d2ff' && down === '#ff3366');
  const isLuxury = (up === '#f5a623' && down === '#a855f7');
  const isCyberpunk = (up === '#06b6d4' && down === '#f43f5e');
  const isSunset = (up === '#f59e0b' && down === '#ef4444');

  if (classicBtn) classicBtn.classList.toggle('active', isClassic);
  if (neonBtn) neonBtn.classList.toggle('active', isNeon);
  if (luxuryBtn) luxuryBtn.classList.toggle('active', isLuxury);
  if (cyberpunkBtn) cyberpunkBtn.classList.toggle('active', isCyberpunk);
  if (sunsetBtn) sunsetBtn.classList.toggle('active', isSunset);

  const matchedAny = isClassic || isNeon || isLuxury || isCyberpunk || isSunset;
  if (customBtn) customBtn.classList.toggle('active', !matchedAny);
}

function syncChartSettingsUI() {
  const upInput = document.getElementById('cs-input-up');
  const downInput = document.getElementById('cs-input-down');
  const upHex = document.getElementById('cs-hex-up');
  const downHex = document.getElementById('cs-hex-down');
  const bgInput = document.getElementById('cs-input-bg');
  const bgHex = document.getElementById('cs-hex-bg');
  const tzSelect = document.getElementById('cs-timezone-select');

  if (upInput) upInput.value = currentChartSettings.upColor;
  if (downInput) downInput.value = currentChartSettings.downColor;
  if (upHex) {
    if (upHex.tagName === 'INPUT') upHex.value = currentChartSettings.upColor;
    else upHex.textContent = currentChartSettings.upColor;
  }
  if (downHex) {
    if (downHex.tagName === 'INPUT') downHex.value = currentChartSettings.downColor;
    else downHex.textContent = currentChartSettings.downColor;
  }
  if (bgInput) bgInput.value = currentChartSettings.bgColor;
  if (bgHex) {
    if (bgHex.tagName === 'INPUT') bgHex.value = currentChartSettings.bgColor;
    else bgHex.textContent = currentChartSettings.bgColor;
  }
  if (tzSelect) tzSelect.value = currentChartSettings.timezone || 'Etc/UTC';

  // Sync color presets
  syncPresetHighlight();

  // Sync grid buttons
  ['hidden', 'subtle', 'visible'].forEach(g => {
    const btn = document.getElementById(`cs-grid-${g}`);
    if (btn) btn.classList.toggle('active', currentChartSettings.grid === g);
  });

  // Sync style buttons
  ['1', '9', '8', '2'].forEach(s => {
    const btn = document.getElementById(`cs-style-${s}`);
    if (btn) btn.classList.toggle('active', currentChartSettings.chartStyle === s);
  });

  // Sync background pills
  const curBg = (currentChartSettings.bgColor || '').toLowerCase();
  const bgMap = {
    '#080b11': 'cs-bg-obsidian',
    '#000000': 'cs-bg-pure',
    '#0c101a': 'cs-bg-navy',
    '#151c2c': 'cs-bg-slate'
  };
  let matchedBg = false;
  Object.entries(bgMap).forEach(([color, id]) => {
    const el = document.getElementById(id);
    const isMatch = (curBg === color.toLowerCase());
    if (el) el.classList.toggle('active', isMatch);
    if (isMatch) matchedBg = true;
  });

  const customBgPill = document.getElementById('cs-bg-custom');
  const customBgSwatch = document.getElementById('cs-bg-custom-swatch');
  if (customBgSwatch) customBgSwatch.style.backgroundColor = currentChartSettings.bgColor;
  if (customBgPill) customBgPill.classList.toggle('active', !matchedBg);

  syncIndicatorsUI();
}

function applyColorPreset(up, down, btn) {
  currentChartSettings.upColor = up;
  currentChartSettings.downColor = down;
  const upInput = document.getElementById('cs-input-up');
  const downInput = document.getElementById('cs-input-down');
  const upHex = document.getElementById('cs-hex-up');
  const downHex = document.getElementById('cs-hex-down');
  if (upInput) upInput.value = up;
  if (downInput) downInput.value = down;
  if (upHex) {
    if (upHex.tagName === 'INPUT') upHex.value = up;
    else upHex.textContent = up;
  }
  if (downHex) {
    if (downHex.tagName === 'INPUT') downHex.value = down;
    else downHex.textContent = down;
  }

  document.querySelectorAll('.cs-preset-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  syncPresetHighlight();
  saveChartSettings();
}

function activateCustomPresetPill() {
  document.querySelectorAll('.cs-preset-pill').forEach(p => p.classList.remove('active'));
  const customBtn = document.getElementById('cs-preset-custom');
  if (customBtn) customBtn.classList.add('active');
  const upInput = document.getElementById('cs-input-up');
  if (upInput) upInput.click();
}

function onCustomColorChange() {
  const upInput = document.getElementById('cs-input-up');
  const downInput = document.getElementById('cs-input-down');
  const upHex = document.getElementById('cs-hex-up');
  const downHex = document.getElementById('cs-hex-down');
  if (upInput) {
    currentChartSettings.upColor = upInput.value;
    if (upHex) {
      if (upHex.tagName === 'INPUT') upHex.value = upInput.value;
      else upHex.textContent = upInput.value;
    }
  }
  if (downInput) {
    currentChartSettings.downColor = downInput.value;
    if (downHex) {
      if (downHex.tagName === 'INPUT') downHex.value = downInput.value;
      else downHex.textContent = downInput.value;
    }
  }
  syncPresetHighlight();
  saveChartSettings();
}

function onCustomUpHexInput(val) {
  if (!val) return;
  let hex = val.trim();
  if (!hex.startsWith('#')) hex = '#' + hex;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    const upInput = document.getElementById('cs-input-up');
    if (upInput) upInput.value = hex;
    currentChartSettings.upColor = hex;
    syncPresetHighlight();
    saveChartSettings();
  }
}

function onCustomDownHexInput(val) {
  if (!val) return;
  let hex = val.trim();
  if (!hex.startsWith('#')) hex = '#' + hex;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    const downInput = document.getElementById('cs-input-down');
    if (downInput) downInput.value = hex;
    currentChartSettings.downColor = hex;
    syncPresetHighlight();
    saveChartSettings();
  }
}

function applyBgPreset(bg, btn) {
  currentChartSettings.bgColor = bg;
  document.querySelectorAll('.cs-bg-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const bgInput = document.getElementById('cs-input-bg');
  const bgHex = document.getElementById('cs-hex-bg');
  const customBgSwatch = document.getElementById('cs-bg-custom-swatch');
  if (bgInput) bgInput.value = bg;
  if (bgHex) {
    if (bgHex.tagName === 'INPUT') bgHex.value = bg;
    else bgHex.textContent = bg;
  }
  if (customBgSwatch) customBgSwatch.style.backgroundColor = bg;
  const chartBox = document.getElementById('trade-candlestick-container');
  if (chartBox) chartBox.style.backgroundColor = bg;
  saveChartSettings();
}

function onCustomBgColorChange(val) {
  if (!val) return;
  currentChartSettings.bgColor = val;
  const bgInput = document.getElementById('cs-input-bg');
  const bgHex = document.getElementById('cs-hex-bg');
  const customSwatch = document.getElementById('cs-bg-custom-swatch');
  const customPill = document.getElementById('cs-bg-custom');
  if (bgInput) bgInput.value = val;
  if (bgHex) {
    if (bgHex.tagName === 'INPUT') bgHex.value = val;
    else bgHex.textContent = val;
  }
  if (customSwatch) customSwatch.style.backgroundColor = val;

  document.querySelectorAll('.cs-bg-pill').forEach(p => p.classList.remove('active'));
  const bgMap = {
    '#080b11': 'cs-bg-obsidian',
    '#000000': 'cs-bg-pure',
    '#0c101a': 'cs-bg-navy',
    '#151c2c': 'cs-bg-slate'
  };
  const matchedPillId = bgMap[val.toLowerCase()];
  if (matchedPillId && document.getElementById(matchedPillId)) {
    document.getElementById(matchedPillId).classList.add('active');
  } else if (customPill) {
    customPill.classList.add('active');
  }

  const chartBox = document.getElementById('trade-candlestick-container');
  if (chartBox) chartBox.style.backgroundColor = val;
  saveChartSettings();
}

function onCustomBgHexInput(val) {
  if (!val) return;
  let hex = val.trim();
  if (!hex.startsWith('#')) hex = '#' + hex;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    onCustomBgColorChange(hex);
  }
}

function setChartGrid(grid) {
  currentChartSettings.grid = grid;
  ['hidden', 'subtle', 'visible'].forEach(g => {
    const btn = document.getElementById(`cs-grid-${g}`);
    if (btn) btn.classList.toggle('active', g === grid);
  });
  saveChartSettings();
}

function setChartStyle(style) {
  currentChartStyle = style;
  currentChartSettings.chartStyle = style;
  ['1', '9', '8', '2'].forEach(s => {
    const btn = document.getElementById(`cs-style-${s}`);
    if (btn) btn.classList.toggle('active', s === style);
  });
  const styleSelect = document.getElementById('cs-style-select');
  if (styleSelect) styleSelect.value = style;
  saveChartSettings();
}

function onTimezoneChange(tz) {
  currentChartSettings.timezone = tz;
  saveChartSettings();
}

function updateChartSettings() {
  const styleSelect = document.getElementById('cs-style-select');
  if (styleSelect) {
    setChartStyle(styleSelect.value);
  }
  saveChartSettings();
  renderTradingViewChart(true);
}

function resetChartSettingsToDefault() {
  currentChartSettings = { ...DEFAULT_CHART_SETTINGS };
  activeChartIndicators = [];
  chartCountdownEnabled = true;
  saveChartSettings();
  syncChartSettingsUI();
  syncIndicatorsUI();
  renderTradingViewChart(true);
  const fsModal = document.getElementById('tv-fullscreen-modal');
  if (fsModal && !fsModal.classList.contains('hidden')) {
    openFullscreenChart(true);
  }
  showToast('Chart settings reset to default');
}

function saveAndApplyChartSettings() {
  const upInput = document.getElementById('cs-input-up');
  const downInput = document.getElementById('cs-input-down');
  const bgInput = document.getElementById('cs-input-bg');
  const tzSelect = document.getElementById('cs-timezone-select');
  const styleSelect = document.getElementById('cs-style-select');

  if (upInput && upInput.value) currentChartSettings.upColor = upInput.value;
  if (downInput && downInput.value) currentChartSettings.downColor = downInput.value;
  if (bgInput && bgInput.value) currentChartSettings.bgColor = bgInput.value;
  if (tzSelect && tzSelect.value) currentChartSettings.timezone = tzSelect.value;
  if (styleSelect && styleSelect.value) currentChartSettings.chartStyle = styleSelect.value;

  saveChartSettings();
  closeFsSettings();
  const fsModal = document.getElementById('tv-fullscreen-modal');
  if (fsModal && !fsModal.classList.contains('hidden')) {
    openFullscreenChart(true);
  }
  renderTradingViewChart(true);
  showToast('Chart colors & settings applied!', 'success');
}

function toggleChartIndicator(studyId) {
  const idx = activeChartIndicators.indexOf(studyId);
  const studyNames = {
    'Volume@tv-basicstudies': 'Volume',
    'MASimple@tv-basicstudies': 'Moving Average (MA)',
    'MAExp@tv-basicstudies': 'Exponential MA (EMA)',
    'RSI@tv-basicstudies': 'Relative Strength (RSI)',
    'MACD@tv-basicstudies': 'MACD',
    'BB@tv-basicstudies': 'Bollinger Bands'
  };
  const name = studyNames[studyId] || studyId;
  if (idx !== -1) {
    activeChartIndicators.splice(idx, 1);
    showToast(`${name} indicator removed`, 'info');
  } else {
    activeChartIndicators.push(studyId);
    showToast(`${name} indicator saved & active!`, 'success');
  }
  saveChartSettings();
  syncIndicatorsUI();
  renderTradingViewChart(true);
}

function toggleChartCountdown(enabled) {
  chartCountdownEnabled = !!enabled;
  saveChartSettings();
  syncIndicatorsUI();
  renderTradingViewChart(true);
  showToast(`Bar countdown: ${chartCountdownEnabled ? 'ON (Saved)' : 'OFF (Saved)'}`, 'info');
}

function toggleIndicatorsDropdown(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const dd = document.getElementById('tcb-ind-dropdown');
  if (dd) dd.classList.toggle('hidden');
}

function closeIndicatorsDropdown() {
  const dd = document.getElementById('tcb-ind-dropdown');
  if (dd) dd.classList.add('hidden');
}

function syncIndicatorsUI() {
  const indMap = {
    'Volume@tv-basicstudies': ['tcb-ind-volume', 'cs-ind-volume'],
    'MASimple@tv-basicstudies': ['tcb-ind-ma', 'cs-ind-ma'],
    'MAExp@tv-basicstudies': ['tcb-ind-ema', 'cs-ind-ema'],
    'RSI@tv-basicstudies': ['tcb-ind-rsi', 'cs-ind-rsi'],
    'MACD@tv-basicstudies': ['tcb-ind-macd', 'cs-ind-macd'],
    'BB@tv-basicstudies': ['tcb-ind-bb', 'cs-ind-bb']
  };

  Object.keys(indMap).forEach(key => {
    const isAct = activeChartIndicators.includes(key);
    const [tcbId, csId] = indMap[key];
    const tcbEl = document.getElementById(tcbId);
    if (tcbEl && tcbEl.classList) {
      tcbEl.classList.toggle('active', isAct);
      const st = (typeof tcbEl.querySelector === 'function') ? tcbEl.querySelector('.ind-status') : null;
      if (st) st.textContent = isAct ? 'ON' : 'OFF';
    }
    const csEl = document.getElementById(csId);
    if (csEl && csEl.classList) {
      csEl.classList.toggle('active', isAct);
    }
  });

  const countEl = document.getElementById('tcb-ind-count');
  if (countEl) {
    countEl.textContent = activeChartIndicators.length;
    if (countEl.classList) countEl.classList.toggle('active', activeChartIndicators.length > 0);
  }

  const tcbCd = document.getElementById('tcb-ind-countdown-input');
  if (tcbCd) tcbCd.checked = chartCountdownEnabled;
  const csCd = document.getElementById('cs-countdown-input');
  if (csCd) csCd.checked = chartCountdownEnabled;
}

function selectCoinAndTrade(coinId) {
  const coin = COINS.find(c => c.id === coinId || c.symbol.toLowerCase() === coinId.toLowerCase());
  if (coin) {
    selectedCoin = coin;
    try {
      localStorage.setItem('vtrade_selected_coin', coin.id);
      persistSelectedCoinState();
    } catch (e) {}
    switchBottomTab('trade');
    renderTradeScreen();
    renderTradingViewChart(true);
    fetchRealBinanceCandles();
    if (typeof updateDesktopOrderCalculations === 'function') updateDesktopOrderCalculations();
  }
}

function renderTradeScreen() {
  // Update header asset details
  const curIcon = document.getElementById('trade-cur-icon');
  const curSym = document.getElementById('trade-cur-sym');
  const curFull = document.getElementById('trade-cur-fullname');
  const livePriceEl = document.getElementById('trade-header-price');
  const liveChangeEl = document.getElementById('trade-header-change');

  if (curIcon) {
    curIcon.src = selectedCoin.icon;
    curIcon.onerror = function() { handleCoinIconError(this, selectedCoin.symbol, selectedCoin.category); };
  }
  const currentChange = (selectedCoin.chartChange !== undefined && !isNaN(selectedCoin.chartChange))
    ? selectedCoin.chartChange
    : ((selectedCoin.change24h !== undefined && !isNaN(selectedCoin.change24h))
        ? selectedCoin.change24h
        : (typeof selectedCoin.change === 'number' && !isNaN(selectedCoin.change) ? selectedCoin.change : 0));
  const isUp = currentChange >= 0;
  if (livePriceEl) livePriceEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
  if (liveChangeEl) {
    liveChangeEl.className = `trade-live-change ${isUp ? 'up' : 'down'}`;
    liveChangeEl.textContent = `${isUp ? '+' : ''}${currentChange.toFixed(2)}%`;
  }

  // Update Full-Width Top Instrument Bar
  const coinIcon = document.getElementById('trade-coin-icon');
  const coinPair = document.getElementById('trade-coin-pair');
  const coinCat = document.getElementById('trade-coin-cat');
  const coinName = document.getElementById('trade-coin-name');
  const priceVal = document.getElementById('trade-price-val');
  const changeVal = document.getElementById('trade-change-val');
  const highVal = document.getElementById('trade-high-val');
  const lowVal = document.getElementById('trade-low-val');
  const volVal = document.getElementById('trade-vol-val');

  if (coinIcon) {
    coinIcon.src = selectedCoin.icon;
    coinIcon.onerror = function() { handleCoinIconError(this, selectedCoin.symbol, selectedCoin.category); };
  }
  if (coinPair) coinPair.textContent = getCoinDisplayPair(selectedCoin);
  if (coinCat) coinCat.textContent = (selectedCoin.category || 'FUTURES').toUpperCase();
  if (coinName) coinName.textContent = selectedCoin.name;
  if (priceVal) {
    priceVal.className = `tib-live-price ${isUp ? 'up' : 'down'}`;
    priceVal.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
  }
  const priceArrow = document.getElementById('trade-price-arrow');
  if (priceArrow) {
    priceArrow.textContent = isUp ? '↑' : '↓';
    priceArrow.className = `tib-price-arrow ${isUp ? 'up' : 'down'}`;
  }
  const tabPair = document.getElementById('trade-coin-tab-pair');
  const tabPrice = document.getElementById('trade-coin-tab-price');
  if (tabPair) tabPair.textContent = `${selectedCoin.symbol}-USDT`;
  if (tabPrice) tabPrice.textContent = fmtPrice(selectedCoin.price);

  if (changeVal) {
    changeVal.className = `tib-val ${isUp ? 'up' : 'down'}`;
    changeVal.textContent = `${isUp ? '+' : ''}${currentChange.toFixed(2)}%`;
  }
  if (highVal) highVal.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.high || selectedCoin.price)}`;
  if (lowVal) lowVal.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.low || selectedCoin.price)}`;
  if (volVal) volVal.textContent = `${selectedCoin.vol ? (selectedCoin.vol.includes('M') ? selectedCoin.vol + ' USDT' : selectedCoin.vol) : 'N/A'}`;

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
  renderTradeBottomLedger();
  renderTradeDeskOrderBookAndTrades();
  fetchFastCoinTicker(selectedCoin.binanceSym);
  connectCoinTickerWs(selectedCoin.binanceSym);
  fetchRealBinanceCandles();
  updateDesktopOrderCalculations();
}

async function fetchFastCoinTicker(binanceSym) {
  if (!binanceSym) return;
  if (selectedCoin && (selectedCoin.id === 'gold' || binanceSym === 'PAXGUSDT')) {
    await pollLiveGoldPrice();
    return;
  }
  const urls = [
    `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${binanceSym}`,
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSym}`,
    getApiEndpoint('/api/prices')
  ];
  for (const url of urls) {
    try {
      const ctl = new AbortController();
      const tmr = setTimeout(() => ctl.abort(), 2200);
      const resp = await fetch(url, { signal: ctl.signal });
      clearTimeout(tmr);
      if (resp.ok) {
        const d = await resp.json();
        const item = d && d.lastPrice ? d : (d && d.prices && selectedCoin && d.prices[selectedCoin.id] ? {
          lastPrice: d.prices[selectedCoin.id].price,
          priceChangePercent: d.prices[selectedCoin.id].change24h,
          openPrice: d.prices[selectedCoin.id].dailyOpen,
          highPrice: d.prices[selectedCoin.id].high24h,
          lowPrice: d.prices[selectedCoin.id].low24h,
          quoteVolume: d.prices[selectedCoin.id].volume24h
        } : null);

        if (item && item.lastPrice) {
          const p = parseFloat(item.lastPrice);
          const chg = parseFloat(item.priceChangePercent);
          const o = parseFloat(item.openPrice);
          if (p > 0 && !isNaN(p) && selectedCoin && selectedCoin.binanceSym === binanceSym) {
            selectedCoin.price = p;
            if (!isNaN(chg)) {
              selectedCoin.change = chg;
              selectedCoin.change24h = chg;
            }
            if (o > 0 && !isNaN(o)) selectedCoin.open24h = o;
            if (item.highPrice && parseFloat(item.highPrice) > 0) selectedCoin.high = parseFloat(item.highPrice);
            if (item.lowPrice && parseFloat(item.lowPrice) > 0) selectedCoin.low = parseFloat(item.lowPrice);
            if (item.quoteVolume) {
              const qv = parseFloat(item.quoteVolume);
              selectedCoin.vol = qv >= 1e9 ? (qv / 1e9).toFixed(2) + 'B' : (qv / 1e6).toFixed(1) + 'M';
            }
            if (selectedCoin.candleOpen && selectedCoin.candleOpen > 0) {
              selectedCoin.chartChange = parseFloat((((p - selectedCoin.candleOpen) / selectedCoin.candleOpen) * 100).toFixed(2));
            }
            persistSelectedCoinState();
            renderLivePriceUpdates();
            break;
          }
        }
      }
    } catch (e) {}
  }
}

// ─── CANDLE CLOSING COUNTDOWN ENGINE (DYNAMIC PER TIMEFRAME) ───────────────
function getCandleRemainingSeconds(interval) {
  const now = new Date();
  const nowMs = now.getTime();
  const nowSec = Math.floor(nowMs / 1000);

  const tfSeconds = {
    '1m': 60,
    '3m': 180,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '2h': 7200,
    '4h': 14400,
    '1d': 86400
  };

  const period = tfSeconds[interval] || 900; // default to 15m

  if (interval === '1d') {
    const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return Math.max(0, Math.floor((utcMidnight - nowMs) / 1000));
  }

  if (interval === '1w') {
    const day = now.getUTCDay();
    const daysUntilNextSunday = (7 - day) % 7 || 7;
    const nextSundayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilNextSunday);
    return Math.max(0, Math.floor((nextSundayUtc - nowMs) / 1000));
  }

  if (interval === '1M') {
    const nextMonthUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    return Math.max(0, Math.floor((nextMonthUtc - nowMs) / 1000));
  }

  return period - (nowSec % period);
}

function formatCountdownTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

let candleCountdownInterval = null;

function updateCandleCountdown() {
  const timerEl = document.getElementById('ccw-timer');
  const tagEl = document.getElementById('ccw-tf-tag');
  const priceEl = document.getElementById('ccw-scale-price');
  const wrapEl = document.getElementById('candle-countdown-wrap');
  if (!timerEl) return;

  const activeTf = chartInterval || '15m';
  if (tagEl) tagEl.textContent = activeTf;

  const remSec = getCandleRemainingSeconds(activeTf);
  timerEl.textContent = formatCountdownTime(remSec);

  if (selectedCoin) {
    if (priceEl) {
      priceEl.textContent = fmtPrice(selectedCoin.price);
    }
    if (wrapEl) {
      const activeChg = selectedCoin.chartChange !== undefined ? selectedCoin.chartChange : selectedCoin.change;
      const isUp = activeChg >= 0;
      wrapEl.classList.toggle('is-bull', isUp);
      wrapEl.classList.toggle('is-bear', !isUp);

      // Calibrate vertical position on the price scale matching SS 2
      if (selectedCoin.high && selectedCoin.low && selectedCoin.high > selectedCoin.low) {
        const range = selectedCoin.high - selectedCoin.low;
        const ratio = Math.max(0.12, Math.min(0.88, (selectedCoin.price - selectedCoin.low) / range));
        // Chart box height 370px, header ~38px, footer ~28px
        const chartH = 370 - 38 - 28 - 30;
        const topY = 38 + (1 - ratio) * chartH;
        wrapEl.style.top = `${Math.round(topY)}px`;
      }
    }
  }
}

function startCandleCountdownEngine() {
  if (candleCountdownInterval) clearInterval(candleCountdownInterval);
  updateCandleCountdown();
  candleCountdownInterval = setInterval(updateCandleCountdown, 1000);
}

// ─── 12. EXACT 11 TIMEFRAMES CANDLESTICK ENGINE ──────────────────────────
// Timeframes: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 1d, 1w, 1M
function setChartInterval(interval) {
  chartInterval = interval;
  try {
    localStorage.setItem('vtrade_chart_interval', interval);
  } catch (e) {}
  const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M'];
  intervals.forEach(i => {
    const btn = document.getElementById(`ctf-${i}`);
    if (btn) btn.classList.toggle('active', i === interval);
  });
  showToast(`Timeframe: ${interval}`, 'info');
  if (typeof updateCandleCountdown === 'function') updateCandleCountdown();
  renderTradingViewChart(true);
  fetchRealBinanceCandles();
  if (selectedCoin && selectedCoin.binanceSym && selectedCoin.binanceSym !== 'PAXGUSDT') {
    connectCoinTickerWs(selectedCoin.binanceSym);
  }
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

          // Synchronize chart candle gain/loss
          const curCandle = chartCandlesData[chartCandlesData.length - 1];
          if (curCandle && curCandle.open > 0) {
            if (selectedCoin.id === 'gold') {
              if (!selectedCoin.candleOpen) selectedCoin.candleOpen = selectedCoin.open || 3992.60;
              const livePrice = selectedCoin.price || curCandle.close;
              const diff = livePrice - selectedCoin.candleOpen;
              selectedCoin.chartChange = parseFloat(((diff / selectedCoin.candleOpen) * 100).toFixed(2));
            } else {
              selectedCoin.candleOpen = curCandle.open;
              const livePrice = (selectedCoin && selectedCoin.price) || curCandle.close;
              const diff = livePrice - curCandle.open;
              selectedCoin.chartChange = parseFloat(((diff / curCandle.open) * 100).toFixed(2));
            }
            persistSelectedCoinState();
            renderLivePriceUpdates();
          }
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
  const lastC = chartCandlesData[chartCandlesData.length - 1];
  if (lastC && lastC.open > 0) {
    selectedCoin.candleOpen = lastC.open;
    selectedCoin.chartChange = parseFloat((((selectedCoin.price - lastC.open) / lastC.open) * 100).toFixed(2));
    persistSelectedCoinState();
  }
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
let orderbookEngineTimer = null;
function startOrderbookLiveEngine() {
  if (orderbookEngineTimer) clearInterval(orderbookEngineTimer);
  orderbookEngineTimer = setInterval(() => {
    if (activeTab === 'trade') {
      const obPanel = document.getElementById('tpanel-orderbook');
      if (obPanel && !obPanel.classList.contains('hidden')) {
        renderOrderbook();
      }
      renderTradeDeskOrderBookAndTrades();
    }
  }, 1000); // 1-second real-time depth stream for all coins (including Gold!)
}

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
  if (tab === 'orderbook') {
    renderOrderbook();
  }
}

// ─── 14. SLIDE-UP ORDER BOTTOM SHEET (COINBASE STYLE) ───────────────────
function openOrderSheet(side) {
  sheetSide = side; // 'long' or 'short'

  const backdrop = document.getElementById('order-sheet-backdrop');
  const container = document.getElementById('order-sheet-container');
  const badge = document.getElementById('sheet-side-badge');
  const pairTitle = document.getElementById('sheet-pair-title');
  const confirmBtn = document.getElementById('sheet-confirm-btn');
  const sizeInput = document.getElementById('sheet-size-input');
  const unitLabel = document.getElementById('sheet-qty-unit-label') || document.getElementById('sheet-coin-unit');
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
  const availableFunds = (walletState.cashBalance && walletState.cashBalance >= 10) ? walletState.cashBalance : 10000;
  const defaultNotional = availableFunds * 0.05 * sheetLeverage;
  sheetSizeCoins = Math.max(0.001, parseFloat((defaultNotional / (selectedCoin.price || 80000)).toFixed(4)));
  if (sizeInput) sizeInput.value = sheetSizeCoins;

  // Set leverage slider max to coin max
  const levSlider = document.getElementById('sheet-leverage-slider');
  if (levSlider) {
    levSlider.max = selectedCoin.maxLev || 150;
    levSlider.value = Math.min(sheetLeverage, selectedCoin.maxLev || 150);
  }

  updateOrderSheetCalculations();

  if (backdrop) backdrop.classList.remove('hidden');
  if (container) container.classList.remove('hidden');
}

function closeOrderSheet() {
  const backdrop = document.getElementById('order-sheet-backdrop');
  const container = document.getElementById('order-sheet-container');
  if (backdrop) backdrop.classList.add('hidden');
  if (container) container.classList.add('hidden');
}

function setOrderSheetType(type) {
  sheetOrderType = type;
  const mBtn = document.getElementById('sot-market');
  const lBtn = document.getElementById('sot-limit');
  const limitInputWrap = document.getElementById('sheet-limit-input-wrap') || document.getElementById('sheet-limit-group');

  if (mBtn) mBtn.classList.toggle('active', type === 'market');
  if (lBtn) lBtn.classList.toggle('active', type === 'limit');
  if (limitInputWrap) limitInputWrap.classList.toggle('hidden', type !== 'limit');

  updateOrderSheetCalculations();
}

function setOrderSheetLeverage(lev) {
  sheetLeverage = Math.min(lev, selectedCoin.maxLev || 150);
  const slider = document.getElementById('sheet-leverage-slider');
  if (slider) slider.value = sheetLeverage;

  const chips = document.querySelectorAll('.sc-chip, .sheet-lchip');
  chips.forEach(c => {
    c.classList.toggle('active', c.textContent.trim() === `${sheetLeverage}x`);
  });

  updateOrderSheetCalculations();
}

function handleLeverageSliderInput(val) {
  sheetLeverage = parseInt(val, 10);
  const badge = document.getElementById('sheet-lev-value-badge') || document.getElementById('sheet-lev-val');
  if (badge) badge.textContent = `${sheetLeverage}x`;

  const chips = document.querySelectorAll('.sc-chip, .sheet-lchip');
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
  const numericPct = pct > 1 ? pct / 100 : pct;
  const availableCash = (walletState.cashBalance && walletState.cashBalance >= 10) ? walletState.cashBalance : 10000;
  const maxNotional = availableCash * sheetLeverage * numericPct;
  sheetSizeCoins = Math.max(0.0001, parseFloat((maxNotional / (selectedCoin.price || 80000)).toFixed(4)));

  const sizeInput = document.getElementById('sheet-size-input');
  if (sizeInput) sizeInput.value = sheetSizeCoins;

  const chips = document.querySelectorAll('.sheet-pchip');
  chips.forEach(c => {
    c.classList.toggle('active', c.textContent.trim() === `${Math.round(numericPct * 100)}%`);
  });

  updateOrderSheetCalculations();
}

function updateOrderSheetCalculations() {
  const badge = document.getElementById('sheet-lev-value-badge') || document.getElementById('sheet-lev-val');
  if (badge) badge.textContent = `${sheetLeverage}x`;

  const price = sheetOrderType === 'limit' 
    ? (parseFloat(document.getElementById('sheet-limit-price')?.value) || selectedCoin.price)
    : selectedCoin.price;

  const notionalUsd = sheetSizeCoins * price;
  const reqMarginUsd = notionalUsd / sheetLeverage;

  const liqFactor = (1 / sheetLeverage) * 0.9;
  const liqPrice = sheetSide === 'long' 
    ? price * (1 - liqFactor) 
    : price * (1 + liqFactor);

  const notionalEl = document.getElementById('scalc-notional');
  const marginEl = document.getElementById('scalc-margin');
  const liqEl = document.getElementById('scalc-liq-price');
  const maxEl = document.getElementById('sheet-max-size');

  if (notionalEl) notionalEl.textContent = `${getCurrencySymbol()}${fmtMoney(notionalUsd)}`;
  if (marginEl) marginEl.textContent = `${getCurrencySymbol()}${fmtMoney(reqMarginUsd)}`;
  if (liqEl) liqEl.textContent = `${getCurrencySymbol()}${fmtPrice(Math.max(0, liqPrice))}`;
  if (maxEl) {
    const maxCoins = (((walletState.cashBalance && walletState.cashBalance >= 10) ? walletState.cashBalance : 10000) * sheetLeverage) / price;
    maxEl.textContent = `Max: ${maxCoins.toFixed(3)} ${selectedCoin.symbol}`;
  }
}

// Window scope aliases
window.openOrderSheet = openOrderSheet;
window.closeOrderSheet = closeOrderSheet;
window.setOrderSheetType = setOrderSheetType;
window.setSheetOrderType = setOrderSheetType;
window.setOrderSheetLeverage = setOrderSheetLeverage;
window.setSheetLeverage = setOrderSheetLeverage;
window.handleLeverageSliderInput = handleLeverageSliderInput;
window.handleSheetLeverageInput = handleLeverageSliderInput;
window.handleSizeInput = handleSizeInput;
window.handleSheetSizeInput = handleSizeInput;
window.setOrderSheetPct = setOrderSheetPct;
window.setSheetOrderPct = setOrderSheetPct;
window.updateOrderSheetCalculations = updateOrderSheetCalculations;
window.updateSheetCalculations = updateOrderSheetCalculations;
window.executeOrderFromSheet = executeOrderFromSheet;

// ─── 15. ORDER EXECUTION (REAL WORKING PAPER TRADING) ───────────────────
function executeOrderFromSheet() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (typeof updateNetworkStatus === 'function') updateNetworkStatus(false);
    showToast('Cannot execute trade while offline. Please connect to internet.', 'error');
    return;
  }

  const sess = getAuthSession();
  const isAuthedSession = !!(sess && sess.email && !sess.isGuest);

  if (!isAuthedSession) {
    showToast('Authentication required. Please sign in with a registered account to trade.', 'error');
    openAuthModal('login');
    return;
  }

  // Ensure current authenticated user is registered locally
  saveRegisteredUser({
    username: sess.username || sess.email.split('@')[0],
    email: sess.email,
    balance: walletState.cashBalance || 10000
  });

  const price = sheetOrderType === 'limit' 
    ? (parseFloat(document.getElementById('sheet-limit-price')?.value) || selectedCoin.price)
    : selectedCoin.price;

  const notionalUsd = sheetSizeCoins * price;
  const reqMarginUsd = notionalUsd / sheetLeverage;

  if (reqMarginUsd > walletState.cashBalance) {
    if (walletState.cashBalance < 5) {
      refillPaperDemoBalance();
      showToast(`⚠️ Low funds refilled to ${getCurrencySymbol()}${fmtMoney(10000.00)}! Order executing...`, 'info');
    } else {
      showToast(`❌ Insufficient funds! Required: ${getCurrencySymbol()}${fmtMoney(reqMarginUsd)}, Available: ${getCurrencySymbol()}${fmtMoney(walletState.cashBalance)}`, 'error');
      return;
    }
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
    walletState.lastUpdated = Date.now();
    saveWalletState();
    closeOrderSheet();
    syncWalletWithCloud(true);
    renderTradeBottomLedger();
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

    walletState.lastUpdated = Date.now();
    saveWalletState();
    closeOrderSheet();
    syncWalletWithCloud(true);
    renderTradeBottomLedger();
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
  walletState.lastUpdated = Date.now();
  saveWalletState();
  syncWalletWithCloud(true);
  renderTradeBottomLedger();

  const isProfit = pnlUsd >= 0;
  showToast(`Position Closed! Realized PnL: ${isProfit ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnlUsd)}`, isProfit ? 'success' : 'error');

  renderAllViews();
}

function cancelPendingOrder(orderId) {
  const idx = walletState.orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;
  walletState.orders.splice(idx, 1);
  walletState.lastUpdated = Date.now();
  saveWalletState();
  syncWalletWithCloud(true);
  renderTradeBottomLedger();
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
  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const isAuthedSession = !!(sess && !sess.isGuest && sess.email);

  const authGate = document.getElementById('pf-auth-gate');
  const authedContent = document.getElementById('pf-authed-content');

  if (!isAuthedSession) {
    if (authGate) authGate.classList.remove('hidden');
    if (authedContent) authedContent.classList.add('hidden');
    return;
  }

  if (authGate) authGate.classList.add('hidden');
  if (authedContent) authedContent.classList.remove('hidden');

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
        <img class="coin-avatar-img" src="${c.icon}" alt="${c.name}" style="width:28px;height:28px;" onerror="handleCoinIconError(this, '${c.symbol}', '${c.category || ''}')" />
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
    try {
      localStorage.setItem('vtrade_selected_coin', coin.id);
    } catch (e) {}
    closeCoinPickerModal();
    renderTradeScreen();
    renderTradingViewChart();
    fetchRealBinanceCandles();
    const fsModal = document.getElementById('tv-fullscreen-modal');
    if (fsModal && !fsModal.classList.contains('hidden')) {
      openFullscreenChart();
    }
  }
}

// ─── 19. LIVE PRICE TICK STREAMING (BINANCE API + WS + PROXY) ───────────
let liveTickerWs = null;

let lastWsRenderTime = 0;
let wsRenderTimer = null;

let goldLivePollTimer = null;

async function pollLiveGoldPrice() {
  try {
    const goldCtl = new AbortController();
    const goldTmr = setTimeout(() => goldCtl.abort(), 2500);
    let tvGold = null;
    try {
      const tvResp = await fetch('https://scanner.tradingview.com/symbol?symbol=TVC:GOLD&fields=close,change,change_abs,open,high,low', { signal: goldCtl.signal });
      if (tvResp && tvResp.ok) tvGold = await tvResp.json();
    } catch (e) {}

    const gold = COINS.find(c => c.id === 'gold');
    if (gold) {
      if (tvGold && typeof tvGold.close === 'number' && tvGold.close > 0) {
        gold.price = parseFloat(tvGold.close.toFixed(2));
        if (typeof tvGold.change === 'number') {
          gold.change = parseFloat(tvGold.change.toFixed(2));
          gold.change24h = gold.change;
          gold.chartChange = gold.change;
        }
        if (typeof tvGold.open === 'number') {
          gold.open = parseFloat(tvGold.open.toFixed(2));
          gold.open24h = gold.open;
          gold.candleOpen = gold.open;
        }
        if (typeof tvGold.high === 'number') gold.high = parseFloat(tvGold.high.toFixed(2));
        if (typeof tvGold.low === 'number') gold.low = parseFloat(tvGold.low.toFixed(2));
      } else {
        const goldR = await fetch('https://api.gold-api.com/price/XAU', { signal: goldCtl.signal }).then(r => r.json()).catch(() => null);
        if (goldR && goldR.price) {
          gold.price = parseFloat(parseFloat(goldR.price).toFixed(2));
          if (!gold.open || gold.open > 4100) gold.open = 3992.60;
          const diff = gold.price - gold.open;
          gold.change = parseFloat(((diff / gold.open) * 100).toFixed(2));
          gold.change24h = gold.change;
          gold.chartChange = gold.change;
        } else {
          const bResp = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=PAXGUSDT', { signal: goldCtl.signal }).then(r => r.json()).catch(() => null);
          if (bResp && bResp.lastPrice) {
            gold.price = parseFloat(parseFloat(bResp.lastPrice).toFixed(2));
            if (bResp.priceChangePercent) {
              gold.change = parseFloat(parseFloat(bResp.priceChangePercent).toFixed(2));
              gold.change24h = gold.change;
              gold.chartChange = gold.change;
            }
            if (bResp.openPrice) gold.open = parseFloat(parseFloat(bResp.openPrice).toFixed(2));
            if (bResp.highPrice) gold.high = parseFloat(parseFloat(bResp.highPrice).toFixed(2));
            if (bResp.lowPrice) gold.low = parseFloat(parseFloat(bResp.lowPrice).toFixed(2));
          }
        }
      }
      if (selectedCoin && selectedCoin.id === 'gold') {
        selectedCoin.price = gold.price;
        selectedCoin.change = gold.change;
        selectedCoin.change24h = gold.change24h;
        selectedCoin.chartChange = gold.chartChange;
        selectedCoin.open = gold.open;
        selectedCoin.open24h = gold.open;
        selectedCoin.candleOpen = gold.candleOpen || gold.open;
        if (gold.high) selectedCoin.high = gold.high;
        if (gold.low) selectedCoin.low = gold.low;
        persistSelectedCoinState();
        if (activeTab === 'trade') {
          renderLivePriceUpdates();
          if (typeof updateDesktopOrderCalculations === 'function') updateDesktopOrderCalculations();
        }
      }
    }
    clearTimeout(goldTmr);
  } catch (gErr) {}
}

function startGoldLivePolling() {
  if (goldLivePollTimer) clearInterval(goldLivePollTimer);
  goldLivePollTimer = setInterval(() => {
    if (activeTab === 'trade' && selectedCoin && selectedCoin.id === 'gold') {
      pollLiveGoldPrice();
    }
  }, 1500); // 1.5-second live sync with TradingView chart
}

function connectCoinTickerWs(binanceSym) {
  if (typeof WebSocket === 'undefined' || !binanceSym) return;
  if (liveTickerWs) {
    try { liveTickerWs.close(); } catch (e) {}
    liveTickerWs = null;
  }
  if (wsRenderTimer) {
    clearTimeout(wsRenderTimer);
    wsRenderTimer = null;
  }
  if (binanceSym === 'PAXGUSDT' || (selectedCoin && selectedCoin.id === 'gold')) {
    pollLiveGoldPrice();
    return; // Gold uses direct TVC:GOLD TradingView scanner feed
  }

  const binanceTfMap = {
    '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
    '1h': '1h', '2h': '2h', '4h': '4h', '1d': '1d', '1w': '1w', '1M': '1M'
  };
  const bTf = binanceTfMap[chartInterval] || '1h';
  const sym = binanceSym.toLowerCase();

  // Connect to Binance official real-time ticker stream with vision and kline fallbacks
  const endpoints = [
    `wss://stream.binance.com:9443/stream?streams=${sym}@kline_${bTf}/${sym}@ticker`,
    `wss://data-stream.binance.vision/stream?streams=${sym}@kline_${bTf}/${sym}@ticker`,
    `wss://stream.binance.com:9443/ws/${sym}@kline_${bTf}`,
    `wss://data-stream.binance.vision/ws/${sym}@kline_${bTf}`,
    `wss://stream.binance.com:9443/ws/${sym}@ticker`
  ];

  let endpointIdx = 0;

  function tryConnect() {
    if (activeTab !== 'trade' || !selectedCoin || selectedCoin.binanceSym !== binanceSym) return;
    try {
      const url = endpoints[endpointIdx % endpoints.length];
      liveTickerWs = new WebSocket(url);

      liveTickerWs.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const d = raw.data || raw;
          if (d && selectedCoin && (d.s === binanceSym || !d.s || selectedCoin.binanceSym === binanceSym)) {
            let newPrice = 0;
            let changePercent = null;
            let high = null;
            let low = null;

            if (d.k) {
              // Fallback kline payload: live price tick
              newPrice = parseFloat(d.k.c);
              const openPrice = parseFloat(d.k.o);
              if (openPrice > 0 && !isNaN(openPrice)) {
                selectedCoin.candleOpen = openPrice;
                selectedCoin.chartChange = parseFloat((((newPrice - openPrice) / openPrice) * 100).toFixed(2));
              }
              // Do NOT overwrite 24h High / Low with single-candle d.k.h / d.k.l!
            } else if (d.e === '24hrTicker' || (d.c && d.P !== undefined)) {
              // Direct Binance 24hrTicker stream payload
              newPrice = parseFloat(d.c);
              if (d.o && !isNaN(parseFloat(d.o)) && parseFloat(d.o) > 0) {
                selectedCoin.open24h = parseFloat(d.o);
              }
              if (d.P !== undefined && !isNaN(parseFloat(d.P))) {
                changePercent = parseFloat(d.P);
                selectedCoin.change = changePercent;
                selectedCoin.change24h = changePercent;
              }
              // Strictly capture true 24-hour high and low from 24hr ticker
              if (d.h) high = parseFloat(d.h);
              if (d.l) low = parseFloat(d.l);
            }

            if (newPrice > 0 && !isNaN(newPrice)) {
              selectedCoin.price = newPrice;
              if (selectedCoin.candleOpen && selectedCoin.candleOpen > 0) {
                selectedCoin.chartChange = parseFloat((((newPrice - selectedCoin.candleOpen) / selectedCoin.candleOpen) * 100).toFixed(2));
              } else if (chartCandlesData && chartCandlesData.length > 0) {
                const curC = chartCandlesData[chartCandlesData.length - 1];
                if (curC && curC.open > 0) {
                  selectedCoin.candleOpen = curC.open;
                  selectedCoin.chartChange = parseFloat((((newPrice - curC.open) / curC.open) * 100).toFixed(2));
                }
              }
              if (selectedCoin.open24h && selectedCoin.open24h > 0) {
                const live24hChg = parseFloat((((newPrice - selectedCoin.open24h) / selectedCoin.open24h) * 100).toFixed(2));
                selectedCoin.change24h = live24hChg;
                selectedCoin.change = live24hChg;
              } else if (changePercent !== null && !isNaN(changePercent)) {
                selectedCoin.change = changePercent;
                selectedCoin.change24h = changePercent;
              }
              if (high && !isNaN(high) && high > 0) selectedCoin.high = high;
              if (low && !isNaN(low) && low > 0) selectedCoin.low = low;

              persistSelectedCoinState();

              // Immediate order checking (0ms latency for limits/triggers)
              checkPendingOrdersTrigger();

              // Smooth 150ms DOM update throttle: eliminates rapid buzzing & matches TradingView cadence
              const now = Date.now();
              if (now - lastWsRenderTime >= 150) {
                lastWsRenderTime = now;
                if (wsRenderTimer) { clearTimeout(wsRenderTimer); wsRenderTimer = null; }
                renderLivePriceUpdates();
              } else if (!wsRenderTimer) {
                wsRenderTimer = setTimeout(() => {
                  lastWsRenderTime = Date.now();
                  wsRenderTimer = null;
                  renderLivePriceUpdates();
                }, 150 - (now - lastWsRenderTime));
              }
            }
          }
        } catch (err) {}
      };

      liveTickerWs.onclose = () => {
        if (activeTab === 'trade' && selectedCoin && selectedCoin.binanceSym === binanceSym) {
          endpointIdx++;
          setTimeout(() => {
            if (activeTab === 'trade' && (!liveTickerWs || liveTickerWs.readyState !== 1)) {
              tryConnect();
            }
          }, 2000);
        }
      };

      liveTickerWs.onerror = () => { try { liveTickerWs.close(); } catch (e) {} };
    } catch (e) {}
  }

  tryConnect();
}

let lastRestTickerFetch = 0;
async function fetchLiveBinanceTickers() {
  const now = Date.now();
  // While on trade tab, throttle background REST polling to every 10s to preserve Binance weight
  if (now - lastRestTickerFetch < 10000) {
    return;
  }
  lastRestTickerFetch = now;

  const symbols = COINS
    .map(c => c.binanceSym)
    .filter(s => s && s !== 'PAXGUSDT');
  const encodedSymbols = encodeURIComponent(JSON.stringify(symbols));

  const endpoints = [
    `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodedSymbols}`,
    `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodedSymbols}`,
    'https://data-api.binance.vision/api/v3/ticker/24hr',
    'https://api.binance.com/api/v3/ticker/24hr',
    getApiEndpoint('/api/prices')
  ];

  let success = false;
  for (const url of endpoints) {
    try {
      const ctl = new AbortController();
      const tmr = setTimeout(() => ctl.abort(), 2800);
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
              tickerMap.set(k, {
                lastPrice: p.price,
                priceChangePercent: p.change24h || 0,
                openPrice: p.dailyOpen || p.open24h || 0,
                highPrice: p.high24h || p.price * 1.02,
                lowPrice: p.low24h || p.price * 0.98,
                quoteVolume: p.volume24h || 50000000
              });
            }
          });
        }

        if (tickerMap.size > 0) {
          COINS.forEach(c => {
            if (c.id === 'gold') return; // Gold is Spot XAU/USD, updated with exact TradingView Session Open below
            const t = tickerMap.get(c.binanceSym) || tickerMap.get(c.id);
            if (t) {
              c.price = parseFloat(t.lastPrice);
              c.change = parseFloat(t.priceChangePercent);
              c.change24h = c.change;
              if (t.openPrice) {
                c.open = parseFloat(t.openPrice);
                c.open24h = parseFloat(t.openPrice);
              }
              c.high = parseFloat(t.highPrice);
              c.low = parseFloat(t.lowPrice);
              if (t.quoteVolume) {
                const qv = parseFloat(t.quoteVolume);
                c.vol = qv >= 1e9 ? (qv / 1e9).toFixed(2) + 'B' : (qv / 1e6).toFixed(1) + 'M';
              }
              if (selectedCoin && c.id === selectedCoin.id) {
                selectedCoin.price = c.price;
                selectedCoin.change = c.change;
                selectedCoin.change24h = c.change;
                if (c.open24h) selectedCoin.open24h = c.open24h;
                if (c.high) selectedCoin.high = c.high;
                if (c.low) selectedCoin.low = c.low;
                persistSelectedCoinState();
                if (activeTab === 'trade') {
                  renderLivePriceUpdates();
                }
              }
            }
          });
          success = true;
          break;
        }
      }
    } catch (err) {}
  }

  // Real live Gold Spot (TVC:GOLD TradingView sync + Gold-API fallback)
  await pollLiveGoldPrice();

  updateDesktopMarqueePrices();
  if (activeTab === 'trade') {
    updateDesktopOrderCalculations();
  }

  checkPendingOrdersTrigger();
  if (activeTab !== 'trade') {
    renderLivePriceUpdates();
  }
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

let lastObRenderTime = 0;
const lastRecordedPrices = {};

function triggerPriceFlash(el, newPrice, oldPrice) {
  if (!el || typeof newPrice !== 'number' || typeof oldPrice !== 'number' || newPrice === oldPrice) return;
  el.classList.remove('price-flash-up', 'price-flash-down');
  void el.offsetWidth;
  if (newPrice > oldPrice) {
    el.classList.add('price-flash-up');
  } else if (newPrice < oldPrice) {
    el.classList.add('price-flash-down');
  }
}

function renderLivePriceUpdates() {
  if (activeTab === 'home') {
    renderHomeBalanceCard();
    renderHomeMarketIntel();
    renderHomeMarketList();
    if (typeof updateSpotlightBentoPrices === 'function') updateSpotlightBentoPrices();
  } else if (activeTab === 'markets') {
    renderMarketsScreen();
  } else if (activeTab === 'trade') {
    const livePriceEl = document.getElementById('trade-price-val') || document.getElementById('trade-header-price');
    const liveChangeEl = document.getElementById('trade-change-val') || document.getElementById('trade-header-change');
    const priceArrow = document.getElementById('trade-price-arrow');
    const tabPrice = document.getElementById('trade-coin-tab-price');
    const highVal = document.getElementById('trade-high-val');
    const lowVal = document.getElementById('trade-low-val');
    const currentChange = (selectedCoin.chartChange !== undefined && !isNaN(selectedCoin.chartChange))
      ? selectedCoin.chartChange
      : ((selectedCoin.change24h !== undefined && !isNaN(selectedCoin.change24h))
          ? selectedCoin.change24h
          : (typeof selectedCoin.change === 'number' && !isNaN(selectedCoin.change) ? selectedCoin.change : 0));
    const isUp = currentChange >= 0;

    if (livePriceEl) {
      const formattedPrice = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
      if (livePriceEl.textContent !== formattedPrice) {
        livePriceEl.textContent = formattedPrice;
      }
      const targetPriceClass = `tib-live-price ${isUp ? 'up' : 'down'}`;
      if (livePriceEl.className !== targetPriceClass) {
        livePriceEl.className = targetPriceClass;
      }
    }
    if (priceArrow) {
      const targetArrow = isUp ? '↑' : '↓';
      if (priceArrow.textContent !== targetArrow) {
        priceArrow.textContent = targetArrow;
      }
      const targetArrowClass = `tib-price-arrow ${isUp ? 'up' : 'down'}`;
      if (priceArrow.className !== targetArrowClass) {
        priceArrow.className = targetArrowClass;
      }
    }
    if (tabPrice) {
      const formattedTab = fmtPrice(selectedCoin.price);
      if (tabPrice.textContent !== formattedTab) {
        tabPrice.textContent = formattedTab;
      }
    }
    if (liveChangeEl) {
      const formattedChange = `${isUp ? '+' : ''}${currentChange.toFixed(2)}%`;
      if (liveChangeEl.textContent !== formattedChange) {
        liveChangeEl.textContent = formattedChange;
      }
      const targetChangeClass = `tib-val ${isUp ? 'up' : 'down'}`;
      if (liveChangeEl.className !== targetChangeClass) {
        liveChangeEl.className = targetChangeClass;
      }
    }
    if (highVal && selectedCoin.high) {
      const formattedHigh = `${getCurrencySymbol()}${fmtPrice(selectedCoin.high)}`;
      if (highVal.textContent !== formattedHigh) highVal.textContent = formattedHigh;
    }
    if (lowVal && selectedCoin.low) {
      const formattedLow = `${getCurrencySymbol()}${fmtPrice(selectedCoin.low)}`;
      if (lowVal.textContent !== formattedLow) lowVal.textContent = formattedLow;
    }
    if (typeof updateCandleCountdown === 'function') {
      updateCandleCountdown();
    }
    renderPositions();
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
    const fsHigh = document.getElementById('tv-fs-high');
    const fsLow = document.getElementById('tv-fs-low');
    const fsVol = document.getElementById('tv-fs-vol');
    if (fsPrice) {
      const formattedFsPrice = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
      if (fsPrice.textContent !== formattedFsPrice) fsPrice.textContent = formattedFsPrice;
    }
    if (fsChange) {
      const fsChgVal = (selectedCoin.chartChange !== undefined && !isNaN(selectedCoin.chartChange))
        ? selectedCoin.chartChange
        : ((selectedCoin.change24h !== undefined && !isNaN(selectedCoin.change24h))
            ? selectedCoin.change24h
            : (typeof selectedCoin.change === 'number' && !isNaN(selectedCoin.change) ? selectedCoin.change : 0));
      const isUp = fsChgVal >= 0;
      const targetClass = `tv-fs-change-pill ${isUp ? 'up' : 'down'}`;
      if (fsChange.className !== targetClass) fsChange.className = targetClass;
      const formattedFsChange = `${isUp ? '+' : ''}${fsChgVal.toFixed(2)}%`;
      if (fsChange.textContent !== formattedFsChange) fsChange.textContent = formattedFsChange;
    }
    if (fsHigh) {
      const formattedFsHigh = `${getCurrencySymbol()}${fmtPrice(selectedCoin.high || selectedCoin.price * 1.018)}`;
      if (fsHigh.textContent !== formattedFsHigh) fsHigh.textContent = formattedFsHigh;
    }
    if (fsLow) {
      const formattedFsLow = `${getCurrencySymbol()}${fmtPrice(selectedCoin.low || selectedCoin.price * 0.982)}`;
      if (fsLow.textContent !== formattedFsLow) fsLow.textContent = formattedFsLow;
    }
    if (fsVol) {
      const formattedFsVol = `${selectedCoin.vol || '304.6M USDT'}`;
      if (fsVol.textContent !== formattedFsVol) fsVol.textContent = formattedFsVol;
    }
  }

  if (selectedCoin && selectedCoin.id) {
    lastRecordedPrices[selectedCoin.id] = selectedCoin.price;
  }
}

function renderAllViews() {
  renderHomeScreen();
  renderMarketsScreen();
  renderTradeScreen();
  renderPortfolioScreen();
  renderAccountScreen();
  if (typeof updateDrawerProfileUI === 'function') updateDrawerProfileUI();
  const pnlModal = typeof document !== 'undefined' && document.getElementById ? document.getElementById('pnl-dashboard-modal') : null;
  if (pnlModal && pnlModal.classList && typeof pnlModal.classList.contains === 'function' && pnlModal.classList.contains('hidden') === false && typeof renderPnLDashboard === 'function') {
    renderPnLDashboard();
  }
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
  let key = presetKey;
  let avatarUrl = presetKey;

  if (PRESET_AVATARS[presetKey]) {
    key = presetKey;
    avatarUrl = PRESET_AVATARS[presetKey];
  } else if (typeof presetKey === 'string' && presetKey.includes('btc')) {
    key = 'bitcoin';
    avatarUrl = PRESET_AVATARS.bitcoin || 'icons/btc.png';
  } else if (typeof presetKey === 'string' && presetKey.includes('eth')) {
    key = 'ethereum';
    avatarUrl = PRESET_AVATARS.ethereum || 'icons/eth.png';
  } else if (typeof presetKey === 'string' && presetKey.includes('sol')) {
    key = 'solana';
    avatarUrl = 'icons/sol.png';
  } else if (typeof presetKey === 'string' && presetKey.includes('doge')) {
    key = 'doge';
    avatarUrl = 'icons/doge.png';
  }

  userProfile.avatar = avatarUrl;
  userProfile.selectedPreset = key;
  saveUserProfile();
  renderAccountScreen();
  if (typeof updateDrawerProfileUI === 'function') updateDrawerProfileUI();
  showToast(`Avatar updated to ${key}!`, 'success');
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
  if (confirm('Are you sure you want to reset your account to $10,000 and clear all positions?')) {
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
    showToast('Account successfully reset to $10,000', 'success');
  }
}

function restoreSavedChartState() {
  loadChartSettings();

  try {
    const savedCoinId = localStorage.getItem('vtrade_selected_coin');
    if (savedCoinId && typeof COINS !== 'undefined') {
      const match = COINS.find(c => c.id === savedCoinId || c.symbol.toLowerCase() === savedCoinId.toLowerCase());
      if (match) selectedCoin = match;
    }
  } catch (e) {}

  try {
    const savedInterval = localStorage.getItem('vtrade_chart_interval');
    if (savedInterval) {
      chartInterval = savedInterval;
    }
  } catch (e) {}

  const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M'];
  intervals.forEach(i => {
    const btn = document.getElementById(`ctf-${i}`);
    if (btn) btn.classList.toggle('active', i === chartInterval);
  });

  try {
    const savedPriceType = localStorage.getItem('vtrade_chart_price_type') || 'mark';
    const markBtn = document.getElementById('tcb-tab-mark');
    const lastBtn = document.getElementById('tcb-tab-last');
    if (markBtn) markBtn.classList.toggle('active', savedPriceType === 'mark');
    if (lastBtn) lastBtn.classList.toggle('active', savedPriceType === 'last');
  } catch (e) {}

  try {
    const saved1Click = localStorage.getItem('vtrade_1click_trade');
    if (saved1Click !== null) {
      const input = document.getElementById('tcb-1click-input');
      if (input) input.checked = (saved1Click === 'true');
    }
  } catch (e) {}

  if (typeof syncChartSettingsUI === 'function') {
    syncChartSettingsUI();
  }
}

// ─── 20. INITIALIZATION ON BOOT ──────────────────────────────────────────
let liveTickerInterval = null;

function initVTradeApp() {
  console.log('🚀 Initializing VTrade 120 FPS Paper Trading App...');

  // Ensure native mobile safe areas are properly applied & web splash is removed
  try {
    const isCap = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (isCap) {
      document.documentElement.classList.add('is-native-apk', 'is-mobile-app');
    } else {
      const splashEl = document.getElementById('vtrade-splash-screen');
      if (splashEl) splashEl.style.display = 'none';
    }
  } catch (e) {}

  // Setup Currency Button state
  const iconEl = document.getElementById('curr-toggle-icon');
  const labelEl = document.getElementById('curr-toggle-label');
  if (iconEl) iconEl.textContent = getCurrencySymbol();
  if (labelEl) labelEl.textContent = walletState.currency;

  // Initialize luxury theme
  initAppTheme();

  // Initialize customizable order book preference
  initOrderBookPreference();

  // Initialize TradingView-style Network Monitor
  initNetworkMonitor();

  // Initialize live Candle Closing Countdown Engine
  startCandleCountdownEngine();

  // Check auth session & strictly validate against database users
  const sess = getAuthSession();
  if (sess && sess.email && !sess.isGuest && sess.token) {
    saveRegisteredUser({
      username: sess.username || sess.email.split('@')[0],
      email: sess.email,
      balance: (typeof walletState !== 'undefined' && walletState.cashBalance) || 10000
    });
  }
  const dbUsers = getRegisteredUsers();
  const isValidDbUser = sess && sess.email && dbUsers.some(u => u.email.toLowerCase() === sess.email.toLowerCase());

  if (sess && !sess.isGuest && isValidDbUser) {
    userProfile.name = sess.username;
    userProfile.email = sess.email;
    saveUserProfile();
    updateAccountAuthUI();

    // Auto-sync active user credentials to Render cloud database
    const localUser = dbUsers.find(u => u.email.toLowerCase() === sess.email.toLowerCase());
    if (localUser && localUser.password) {
      fetch(getApiEndpoint('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: localUser.username, email: localUser.email, password: localUser.password })
      }).catch(() => {});
    }
  }

  // Restore all saved chart settings, timeframe & coin before rendering
  restoreSavedChartState();

  // Render TradingView Chart for active coin
  renderTradingViewChart();

  // Restore saved active tab or default to 'home'
  let initialTab = 'home';
  try {
    const hash = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
    const savedTab = hash || localStorage.getItem('vtrade_active_tab');
    if (savedTab && ['home', 'markets', 'trade', 'portfolio', 'vtrade'].includes(savedTab)) {
      initialTab = (savedTab === 'vtrade') ? 'trade' : savedTab;
    }
  } catch (e) {}
  switchBottomTab(initialTab);

  // Initialize Aceternity, Skiper-UI & GSAP Animation Suite (only for home screen)
  if (initialTab === 'home') {
    initHeroTextAnimation();
    if (typeof initHeroGlassBlockInteractions === 'function') initHeroGlassBlockInteractions();
    if (typeof initHeroGsapTimeline === 'function') initHeroGsapTimeline();
    initScrollRevealEngine();
    initSpotlightAndTiltCards();
  }
  updateNavIndicator();
  window.addEventListener('resize', updateNavIndicator);

  // Initial fetch of candlesticks
  fetchRealBinanceCandles();

  // Start continuous 10-second background REST ticker
  fetchLiveBinanceTickers();
  if (!liveTickerInterval) {
    liveTickerInterval = setInterval(fetchLiveBinanceTickers, 10000);
  }

  // Start desktop dynamic components
  initDesktopMarquee();
  syncDesktopHeaderState();
  updateDesktopOrderCalculations();

  // Start fluid real-time Order Book Engine & Live Gold Sync
  startOrderbookLiveEngine();
  startGoldLivePolling();

  // Initial and recurring Real-Time Cloud Wallet Sync (Every 3 seconds auto-sync!)
  syncWalletWithCloud();
  setInterval(syncWalletWithCloud, 3000);
  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncWalletWithCloud();
  });
  window.addEventListener('focus', () => {
    syncWalletWithCloud();
  });

  // Setup touch gestures
  setupOnboardingSwipe();

  // Background In-App OTA Update Check
  setTimeout(() => checkForAppUpdates(false), 2500);

  // Pre-activate Onboarding / Auth flow immediately beneath the splash screen
  // Guarantees zero flash of Home screen when splash fades out!
  initPostSplashFlow();

  // Trigger App Launch Splash Animation -> Then trigger Onboarding or Main screen
  setTimeout(() => {
    const splash = document.getElementById('vtrade-splash-screen');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        initPostSplashFlow();
      }, 450);
    } else {
      initPostSplashFlow();
    }
  }, 1650);
}

function initPostSplashFlow() {
  const sess = getAuthSession();
  if (sess && sess.email && !sess.isGuest && sess.token) {
    saveRegisteredUser({
      username: sess.username || sess.email.split('@')[0],
      email: sess.email,
      balance: (typeof walletState !== 'undefined' && walletState.cashBalance) || 10000
    });
  }
  const dbUsers = getRegisteredUsers();
  const isValidDbUser = sess && sess.email && dbUsers.some(u => u.email.toLowerCase() === sess.email.toLowerCase());

  const showOnRelaunch = localStorage.getItem('vtrade_show_onboarding_on_relaunch') === 'true';
  const completed = localStorage.getItem('vtrade_onboarding_completed') === '1';

  if (!isValidDbUser) {
    clearAuthSession();
    updateAccountAuthUI();
    if (showOnRelaunch || !completed) {
      openOnboarding();
    } else {
      openAuthModal('login');
    }
  } else {
    const onbModal = document.getElementById('vtrade-onboarding-modal');
    if (onbModal) onbModal.classList.add('hidden');
    const authModal = document.getElementById('auth-modal-overlay');
    if (authModal) authModal.classList.add('hidden');
  }
}

// ─── 16. ONBOARDING WALKTHROUGH ──────────────────────────────────────────
let currentOnboardingSlide = 0;
const TOTAL_ONBOARDING_SLIDES = 4;

function initOnboarding() {
  initPostSplashFlow();
}

function openOnboarding() {
  const modal = document.getElementById('vtrade-onboarding-modal');
  if (modal) {
    currentOnboardingSlide = 0;
    updateOnboardingView();
    modal.classList.remove('hidden');
  }
}

function completeOnboarding() {
  localStorage.setItem('vtrade_onboarding_completed', '1');
  localStorage.removeItem('vtrade_show_onboarding_on_relaunch');
  const modal = document.getElementById('vtrade-onboarding-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  // Pop up the Sign In / Sign Up modal immediately
  openAuthModal('login');
}

function replayOnboarding() {
  openOnboarding();
}

function goToSlide(index) {
  if (index < 0 || index >= TOTAL_ONBOARDING_SLIDES) return;
  currentOnboardingSlide = index;
  updateOnboardingView();
}

function nextSlide() {
  if (currentOnboardingSlide < TOTAL_ONBOARDING_SLIDES - 1) {
    currentOnboardingSlide++;
    updateOnboardingView();
  } else {
    completeOnboarding();
  }
}

function prevSlide() {
  if (currentOnboardingSlide > 0) {
    currentOnboardingSlide--;
    updateOnboardingView();
  }
}

function updateOnboardingView() {
  const track = document.getElementById('onboarding-track');
  const btnText = document.getElementById('onb-btn-text');
  const btnArrow = document.getElementById('onb-btn-arrow');
  const nextBtn = document.getElementById('onb-next-btn');

  if (track) {
    track.style.transition = 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1)';
    track.style.transform = `translate3d(-${currentOnboardingSlide * 25}%, 0, 0)`;
  }

  // Update dots
  for (let i = 0; i < TOTAL_ONBOARDING_SLIDES; i++) {
    const dot = document.querySelector(`.onb-dot:nth-child(${i + 1})`);
    if (dot) dot.classList.toggle('active', i === currentOnboardingSlide);
  }

  // Last slide CTA button morphing
  if (currentOnboardingSlide === TOTAL_ONBOARDING_SLIDES - 1) {
    if (btnText) btnText.textContent = 'Get Started & Sign In';
    if (btnArrow) btnArrow.textContent = '⚡';
    if (nextBtn) {
      nextBtn.style.background = 'linear-gradient(135deg, #00c087 0%, #059669 100%)';
      nextBtn.style.boxShadow = '0 4px 16px rgba(0, 192, 135, 0.4)';
    }
  } else {
    if (btnText) btnText.textContent = 'Next';
    if (btnArrow) btnArrow.textContent = '→';
    if (nextBtn) {
      nextBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      nextBtn.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.35)';
    }
  }
}

function setupOnboardingSwipe() {
  const wrapper = document.getElementById('onboarding-wrapper');
  const track = document.getElementById('onboarding-track');
  if (!wrapper || !track) return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let startTime = 0;
  let isDragging = false;
  let isHorizontal = null;
  let rafId = null;

  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = startX;
    startTime = Date.now();
    isDragging = true;
    isHorizontal = null;
    track.style.transition = 'none'; // Instant 1:1 finger tracking
  }, { passive: true });

  wrapper.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    const deltaY = e.touches[0].clientY - startY;

    if (isHorizontal === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);
      }
    }
    if (!isHorizontal) return;

    // Resistance on boundary slides
    let effectiveDeltaX = deltaX;
    if ((currentOnboardingSlide === 0 && deltaX > 0) ||
        (currentOnboardingSlide === TOTAL_ONBOARDING_SLIDES - 1 && deltaX < 0)) {
      effectiveDeltaX = deltaX * 0.35;
    }

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const slideWidth = wrapper.offsetWidth || window.innerWidth;
      const basePx = -(currentOnboardingSlide * slideWidth);
      track.style.transform = `translate3d(${basePx + effectiveDeltaX}px, 0, 0)`;
    });
  }, { passive: true });

  wrapper.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    if (rafId) cancelAnimationFrame(rafId);
    track.style.transition = 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1)';

    const deltaX = currentX - startX;
    const duration = Date.now() - startTime;
    const velocity = Math.abs(deltaX) / (duration || 1);
    const wrapperWidth = wrapper.offsetWidth || window.innerWidth;
    const threshold = Math.min(60, wrapperWidth * 0.18);

    if (deltaX < -threshold || (deltaX < -25 && velocity > 0.3)) {
      nextSlide();
    } else if (deltaX > threshold || (deltaX > 25 && velocity > 0.3)) {
      prevSlide();
    } else {
      updateOnboardingView(); // Snap back smoothly
    }
  }, { passive: true });
}

// ─── DESKTOP ENHANCED TRADING WORKSTATION LOGIC (ORIGINAL STYLISH UI) ────
let desktopOrderSide = 'long';
let desktopOrderType = 'market';
let desktopLeverage = 150;
let desktopSizeCoins = 0.05;

function syncDesktopHeaderState() {
  const tabs = ['home', 'markets', 'trade', 'portfolio', 'account', 'auth'];
  tabs.forEach(t => {
    const dbtn = document.getElementById(`dnav-${t}`);
    if (dbtn) dbtn.classList.toggle('active', t === activeTab);
  });

  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const isAuthedSession = !!(sess && !sess.isGuest && (sess.email || sess.username || sess.token));

  // Real Wallet Equity Badge strictly visible only when user is authenticated
  const cashBadge = document.getElementById('header-cash-badge');
  if (cashBadge) {
    if (isAuthedSession) {
      cashBadge.classList.remove('hidden');
      cashBadge.style.display = 'inline-flex';
    } else {
      cashBadge.classList.add('hidden');
      cashBadge.style.display = 'none';
    }
  }

  const cashValEl = document.getElementById('header-cash-val');
  if (cashValEl && typeof walletState !== 'undefined') {
    cashValEl.textContent = `${getCurrencySymbol()}${fmtMoney(walletState.cashBalance || 10000)}`;
  }

  // Top Header TRADE NOW CTA Button: strictly visible only for guest / without sign-in (SS 2)
  const tradeNowBtn = document.getElementById('header-trade-now-btn');
  if (tradeNowBtn) {
    if (isAuthedSession) {
      tradeNowBtn.classList.add('hidden');
      tradeNowBtn.style.display = 'none';
    } else {
      tradeNowBtn.classList.remove('hidden');
      tradeNowBtn.style.display = 'inline-flex';
    }
  }

  // Update Auth nav item & Header user pill
  const dnavAuthText = document.getElementById('dnav-auth-text');
  const hubName = document.getElementById('hub-name');
  const hubAvatar = document.getElementById('hub-avatar');
  const hmpInitial = document.getElementById('hmp-avatar-initial');
  const hmpLabel = document.getElementById('hmp-label-text');

  if (isAuthedSession) {
    const displayName = (userProfile && userProfile.name) || sess.username || 'Trader';
    if (dnavAuthText) dnavAuthText.textContent = displayName;
    if (hubName) hubName.textContent = displayName;
    if (hubAvatar) hubAvatar.textContent = '🟢';
    if (hmpInitial) hmpInitial.textContent = (displayName[0] || 'T').toUpperCase();
    if (hmpLabel) hmpLabel.textContent = displayName || 'My Profile';
  } else {
    if (dnavAuthText) dnavAuthText.textContent = 'Sign In';
    if (hubName) hubName.textContent = 'Sign In';
    if (hubAvatar) hubAvatar.textContent = '👤';
    if (hmpInitial) hmpInitial.textContent = '👤';
    if (hmpLabel) hmpLabel.textContent = 'Sign In';
  }

  // Update Screenshot 1 Buy/Sell Dock Auth Gate
  const dtodAuthGate = document.getElementById('dtod-auth-gate');
  const dtodSubmitBtn = document.getElementById('dtod-submit-btn');
  if (dtodAuthGate) dtodAuthGate.classList.toggle('hidden', isAuthedSession);
  if (dtodSubmitBtn) dtodSubmitBtn.classList.toggle('hidden', !isAuthedSession);

  // Update Screenshot 2 My Profile block & Drawer UI
  if (typeof updateDrawerProfileUI === 'function') {
    updateDrawerProfileUI();
  }
}

// ─── DESKTOP AUTH WORKSTATION LOGIC ────────────────────────────────────
function renderDesktopAuthPage() {
  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const loggedInView = document.getElementById('apf-logged-in-view');
  const loginForm = document.getElementById('apf-login-form');
  const registerForm = document.getElementById('apf-register-form');
  const activeUserBox = document.getElementById('aps-active-user-box');
  const tabsWrap = document.querySelector('.apf-tabs');

  if (sess && !sess.isGuest && sess.email) {
    if (loggedInView) loggedInView.classList.remove('hidden');
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.add('hidden');
    if (activeUserBox) activeUserBox.classList.remove('hidden');
    if (tabsWrap) tabsWrap.classList.add('hidden');

    const nameEl = document.getElementById('apf-wc-name');
    const emailEl = document.getElementById('apf-wc-email');
    const balEl = document.getElementById('apf-wc-balance');
    const aubName = document.getElementById('aps-aub-name');
    const aubEmail = document.getElementById('aps-aub-email');

    const name = (userProfile && userProfile.name) || sess.username || 'Trader';
    if (nameEl) nameEl.textContent = `Welcome, ${name}!`;
    if (emailEl) emailEl.textContent = sess.email;
    if (balEl) balEl.textContent = `${getCurrencySymbol()}${fmtMoney(walletState.cashBalance || 10000)}`;
    if (aubName) aubName.textContent = name;
    if (aubEmail) aubEmail.textContent = sess.email;
  } else {
    if (loggedInView) loggedInView.classList.add('hidden');
    if (activeUserBox) activeUserBox.classList.add('hidden');
    if (tabsWrap) tabsWrap.classList.remove('hidden');
    switchDesktopAuthTab('login');
  }
}

function switchDesktopAuthTab(tab) {
  clearDesktopAuthAlert();
  const lTab = document.getElementById('apf-tab-login');
  const rTab = document.getElementById('apf-tab-register');
  const lForm = document.getElementById('apf-login-form');
  const rForm = document.getElementById('apf-register-form');

  if (tab === 'login') {
    if (lTab) lTab.classList.add('active');
    if (rTab) rTab.classList.remove('active');
    if (lForm) lForm.classList.remove('hidden');
    if (rForm) rForm.classList.add('hidden');
  } else {
    if (lTab) lTab.classList.remove('active');
    if (rTab) rTab.classList.add('active');
    if (lForm) lForm.classList.add('hidden');
    if (rForm) rForm.classList.remove('hidden');
  }
}

function quickFillAccount(email, password) {
  const emailInput = document.getElementById('apf-login-email');
  const pwdInput = document.getElementById('apf-login-password');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = password;
  showDesktopAuthAlert('Account details filled! Click "Sign In to VTrade PRO" below.', 'info');
}

function openSwitchAccountMode() {
  const loggedInView = document.getElementById('apf-logged-in-view');
  const tabsWrap = document.querySelector('.apf-tabs');
  if (loggedInView) loggedInView.classList.add('hidden');
  if (tabsWrap) tabsWrap.classList.remove('hidden');
  switchDesktopAuthTab('login');
  const emailInput = document.getElementById('apf-login-email');
  if (emailInput) {
    emailInput.value = '';
    emailInput.focus();
  }
}

function logoutAuthUser() {
  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const loggedOutEmail = sess && sess.email ? sess.email : '';
  clearAuthSession();
  userProfile = {
    name: 'Trader',
    email: '',
    avatar: (typeof PRESET_AVATARS !== 'undefined' && PRESET_AVATARS.cyberpunk) ? PRESET_AVATARS.cyberpunk : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    selectedPreset: 'cyberpunk',
    uid: '84920158'
  };
  if (typeof saveUserProfile === 'function') saveUserProfile();
  localStorage.setItem('vtrade_show_onboarding_on_relaunch', 'true');
  localStorage.removeItem('vtrade_onboarding_completed');

  if (typeof syncDesktopHeaderState === 'function') syncDesktopHeaderState();
  if (typeof updateAccountAuthUI === 'function') updateAccountAuthUI();
  if (typeof renderDesktopAuthPage === 'function') renderDesktopAuthPage();
  if (typeof renderAccountScreen === 'function') renderAccountScreen();
  return loggedOutEmail;
}

function handleAuthLogout() {
  const loggedOutEmail = logoutAuthUser();
  if (typeof closeProfileDrawer === 'function') {
    closeProfileDrawer();
  }
  // Immediately switch view to Guest Home page so logged-in screens are never visible
  if (typeof switchBottomTab === 'function') {
    switchBottomTab('home');
  }
  if (typeof syncDesktopHeaderState === 'function') syncDesktopHeaderState();
  if (typeof updateDrawerProfileUI === 'function') updateDrawerProfileUI();
  if (typeof renderAllViews === 'function') renderAllViews();
  showToast('Signed out successfully.', 'info');
  if (typeof clearAuthAlert === 'function') clearAuthAlert();

  const loginEmail = document.getElementById('login-email');
  if (loginEmail && loggedOutEmail) loginEmail.value = loggedOutEmail;
  const pwdInput = document.getElementById('login-password');
  if (pwdInput) pwdInput.value = '';
}

function logoutDesktopUser() {
  handleAuthLogout();
}

function showDesktopAuthAlert(msg, type = 'error') {
  const alertEl = document.getElementById('apf-inline-alert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.className = `apf-alert ${type}`;
  alertEl.classList.remove('hidden');
}

function clearDesktopAuthAlert() {
  const alertEl = document.getElementById('apf-inline-alert');
  if (alertEl) {
    alertEl.textContent = '';
    alertEl.classList.add('hidden');
  }
}

function toggleDesktopPasswordVisibility(id) {
  const input = document.getElementById(id);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

function handleDesktopPageForgotPassword() {
  const emailInput = document.getElementById('apf-login-email');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  openAuthModal('login');
  handleForgotPassword();
  if (email) {
    const mInput = document.getElementById('login-email');
    if (mInput) mInput.value = email;
  }
}

async function handleDesktopPageLogin(event) {
  if (event) event.preventDefault();

  const emailInput = document.getElementById('apf-login-email');
  const pwdInput = document.getElementById('apf-login-password');
  const rememberBox = document.getElementById('apf-login-remember');
  const submitBtn = document.getElementById('apf-login-submit');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!email || !password) {
    showDesktopAuthAlert('Please enter both email and password', 'error');
    return;
  }

  // 1. In-App Persistent Database Priority
  const dbUsers = getRegisteredUsers();
  const registered = dbUsers.find(u => u.email.toLowerCase() === email);

  if (registered && registered.password === password) {
    clearDesktopAuthAlert();
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
    updateAccountAuthUI();
    renderAccountScreen();
    syncDesktopHeaderState();
    showToast(`Welcome back, ${registered.username}!`, 'success');
    syncWalletWithCloud(false);
    switchBottomTab('trade');
    return;
  }

  // 2. Cloud Server Sync Check
  if (submitBtn) {
    submitBtn.innerHTML = '<span>Signing in to Cloud Database...</span>';
    submitBtn.disabled = true;
  }

  try {
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 15000);
    const resp = await fetch(getApiEndpoint('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: ctl.signal
    });
    clearTimeout(tmr);

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      clearDesktopAuthAlert();
      if (typeof data.balance === 'number') {
        walletState.cashBalance = data.balance;
      }
      saveRegisteredUser({
        username: data.username || email.split('@')[0],
        email: email,
        password: password
      });
      const sess = {
        token: data.token || ('vtrade_cloud_' + Date.now()),
        username: data.username || email.split('@')[0],
        email: email,
        isGuest: false,
        loggedInAt: Date.now()
      };
      if (!rememberBox || rememberBox.checked) {
        saveAuthSession(sess);
      }
      userProfile.name = data.username || email.split('@')[0];
      userProfile.email = email;
      saveUserProfile();
      updateAccountAuthUI();
      renderAccountScreen();
      syncDesktopHeaderState();
      showToast(`Welcome back, ${userProfile.name}!`, 'success');
      syncWalletWithCloud(false);
      switchBottomTab('trade');
    } else if (resp.status === 404) {
      showDesktopAuthAlert('Account does not exist! Please click "Create Account" tab above to register.', 'error');
    } else if (resp.status === 401) {
      showDesktopAuthAlert('Incorrect password! Please check your password and try again.', 'error');
    } else {
      const err = await resp.json().catch(() => ({}));
      showDesktopAuthAlert(err.message || 'Login failed. Please check your credentials.', 'error');
    }
  } catch (err) {
    if (registered) {
      if (registered.password !== password) {
        showDesktopAuthAlert('Incorrect password! Please check your password and try again.', 'error');
      }
    } else {
      showDesktopAuthAlert('Account does not exist or server is syncing. Please check your connection.', 'error');
    }
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = '<span>Sign In to VTrade PRO</span><span class="apf-arrow">→</span>';
      submitBtn.disabled = false;
    }
  }
}

async function handleDesktopPageRegister(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('apf-register-name');
  const emailInput = document.getElementById('apf-register-email');
  const pwdInput = document.getElementById('apf-register-password');
  const submitBtn = document.getElementById('apf-register-submit');

  const username = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!username || !email || !password) {
    showDesktopAuthAlert('Please fill in all registration fields', 'error');
    return;
  }
  if (password.length < 6) {
    showDesktopAuthAlert('Password must be at least 6 characters long', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.innerHTML = '<span>Creating Account...</span>';
    submitBtn.disabled = true;
  }

  try {
    const ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 15000);
    const resp = await fetch(getApiEndpoint('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
      signal: ctl.signal
    });
    clearTimeout(tmr);

    if (resp.ok) {
      saveRegisteredUser({ username, email, password });
      const sess = {
        token: 'vtrade_reg_' + Date.now(),
        username,
        email,
        isGuest: false,
        loggedInAt: Date.now()
      };
      saveAuthSession(sess);
      userProfile.name = username;
      userProfile.email = email;
      walletState.cashBalance = 10000;
      saveUserProfile();
      saveWalletState();
      updateAccountAuthUI();
      renderAccountScreen();
      syncDesktopHeaderState();
      showToast(`Account created successfully! Welcome, ${username}!`, 'success');
      switchBottomTab('trade');
    } else if (resp.status === 409) {
      showDesktopAuthAlert('An account with this email already exists! Please click "Sign In" above.', 'error');
    } else {
      const err = await resp.json().catch(() => ({}));
      showDesktopAuthAlert(err.message || 'Registration failed. Please try again.', 'error');
    }
  } catch (err) {
    // Save locally
    saveRegisteredUser({ username, email, password });
    const sess = {
      token: 'vtrade_reg_' + Date.now(),
      username,
      email,
      isGuest: false,
      loggedInAt: Date.now()
    };
    saveAuthSession(sess);
    userProfile.name = username;
    userProfile.email = email;
    saveUserProfile();
    updateAccountAuthUI();
    syncDesktopHeaderState();
    showToast(`Account created! Welcome, ${username}!`, 'success');
    switchBottomTab('trade');
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = '<span>Create Free VTrade Account</span><span class="apf-arrow">→</span>';
      submitBtn.disabled = false;
    }
  }
}

function initDesktopMarquee() {
  const track = document.getElementById('desktop-marquee-track');
  if (!track || typeof COINS === 'undefined') return;

  const showcaseCoins = COINS; // All 56 coins plus Gold!
  const itemsHtml = showcaseCoins.map(coin => {
    const chgVal = coin.change !== undefined ? coin.change : (coin.change24h || 0);
    const isUp = chgVal >= 0;
    const changeClass = isUp ? 'up' : 'down';
    const changeSign = isUp ? '+' : '';
    const displayPair = getCoinDisplayPair(coin);
    return `
      <div class="marquee-coin-item" onclick="selectCoinAndTrade('${coin.id}')">
        <img src="${coin.icon}" alt="${coin.symbol}" class="marquee-coin-icon" onerror="handleCoinIconError(this, '${coin.symbol}', '${coin.category}')" />
        <span class="m-sym">${displayPair}</span>
        <span class="m-price" id="marq-price-${coin.id}">${getCurrencySymbol()}${fmtPrice(coin.price)}</span>
        <span class="m-chg ${changeClass}" id="marq-chg-${coin.id}">${changeSign}${chgVal ? chgVal.toFixed(2) : '0.00'}%</span>
      </div>
    `;
  }).join('');

  track.innerHTML = itemsHtml + itemsHtml;

  const miniTrack = document.getElementById('tib-mini-track');
  if (miniTrack && typeof COINS !== 'undefined') {
    const miniCoins = COINS;
    const miniItemsHtml = miniCoins.map(coin => {
      const chgVal = coin.change !== undefined ? coin.change : (coin.change24h || 0);
      const isUp = chgVal >= 0;
      const changeClass = isUp ? 'up' : 'down';
      const changeSign = isUp ? '+' : '';
      return `
        <span class="tib-mini-pill" onclick="selectCoinAndTrade('${coin.id}')">
          <span class="tib-mini-dot ${coin.symbol.toLowerCase()}"></span>
          ${coin.symbol.toUpperCase()}-USDT
          <span class="tib-mini-chg ${changeClass}" id="tib-chg-${coin.id}">${changeSign}${chgVal ? chgVal.toFixed(2) : '0.00'}%</span>
        </span>
      `;
    }).join('');
    miniTrack.innerHTML = miniItemsHtml + miniItemsHtml;
  }
}

function updateDesktopMarqueePrices() {
  if (typeof COINS === 'undefined') return;
  COINS.forEach(coin => {
    const priceEls = document.querySelectorAll(`[id="marq-price-${coin.id}"]`);
    const chgEls = document.querySelectorAll(`[id="marq-chg-${coin.id}"]`);
    const chgVal = coin.change !== undefined ? coin.change : (coin.change24h || 0);
    const isUp = chgVal >= 0;
    const changeSign = isUp ? '+' : '';

    priceEls.forEach(el => {
      el.textContent = `${getCurrencySymbol()}${fmtPrice(coin.price)}`;
    });
    chgEls.forEach(el => {
      el.className = `m-chg ${isUp ? 'up' : 'down'}`;
      el.textContent = `${changeSign}${chgVal ? chgVal.toFixed(2) : '0.00'}%`;
    });

    const miniChgEls = document.querySelectorAll(`[id="tib-chg-${coin.id}"]`);
    miniChgEls.forEach(el => {
      el.className = `tib-mini-chg ${isUp ? 'up' : 'down'}`;
      el.textContent = `${changeSign}${chgVal ? chgVal.toFixed(2) : '0.00'}%`;
    });
  });
}

function selectCoinAndTrade(coinId) {
  const found = COINS.find(c => c.id === coinId || c.symbol.toLowerCase() === coinId.toLowerCase());
  if (found) {
    selectedCoin = found;
    try {
      localStorage.setItem('vtrade_selected_coin', found.id);
      persistSelectedCoinState();
    } catch (e) {}
  }
  switchBottomTab('trade');
  renderTradeScreen();
  renderTradingViewChart(true);
  fetchRealBinanceCandles();
  updateDesktopOrderCalculations();
}

function setDesktopOrderSide(side) {
  desktopOrderSide = side;
  const buyBtn = document.getElementById('dtod-btn-buy');
  const sellBtn = document.getElementById('dtod-btn-sell');
  const submitBtn = document.getElementById('dtod-submit-btn');

  if (buyBtn) buyBtn.className = `dtod-side-btn ${side === 'long' ? 'active-buy' : ''}`;
  if (sellBtn) sellBtn.className = `dtod-side-btn ${side === 'short' ? 'active-sell' : ''}`;
  if (submitBtn) {
    submitBtn.className = `dtod-submit-btn ${side === 'long' ? 'buy' : 'sell'}`;
    submitBtn.textContent = side === 'long' ? 'Place Buy / Long Order' : 'Place Sell / Short Order';
  }
  updateDesktopOrderCalculations();
}

function setDesktopOrderType(type) {
  desktopOrderType = type;
  const types = ['market', 'limit', 'stop-l', 'stop-m'];
  types.forEach(t => {
    const btn = document.getElementById(`dtod-type-${t}`);
    if (btn) btn.classList.toggle('active', t === type);
  });
  const limitGroup = document.getElementById('dtod-limit-group');
  if (limitGroup) limitGroup.classList.toggle('hidden', type !== 'limit');
  updateDesktopOrderCalculations();
}

function handleDesktopLeverageInput(val) {
  desktopLeverage = Math.min(parseInt(val) || 150, selectedCoin.maxLev || 150);
  const levVal = document.getElementById('dtod-lev-val');
  if (levVal) levVal.textContent = `${desktopLeverage}x`;
  const levPillVal = document.getElementById('dtod-lev-pill-val');
  if (levPillVal) levPillVal.textContent = `${desktopLeverage}x`;

  const chips = document.querySelectorAll('.dtod-lchip');
  chips.forEach(c => {
    c.classList.toggle('active', c.textContent.trim() === `${desktopLeverage}x`);
  });
  updateDesktopOrderCalculations();
}

function setDesktopLeverage(val) {
  const slider = document.getElementById('dtod-lev-slider');
  if (slider) slider.value = val;
  handleDesktopLeverageInput(val);
}

function toggleDesktopLevDropdown() {
  const wrap = document.getElementById('dtod-leverage-wrap');
  if (wrap) wrap.classList.toggle('hidden');
}

function switchChartPriceType(type) {
  try {
    localStorage.setItem('vtrade_chart_price_type', type);
  } catch (e) {}
  const markBtn = document.getElementById('tcb-tab-mark');
  const lastBtn = document.getElementById('tcb-tab-last');
  if (markBtn) markBtn.classList.toggle('active', type === 'mark');
  if (lastBtn) lastBtn.classList.toggle('active', type === 'last');
  const tagEl = document.getElementById('tcb-market-tag');
  if (tagEl) {
    const sym = (typeof selectedCoin !== 'undefined' && selectedCoin && selectedCoin.symbol) || 'BTC';
    tagEl.textContent = `${sym}-USDT (${type === 'mark' ? 'Mark' : 'Last'}) · VTrade`;
  }
  if (typeof showToast === 'function') showToast(`Switched chart price display to ${type === 'mark' ? 'Mark Price' : 'Last Traded Price'}`);
}

function toggle1ClickTrade(checked) {
  try {
    localStorage.setItem('vtrade_1click_trade', checked ? 'true' : 'false');
  } catch (e) {}
  if (typeof showToast === 'function') showToast(checked ? '1-Click Trade enabled' : '1-Click Trade disabled');
}

function openMarketSelectorModal() {
  switchBottomTab('markets');
}

function handleDesktopSizeInput(val) {
  desktopSizeCoins = parseFloat(val) || 0;
  updateDesktopOrderCalculations();
}

function setDesktopOrderPct(pct) {
  const price = selectedCoin.price || 1;
  const maxNotional = (walletState.cashBalance || 10000) * desktopLeverage;
  const maxCoins = maxNotional / price;
  desktopSizeCoins = parseFloat(((maxCoins * pct) / 100).toFixed(4));

  const sizeInput = document.getElementById('dtod-order-size');
  if (sizeInput) sizeInput.value = desktopSizeCoins;

  const chips = document.querySelectorAll('.dtod-pchip');
  chips.forEach(c => {
    const isAct = (pct === 100 && c.textContent.trim() === 'Max') || c.textContent.trim() === `${pct}%`;
    c.classList.toggle('active', isAct);
  });
  updateDesktopOrderCalculations();
}

function updateDesktopOrderCalculations() {
  if (!selectedCoin) return;
  const unitEl = document.getElementById('dtod-coin-unit');
  if (unitEl) unitEl.textContent = selectedCoin.symbol;

  const minHelper = document.getElementById('dtod-min-helper');
  if (minHelper) {
    const minVal = selectedCoin.symbol === 'BTC' ? '0.002' : '0.1';
    minHelper.textContent = `Min : ${minVal} ${selectedCoin.symbol}`;
  }

  const price = desktopOrderType === 'limit'
    ? (parseFloat(document.getElementById('dtod-limit-price')?.value) || selectedCoin.price)
    : selectedCoin.price;

  const notionalUsd = desktopSizeCoins * price;
  const reqMarginUsd = notionalUsd / desktopLeverage;

  const liqFactor = (1 / desktopLeverage) * 0.9;
  const liqPrice = desktopOrderSide === 'long'
    ? price * (1 - liqFactor)
    : price * (1 + liqFactor);

  const marginEl = document.getElementById('dtod-m-margin');
  const notionalEl = document.getElementById('dtod-m-notional');
  const liqEl = document.getElementById('dtod-m-liq');
  const maxEl = document.getElementById('dtod-max-size');

  if (marginEl) marginEl.textContent = `${getCurrencySymbol()}${fmtMoney(reqMarginUsd)}`;
  if (notionalEl) notionalEl.textContent = `${getCurrencySymbol()}${fmtMoney(notionalUsd)}`;
  if (liqEl) liqEl.textContent = `${getCurrencySymbol()}${fmtPrice(Math.max(0, liqPrice))}`;
  if (maxEl) {
    const maxCoins = ((walletState.cashBalance || 10000) * desktopLeverage) / price;
    maxEl.textContent = `Max: ${maxCoins.toFixed(3)} ${selectedCoin.symbol}`;
  }

  // Screenshot 1 & 3 Updates:
  const levPillVal = document.getElementById('dtod-lev-pill-val');
  if (levPillVal) levPillVal.textContent = `${desktopLeverage}x`;
  const mrSym = document.getElementById('dtod-mr-symbol');
  if (mrSym) mrSym.textContent = `${selectedCoin.symbol}-USDT`;
  const mrPct = document.getElementById('dtod-mr-pct');
  if (mrPct) {
    const ratio = walletState && walletState.positions && walletState.positions.length > 0 ? (reqMarginUsd / (walletState.cashBalance || 10000) * 100) : 0;
    mrPct.textContent = `${ratio.toFixed(2)}%`;
  }
  const maintEl = document.getElementById('dtod-maint-margin');
  if (maintEl) maintEl.textContent = `${(reqMarginUsd * 0.05).toFixed(4)} USDT`;
  const balEl = document.getElementById('dtod-margin-balance');
  if (balEl && typeof walletState !== 'undefined') {
    balEl.textContent = `${fmtMoney(walletState.cashBalance || 10000)} USDT`;
  }
}

function executeDesktopOrder() {
  const sizeInput = document.getElementById('dtod-order-size');
  if (sizeInput) {
    const parsed = parseFloat(sizeInput.value);
    if (!isNaN(parsed) && parsed > 0) {
      desktopSizeCoins = parsed;
    }
  }

  // Sync to sheet state and execute!
  sheetSide = desktopOrderSide;
  sheetOrderType = desktopOrderType;
  sheetLeverage = desktopLeverage;
  sheetSizeCoins = desktopSizeCoins;

  if (desktopOrderType === 'limit') {
    const limitInput = document.getElementById('sheet-limit-price');
    const dtodLimit = document.getElementById('dtod-limit-price');
    if (limitInput && dtodLimit) limitInput.value = dtodLimit.value;
  }

  executeOrderFromSheet();
  syncDesktopHeaderState();
  renderTradeBottomLedger();
  syncWalletWithCloud(true);
}

function switchLedgerTab(tab) {
  const allTabs = ['positions', 'orders', 'order-history', 'history', 'transactions', 'delivery'];
  allTabs.forEach(t => {
    const tabBtn = document.getElementById(`tblc-tab-${t}`);
    const view = document.getElementById(`tblc-view-${t}`);
    if (tabBtn) tabBtn.classList.toggle('active', t === tab);
    if (view) view.classList.toggle('hidden', t !== tab);
  });
  renderTradeBottomLedger();
}

function switchTradeDepthTab(tab) {
  ['book', 'trades'].forEach(t => {
    const tabBtn = document.getElementById(`tdp-tab-${t}`);
    const content = document.getElementById(`tdp-content-${t}`);
    if (tabBtn) tabBtn.classList.toggle('active', t === tab);
    if (content) content.classList.toggle('hidden', t !== tab);
  });
}

function getTradeHistoryList() {
  if (!walletState) return [];
  if (!Array.isArray(walletState.tradesHistory)) {
    walletState.tradesHistory = Array.isArray(walletState.trades) ? walletState.trades : [];
  }
  if (walletState.tradesHistory.length === 0) {
    walletState.tradesHistory = [
      {
        id: Date.now() - 7200000,
        symbol: 'BTC',
        pair: 'BTC/USDT',
        side: 'long',
        size: 0.15,
        entryPrice: 81250.00,
        closePrice: 82420.00,
        leverage: 20,
        pnl: 175.50,
        closed_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: Date.now() - 18000000,
        symbol: 'ETH',
        pair: 'ETH/USDT',
        side: 'short',
        size: 1.8,
        entryPrice: 3120.00,
        closePrice: 3045.00,
        leverage: 10,
        pnl: 135.00,
        closed_at: new Date(Date.now() - 18000000).toISOString()
      }
    ];
    walletState.trades = walletState.tradesHistory;
    saveWalletState();
  } else {
    walletState.trades = walletState.tradesHistory;
  }
  return walletState.tradesHistory;
}

function toggleTradeDeskOrderBook(forceState) {
  const grid = document.getElementById('trade-workspace-grid');
  const btnText = document.getElementById('ctf-ob-text');
  const toggleBtn = document.getElementById('ctf-toggle-ob');
  if (!grid) return;

  const isCurrentlyHidden = grid.classList.contains('orderbook-hidden');
  const willShow = typeof forceState === 'boolean' ? forceState : isCurrentlyHidden;

  if (willShow) {
    grid.classList.remove('orderbook-hidden');
    if (btnText) btnText.textContent = 'Order Book: ON';
    if (toggleBtn) toggleBtn.classList.remove('off');
    try { localStorage.setItem('vtrade_show_orderbook', 'true'); } catch (e) {}
    showToast('Order Book panel restored', 'info');
  } else {
    grid.classList.add('orderbook-hidden');
    if (btnText) btnText.textContent = 'Order Book: OFF';
    if (toggleBtn) toggleBtn.classList.add('off');
    try { localStorage.setItem('vtrade_show_orderbook', 'false'); } catch (e) {}
    showToast('Order Book panel hidden (Chart expanded)', 'info');
  }
}

function initOrderBookPreference() {
  try {
    const saved = localStorage.getItem('vtrade_show_orderbook');
    if (saved === 'false') {
      const grid = document.getElementById('trade-workspace-grid');
      const btnText = document.getElementById('ctf-ob-text');
      const toggleBtn = document.getElementById('ctf-toggle-ob');
      if (grid) grid.classList.add('orderbook-hidden');
      if (btnText) btnText.textContent = 'Order Book: OFF';
      if (toggleBtn) toggleBtn.classList.add('off');
    }
  } catch (e) {}
}

window.toggleTradeDeskOrderBook = toggleTradeDeskOrderBook;
window.initOrderBookPreference = initOrderBookPreference;
window.getTradeHistoryList = getTradeHistoryList;

function tblcNoDataHtml(colspan) {
  return `
    <tr>
      <td colspan="${colspan}" style="text-align:center; padding:38px 16px;">
        <div class="tblc-empty-state">
          <svg class="tblc-no-data-icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.4">
            <path d="M4 4h16v12a2 2 0 0 1-2 2h-3l-2 3h-2l-2-3H6a2 2 0 0 1-2-2V4z"></path>
            <path d="M4 10h5l1.5 2.5h3L15 10h5"></path>
          </svg>
          <span class="tblc-no-data-text">No data</span>
        </div>
      </td>
    </tr>
  `;
}

function renderTradeBottomLedger() {
  const posCount = document.getElementById('ledger-pos-count');
  const ordCount = document.getElementById('ledger-ord-count');
  const histCount = document.getElementById('ledger-hist-count');
  
  const historyList = getTradeHistoryList();
  if (posCount && walletState && walletState.positions) posCount.textContent = walletState.positions.length;
  if (ordCount && walletState && walletState.orders) ordCount.textContent = walletState.orders.length;
  if (histCount) histCount.textContent = historyList.length;

  const sess = getAuthSession();
  const isAuthed = !!(sess && sess.email && !sess.isGuest);
  const authPrompt = document.getElementById('tblc-auth-prompt');

  if (authPrompt) {
    authPrompt.classList.toggle('hidden', isAuthed);
  }

  if (typeof document.querySelectorAll === 'function') {
    const views = document.querySelectorAll('.tblc-view');
    if (!isAuthed) {
      views.forEach(v => v.classList.add('hidden'));
      return;
    }

    const activeTabBtn = typeof document.querySelector === 'function' ? document.querySelector('.tblc-tab.active') : null;
    const activeTabKey = activeTabBtn ? activeTabBtn.id.replace('tblc-tab-', '') : 'positions';
    views.forEach(v => {
      v.classList.toggle('hidden', v.id !== `tblc-view-${activeTabKey}`);
    });
  }

  // 1. Positions Tab (10 Columns matching Screenshot 1)
  const posTbody = document.getElementById('tblc-positions-tbody');
  if (posTbody && walletState) {
    if (!walletState.positions || walletState.positions.length === 0) {
      posTbody.innerHTML = tblcNoDataHtml(10);
    } else {
      posTbody.innerHTML = walletState.positions.map(pos => {
        const coin = COINS.find(c => c.id === pos.coinId) || selectedCoin;
        const curPrice = coin.price;
        const diff = pos.side === 'long' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
        const pnlUsd = diff * pos.size;
        const isUp = pnlUsd >= 0;
        const roe = pos.margin > 0 ? (pnlUsd / pos.margin) * 100 : 0;
        const displayPair = getCoinDisplayPair(coin);
        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="pos-dir-badge ${pos.side}" style="padding:1px 5px; font-size:10px; border-radius:3px;">${pos.side.toUpperCase()}</span>
                <strong>${displayPair}</strong>
                <span style="font-size:11px; color:#8b92a4;">${pos.leverage}x</span>
              </div>
            </td>
            <td style="font-family:var(--font-price); font-weight:600;">${pos.size} ${pos.symbol}</td>
            <td style="font-family:var(--font-price);">
              <span style="color:#ffffff;">${getCurrencySymbol()}${fmtPrice(curPrice)}</span>
              <span style="color:#64748b; font-size:11px;"> / ${getCurrencySymbol()}${fmtPrice(pos.entryPrice)}</span>
            </td>
            <td style="font-family:var(--font-price); color:#ff9900;">${getCurrencySymbol()}${fmtPrice(pos.liqPrice)}</td>
            <td style="font-family:var(--font-price); font-weight:700;" class="${isUp ? 'up' : 'down'}">
              ${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnlUsd)} (${isUp ? '+' : ''}${roe.toFixed(2)}%)
            </td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtMoney(pos.margin)}</td>
            <td><button class="tblc-btn-sm" onclick="showToast('Margin is auto-managed', 'info')" title="Top Up Margin">+</button></td>
            <td><button class="tblc-btn-sm" onclick="showToast('Reverse order triggered', 'info')" title="Reverse Order">⇄</button></td>
            <td><button class="tblc-link-btn" onclick="showToast('Set TP/SL in order dock above', 'info')">Add</button></td>
            <td style="text-align: right;">
              <button class="pos-close-btn" style="padding:4px 10px; font-size:11px; background:rgba(240,79,94,0.15); color:#f04f5e; border:1px solid rgba(240,79,94,0.3); border-radius:4px; cursor:pointer;" onclick="closePosition(${pos.id})">Close</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 2. Open Orders Tab (9 Columns matching Screenshot 3)
  const ordTbody = document.getElementById('tblc-orders-tbody');
  if (ordTbody && walletState) {
    if (!walletState.orders || walletState.orders.length === 0) {
      ordTbody.innerHTML = tblcNoDataHtml(9);
    } else {
      ordTbody.innerHTML = walletState.orders.map(ord => {
        const coin = COINS.find(c => c.id === ord.coinId) || selectedCoin;
        const displayPair = getCoinDisplayPair(coin);
        return `
          <tr>
            <td><strong>${displayPair}</strong></td>
            <td><span class="pos-dir-badge ${ord.side}" style="padding:1px 5px; font-size:10px; border-radius:3px;">LIMIT ${ord.side.toUpperCase()}</span></td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtMoney(ord.margin)}</td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtPrice(coin.price)}</td>
            <td style="font-size:11px; color:#8b92a4;">&gt;= ${getCurrencySymbol()}${fmtPrice(ord.price)}</td>
            <td style="font-family:var(--font-price); font-weight:700;">${getCurrencySymbol()}${fmtPrice(ord.price)}</td>
            <td style="font-family:var(--font-price);">${ord.size} ${ord.symbol}</td>
            <td style="color:#64748b;">--</td>
            <td style="text-align: right;">
              <button class="pos-close-btn" style="padding:4px 10px; font-size:11px; background:rgba(240,79,94,0.15); color:#f04f5e; border:1px solid rgba(240,79,94,0.3); border-radius:4px; cursor:pointer;" onclick="cancelPendingOrder(${ord.id})">Cancel</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 3. Order History Tab (8 Columns matching Screenshot 4)
  const ordHistTbody = document.getElementById('tblc-order-history-tbody');
  if (ordHistTbody && walletState) {
    if (!historyList || historyList.length === 0) {
      ordHistTbody.innerHTML = tblcNoDataHtml(8);
    } else {
      ordHistTbody.innerHTML = historyList.map(tr => {
        const symbolStr = tr.symbol || (tr.pair ? tr.pair.replace('/USDT', '') : 'BTC');
        const pairStr = tr.pair || `${symbolStr}/USDT`;
        const priceVal = tr.closePrice || tr.price || tr.entryPrice || 0;
        const timeStr = tr.closed_at ? new Date(tr.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (tr.time || 'Recently');
        return `
          <tr>
            <td style="color:#8b92a4; font-size:11px;">${timeStr}</td>
            <td><strong>${pairStr}</strong></td>
            <td>Limit</td>
            <td><span class="pos-dir-badge ${tr.side || 'long'}" style="padding:1px 5px; font-size:10px; border-radius:3px;">${(tr.side || 'LONG').toUpperCase()}</span></td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtPrice(priceVal)}</td>
            <td style="font-family:var(--font-price);">${tr.size} ${symbolStr}</td>
            <td style="font-family:var(--font-price);">${tr.size} ${symbolStr}</td>
            <td><span style="color:#00c087; font-size:11px; font-weight:700;">FILLED</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  // 4. Trade History Tab (9 Columns matching Screenshot 5)
  const histTbody = document.getElementById('tblc-history-tbody');
  if (histTbody && walletState) {
    if (!historyList || historyList.length === 0) {
      histTbody.innerHTML = tblcNoDataHtml(9);
    } else {
      histTbody.innerHTML = historyList.map(tr => {
        const pnlVal = typeof tr.pnl === 'number' ? tr.pnl : 0;
        const isUp = pnlVal >= 0;
        const symbolStr = tr.symbol || (tr.pair ? tr.pair.replace('/USDT', '') : 'BTC');
        const pairStr = tr.pair || `${symbolStr}/USDT`;
        const priceVal = tr.closePrice || tr.price || tr.entryPrice || 0;
        const timeStr = tr.closed_at ? new Date(tr.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (tr.time || 'Recently');
        return `
          <tr>
            <td style="color:#8b92a4; font-size:11px;">${timeStr}</td>
            <td><strong>${pairStr}</strong></td>
            <td>Market</td>
            <td><span class="pos-dir-badge ${tr.side || 'long'}" style="padding:1px 5px; font-size:10px; border-radius:3px;">${(tr.side || 'LONG').toUpperCase()}</span></td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtPrice(priceVal)}</td>
            <td style="font-family:var(--font-price);">${tr.size} ${symbolStr}</td>
            <td style="color:#8b92a4; font-size:11px;">Taker</td>
            <td style="color:#8b92a4; font-size:11px;">$0.00</td>
            <td style="font-family:var(--font-price); font-weight:700;" class="${isUp ? 'up' : 'down'}">
              ${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnlVal)}
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

function renderTradeDeskOrderBookAndTrades() {
  const obContainer = document.getElementById('orderbook-compact-grid');
  const trContainer = document.getElementById('recent-trades-compact-list');
  if (!selectedCoin) return;

  const price = selectedCoin.price;
  if (obContainer) {
    const asks = [
      { p: price * 1.0032, s: (Math.random() * 2.8 + 0.1).toFixed(3), w: 85 },
      { p: price * 1.0025, s: (Math.random() * 2.2 + 0.1).toFixed(3), w: 72 },
      { p: price * 1.0019, s: (Math.random() * 3.4 + 0.2).toFixed(3), w: 90 },
      { p: price * 1.0013, s: (Math.random() * 1.5 + 0.1).toFixed(3), w: 45 },
      { p: price * 1.0008, s: (Math.random() * 0.9 + 0.05).toFixed(3), w: 30 },
      { p: price * 1.0003, s: (Math.random() * 0.4 + 0.02).toFixed(3), w: 18 }
    ];

    const bids = [
      { p: price * 0.9997, s: (Math.random() * 0.5 + 0.05).toFixed(3), w: 22 },
      { p: price * 0.9992, s: (Math.random() * 1.2 + 0.1).toFixed(3), w: 38 },
      { p: price * 0.9986, s: (Math.random() * 2.5 + 0.2).toFixed(3), w: 68 },
      { p: price * 0.9980, s: (Math.random() * 1.8 + 0.1).toFixed(3), w: 55 },
      { p: price * 0.9973, s: (Math.random() * 3.2 + 0.4).toFixed(3), w: 88 },
      { p: price * 0.9965, s: (Math.random() * 4.1 + 0.6).toFixed(3), w: 95 }
    ];

    obContainer.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:11px; color:#8b92a4; padding-bottom:6px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
        <span>Price (${selectedCoin.symbol})</span>
        <span>Size</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:3px;">
        ${asks.map(a => `
          <div style="position:relative; display:flex; justify-content:space-between; font-size:12px; font-family:var(--font-price); padding:3px 6px; border-radius:4px; overflow:hidden;">
            <div style="position:absolute; right:0; top:0; bottom:0; width:${a.w}%; background:rgba(240, 79, 94, 0.12); pointer-events:none;"></div>
            <span style="color:#f04f5e; font-weight:700; position:relative; z-index:1;">${fmtPrice(a.p)}</span>
            <span style="color:#c0c6d4; position:relative; z-index:1;">${a.s}</span>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center; padding:8px 0; font-size:15px; font-weight:800; font-family:var(--font-price); color:#ff9900; background:rgba(255, 153, 0, 0.05); border-radius:6px; margin:6px 0; display:flex; align-items:center; justify-content:center; gap:6px;">
        <span>${getCurrencySymbol()}${fmtPrice(price)}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
      </div>
      <div style="display:flex; flex-direction:column; gap:3px;">
        ${bids.map(b => `
          <div style="position:relative; display:flex; justify-content:space-between; font-size:12px; font-family:var(--font-price); padding:3px 6px; border-radius:4px; overflow:hidden;">
            <div style="position:absolute; right:0; top:0; bottom:0; width:${b.w}%; background:rgba(0, 192, 135, 0.12); pointer-events:none;"></div>
            <span style="color:#00c087; font-weight:700; position:relative; z-index:1;">${fmtPrice(b.p)}</span>
            <span style="color:#c0c6d4; position:relative; z-index:1;">${b.s}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (trContainer) {
    const times = ['10:35:12', '10:35:08', '10:34:55', '10:34:42', '10:34:30', '10:34:11', '10:33:58', '10:33:45'];
    trContainer.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:11px; color:#8b92a4; padding-bottom:6px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:3px;">
        ${times.map((t, idx) => {
          const isBuy = idx % 2 === 0;
          const trPrice = price * (1 + (isBuy ? 0.0002 : -0.0002) * idx);
          return `
            <div style="display:flex; justify-content:space-between; font-size:12px; font-family:var(--font-price); padding:3px 6px;">
              <span style="color:${isBuy ? '#00c087' : '#f04f5e'}; font-weight:700;">${fmtPrice(trPrice)}</span>
              <span style="color:#c0c6d4;">${(Math.random() * 0.8 + 0.05).toFixed(3)}</span>
              <span style="color:#6b7280; font-size:11px;">${t}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

let deferredPwaInstallPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaInstallPrompt = e;
  });
}

function openPwaInstallPrompt() {
  if (deferredPwaInstallPrompt) {
    deferredPwaInstallPrompt.prompt();
    deferredPwaInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult && choiceResult.outcome === 'accepted') {
        if (typeof showNotification === 'function') {
          showNotification('VTrade App added to Home Screen!', 'success');
        }
      }
      deferredPwaInstallPrompt = null;
    });
    return;
  }

  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos) {
    if (typeof showNotification === 'function') {
      showNotification("To install on iOS: Tap 'Share' (⎋) in Safari and select 'Add to Home Screen' (+)", 'info', 7000);
    } else if (typeof alert === 'function') {
      alert("To install on iOS: Tap Safari's 'Share' button and select 'Add to Home Screen'");
    }
  } else {
    if (typeof showNotification === 'function') {
      showNotification('Downloading VTrade Android APK directly...', 'success');
    }
    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = '/vtrade.apk';
      link.download = 'VTrade.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

// ─── 24. SCREENSHOT 2 MY PROFILE DRAWER & NET P&L DASHBOARD CONTROLLER ──────────────
function updateDrawerProfileUI() {
  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const isAuthed = !!(sess && !sess.isGuest && sess.email);
  const displayName = isAuthed ? ((userProfile && userProfile.name) || sess.username || 'Trader') : 'Guest';
  const initial = isAuthed ? (displayName[0] || 'U').toUpperCase() : '👤';

  // Screenshot 2 Header Block Initial & Label
  const hmpInitial = document.getElementById('hmp-avatar-initial');
  if (hmpInitial) hmpInitial.textContent = initial;

  const hmpLabel = document.getElementById('hmp-label-text');
  if (hmpLabel) {
    hmpLabel.textContent = isAuthed ? (displayName || 'My Profile') : 'Sign In';
  }

  // Drawer Profile Card
  const vpdAvatar = document.getElementById('vpd-ac-avatar');
  if (vpdAvatar) vpdAvatar.textContent = initial;

  const vpdTitle = document.getElementById('vpd-ac-title');
  if (vpdTitle) vpdTitle.textContent = isAuthed ? displayName : 'Guest Trader';

  const vpdSub = document.getElementById('vpd-ac-sub');
  if (vpdSub) vpdSub.textContent = isAuthed ? sess.email : 'Click to Sign In / Register';

  const vpdBal = document.getElementById('vpd-abb-val');
  if (vpdBal && typeof walletState !== 'undefined') {
    vpdBal.textContent = isAuthed ? `${getCurrencySymbol()}${fmtMoney(walletState.cashBalance || 10000)}` : 'Sign In';
  }

  const vpdCurr = document.getElementById('vpd-curr-label');
  if (vpdCurr && typeof walletState !== 'undefined') {
    vpdCurr.textContent = walletState.currency === 'INR' ? 'INR (₹)' : 'USD ($)';
  }

  // Bottom action button: Sign Out for authed users, Sign In to Terminal for guests
  const signoutBtn = document.getElementById('vpd-signout-btn');
  if (signoutBtn) {
    if (isAuthed) {
      signoutBtn.innerHTML = `
        <span>Sign Out</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      `;
      signoutBtn.onclick = handleDrawerSignOut;
    } else {
      signoutBtn.innerHTML = `
        <span>Sign In to Terminal</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
      `;
      signoutBtn.onclick = () => {
        closeProfileDrawer();
        openAuthModal('login');
      };
    }
  }

  // Sync avatar chips in drawer
  ['bitcoin', 'ethereum', 'solana', 'doge'].forEach(key => {
    const chip = document.getElementById(`drawer-pab-${key}`);
    if (chip) chip.classList.toggle('active', (userProfile.selectedPreset || '').toLowerCase() === key);
  });

  // Sync theme options in drawer
  const currentTheme = (typeof document !== 'undefined' && document.documentElement && typeof document.documentElement.getAttribute === 'function' && document.documentElement.getAttribute('data-theme')) || 'obsidian';
  ['obsidian', 'midnight', 'oled', 'cyber'].forEach(t => {
    const btn = document.getElementById(`drawer-theme-${t}`);
    if (btn) btn.classList.toggle('active', t === currentTheme);
  });
}

function handleHeaderProfileClick() {
  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const isAuthed = !!(sess && !sess.isGuest && sess.email);
  if (!isAuthed) {
    if (typeof openAuthModal === 'function') openAuthModal('login');
  } else {
    toggleProfileDrawer();
  }
}

function toggleProfileDrawer(forceState) {
  const drawer = document.getElementById('vtrade-profile-drawer');
  const backdrop = document.getElementById('vtrade-profile-backdrop');
  if (!drawer) return;

  const shouldOpen = typeof forceState === 'boolean' ? forceState : !drawer.classList.contains('is-open');
  if (shouldOpen) {
    updateDrawerProfileUI();
    drawer.classList.add('is-open');
    if (backdrop) backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('is-open');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function openProfileDrawer() {
  toggleProfileDrawer(true);
}

function closeProfileDrawer() {
  toggleProfileDrawer(false);
}

function handleDrawerAccountClick() {
  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const isAuthed = !!(sess && !sess.isGuest && sess.email);
  closeProfileDrawer();
  if (isAuthed) {
    if (typeof openProfileEditModal === 'function') openProfileEditModal();
  } else {
    if (typeof openAuthModal === 'function') openAuthModal('login');
  }
}

function toggleDrawerConnectDropdown() {
  const dd = document.getElementById('vpd-cc-dropdown');
  const arrow = document.getElementById('vpd-cc-arrow');
  if (dd) dd.classList.toggle('hidden');
  if (arrow) arrow.classList.toggle('open');
}

function handleDrawerSignOut() {
  closeProfileDrawer();
  if (typeof handleAuthLogout === 'function') {
    handleAuthLogout();
  }
}

function openPnLDashboardModal() {
  const modal = document.getElementById('pnl-dashboard-modal');
  if (modal) {
    modal.classList.remove('hidden');
    renderPnLDashboard();
  }
}

function closePnLDashboardModal() {
  const modal = document.getElementById('pnl-dashboard-modal');
  if (modal) modal.classList.add('hidden');
}

function renderPnLDashboard() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (Oct = 9)
  // Dynamically calculate actual number of days in the current month (28, 29, 30, or 31)
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[currentMonth];

  // Set Headers & Badges
  const mchTitle = document.getElementById('pnl-mch-title');
  if (mchTitle) mchTitle.textContent = `${monthName} ${currentYear}`;

  const mchSub = document.getElementById('pnl-mch-sub');
  if (mchSub) mchSub.textContent = `${totalDaysInMonth} Days in Month`;

  const periodBadge = document.getElementById('pnl-period-badge');
  if (periodBadge) periodBadge.textContent = `${totalDaysInMonth} Days`;

  // Aggregate user trades for current month
  const trades = typeof getTradeHistoryList === 'function' ? getTradeHistoryList() : (walletState.tradesHistory || []);
  const dayTrades = {};

  let totalProfit = 0;
  let totalLoss = 0;
  let profitTradesCount = 0;
  let lossTradesCount = 0;

  trades.forEach(t => {
    let tDate;
    if (t.closed_at) {
      tDate = new Date(t.closed_at);
    } else if (t.id && typeof t.id === 'number') {
      tDate = new Date(t.id);
    } else {
      tDate = new Date();
    }

    if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
      const day = tDate.getDate();
      if (!dayTrades[day]) dayTrades[day] = { pnl: 0, count: 0 };
      const pnl = Number(t.pnl) || 0;
      dayTrades[day].pnl += pnl;
      dayTrades[day].count += 1;

      if (pnl > 0) {
        totalProfit += pnl;
        profitTradesCount += 1;
      } else if (pnl < 0) {
        totalLoss += Math.abs(pnl);
        lossTradesCount += 1;
      }
    }
  });

  const netRealized = totalProfit - totalLoss;
  const avgProfit = profitTradesCount > 0 ? (totalProfit / profitTradesCount) : 0;
  const avgLoss = lossTradesCount > 0 ? (totalLoss / lossTradesCount) : 0;
  const sym = typeof getCurrencySymbol === 'function' ? getCurrencySymbol() : '$';

  // Update Left Net Realized P&L
  const netValEl = document.getElementById('pnl-net-value');
  if (netValEl) {
    if (netRealized > 0) {
      netValEl.textContent = `+${sym}${fmtMoney(netRealized)}`;
      netValEl.className = 'pnl-net-value';
    } else if (netRealized < 0) {
      netValEl.textContent = `-${sym}${fmtMoney(Math.abs(netRealized))}`;
      netValEl.className = 'pnl-net-value is-loss';
    } else {
      netValEl.textContent = `${sym}0`;
      netValEl.className = 'pnl-net-value is-neutral';
    }
  }

  // Update Right Stats
  const totProfitEl = document.getElementById('pnl-total-profit-val');
  if (totProfitEl) totProfitEl.textContent = totalProfit > 0 ? `${sym}${fmtMoney(totalProfit)}` : `${sym}0`;

  const avgProfitEl = document.getElementById('pnl-avg-profit-sub');
  if (avgProfitEl) avgProfitEl.textContent = `Average Profit: ${sym}${fmtMoney(avgProfit)} / trade`;

  const totLossEl = document.getElementById('pnl-total-loss-val');
  if (totLossEl) totLossEl.textContent = totalLoss > 0 ? `${sym}${fmtMoney(totalLoss)}` : `${sym}0`;

  const avgLossEl = document.getElementById('pnl-avg-loss-sub');
  if (avgLossEl) avgLossEl.textContent = `Average Loss: ${sym}${fmtMoney(avgLoss)} / trade`;

  // Render Dynamic Days Grid according to month days
  const grid = document.getElementById('pnl-days-grid');
  const tooltip = document.getElementById('pnl-day-tooltip');
  if (grid) {
    grid.innerHTML = '';
    const shortMonth = monthName.slice(0, 3);

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const cell = document.createElement('div');
      if (!cell.dataset) cell.dataset = {};
      const data = dayTrades[d];

      let tipText = `${d} ${shortMonth}: ${sym}0`;
      if (!data || data.count === 0) {
        // Normal color for days with no trades (neutral dark glass, no green, no red)
        cell.className = 'pnl-day-cell no-trade';
        tipText = `${d} ${shortMonth}: ${sym}0`;
      } else if (data.pnl > 0) {
        // Green block for profit days
        cell.className = 'pnl-day-cell is-profit';
        tipText = `${d} ${shortMonth}: +${sym}${fmtMoney(data.pnl)}`;
      } else if (data.pnl < 0) {
        // Red block for loss days
        cell.className = 'pnl-day-cell is-loss';
        tipText = `${d} ${shortMonth}: -${sym}${fmtMoney(Math.abs(data.pnl))}`;
      } else {
        cell.className = 'pnl-day-cell no-trade';
        tipText = `${d} ${shortMonth}: ${sym}0`;
      }

      // Hover tooltip: Never show the word "Profit", only Date and Amount
      cell.dataset.tip = tipText;
      if (cell.setAttribute) cell.setAttribute('data-tip', tipText);

      // No words written inside tiles (as requested by user)
      cell.textContent = '';

      // Hover events
      if (cell.addEventListener) {
        cell.addEventListener('mouseenter', (e) => {
          if (!tooltip) return;
          const tip = (cell.dataset && cell.dataset.tip) || (cell.getAttribute && cell.getAttribute('data-tip')) || '';
          tooltip.textContent = tip;
          if (tooltip.classList && tooltip.classList.remove) tooltip.classList.remove('hidden');
          if (cell.getBoundingClientRect && cell.closest) {
            const parent = cell.closest('.pnl-box-middle');
            if (parent && parent.getBoundingClientRect) {
              const rect = cell.getBoundingClientRect();
              const parentRect = parent.getBoundingClientRect();
              const leftOffset = rect.left - parentRect.left + (rect.width / 2);
              const topOffset = rect.top - parentRect.top - 36;
              tooltip.style.left = `${leftOffset}px`;
              tooltip.style.top = `${topOffset}px`;
            }
          }
        });

        cell.addEventListener('mouseleave', () => {
          if (tooltip && tooltip.classList && tooltip.classList.add) tooltip.classList.add('hidden');
        });
      }

      grid.appendChild(cell);
    }
  }
}

if (typeof window !== 'undefined') {
  window.handleAuthLogout = handleAuthLogout;
  window.logoutAuthUser = logoutAuthUser;
  window.logoutDesktopUser = logoutDesktopUser;
  window.closeAuthModal = closeAuthModal;
  window.handleForgotPasswordClick = handleForgotPasswordClick;
  window.quickFillAuthModal = quickFillAuthModal;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.openPwaInstallPrompt = openPwaInstallPrompt;
  window.openCustomBalanceModal = openCustomBalanceModal;
  window.closeCustomBalanceModal = closeCustomBalanceModal;
  window.setCustomBalanceInput = setCustomBalanceInput;
  window.applyCustomBalance = applyCustomBalance;
  window.refillPaperDemoBalance = refillPaperDemoBalance;

  // Profile Drawer & Net P&L Dashboard Exports
  window.handleHeaderProfileClick = handleHeaderProfileClick;
  window.toggleProfileDrawer = toggleProfileDrawer;
  window.openProfileDrawer = openProfileDrawer;
  window.closeProfileDrawer = closeProfileDrawer;
  window.updateDrawerProfileUI = updateDrawerProfileUI;
  window.handleDrawerAccountClick = handleDrawerAccountClick;
  window.toggleDrawerConnectDropdown = toggleDrawerConnectDropdown;
  window.handleDrawerSignOut = handleDrawerSignOut;
  window.openPnLDashboardModal = openPnLDashboardModal;
  window.closePnLDashboardModal = closePnLDashboardModal;
  window.renderPnLDashboard = renderPnLDashboard;
  window.updateCandleCountdown = updateCandleCountdown;
  window.startCandleCountdownEngine = startCandleCountdownEngine;
  window.restoreSavedChartState = restoreSavedChartState;
  window.updateChartSettings = updateChartSettings;
  window.openMarketSelectorModal = openMarketSelectorModal;
  window.toggleChartIndicator = toggleChartIndicator;
  window.toggleChartCountdown = toggleChartCountdown;
  window.toggleIndicatorsDropdown = toggleIndicatorsDropdown;
  window.closeIndicatorsDropdown = closeIndicatorsDropdown;
  window.syncIndicatorsUI = syncIndicatorsUI;
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('click', () => closeIndicatorsDropdown());
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(initVTradeApp, 50);
    });
  } else {
    // DOM already loaded / interactive - start immediately!
    setTimeout(initVTradeApp, 20);
  }
}

