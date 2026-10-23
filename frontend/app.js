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
    "price": 81911.91,
    "change": 0.422,
    "high": 82078,
    "low": 80819.66,
    "vol": "610.0M",
    "tvSymbol": "BINANCE:BTCUSDT"
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
    "price": 2423.02,
    "change": -0.201,
    "high": 2441.66,
    "low": 2356.79,
    "vol": "322.0M",
    "tvSymbol": "BINANCE:ETHUSDT"
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
    "price": 4134.90,
    "open": 4140.77,
    "change": -0.16,
    "high": 4150.0,
    "low": 4125.0,
    "vol": "8.5M"
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
    "price": 104.3,
    "change": -0.515,
    "high": 105.28,
    "low": 101.25,
    "vol": "110.5M",
    "tvSymbol": "BINANCE:SOLUSDT"
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
    "icon": "icons/bnb.png",
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
    "icon": "icons/doge.png",
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
    "icon": "icons/ada.png",
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
    "icon": "icons/avax.png",
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
    "icon": "icons/sui.png",
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
    "icon": "icons/near.png",
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
    "icon": "icons/apt.png",
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
    "icon": "icons/dot.png",
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
    "icon": "icons/trx.png",
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
    "icon": "icons/ton.png",
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
    "icon": "icons/fil.png",
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
    "icon": "icons/icp.png",
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
    "icon": "icons/sei.png",
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
    "icon": "icons/tia.png",
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
    "icon": "icons/algo.png",
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
    "icon": "icons/hbar.png",
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
    "icon": "icons/atom.png",
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
    "icon": "icons/xlm.png",
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
    "icon": "icons/ftm.png",
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
    "icon": "icons/vet.png",
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
    "icon": "icons/ltc.png",
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
    "icon": "icons/bch.png",
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
    "icon": "icons/etc.png",
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
    "icon": "icons/uni.png",
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
    "icon": "icons/link.png",
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
    "icon": "icons/aave.png",
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
    "icon": "icons/mkr.png",
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
    "icon": "icons/crv.png",
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
    "icon": "icons/ldo.png",
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
    "icon": "icons/pendle.png",
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
    "icon": "icons/inj.png",
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
    "icon": "icons/jup.png",
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
    "icon": "icons/rune.png",
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
    "icon": "icons/snx.png",
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
    "icon": "icons/dydx.png",
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
    "icon": "icons/arb.png",
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
    "icon": "icons/op.png",
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
    "icon": "icons/pol.png",
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
    "icon": "icons/strk.png",
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
    "icon": "icons/shib.png",
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
    "icon": "icons/pepe.png",
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
    "icon": "icons/wif.png",
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
    "icon": "icons/bonk.png",
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
    "icon": "icons/floki.png",
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
    "icon": "icons/bome.png",
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
    "icon": "icons/meme.png",
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
    "icon": "icons/render.png",
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
    "icon": "icons/fet.png",
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
    "icon": "icons/tao.png",
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
    "icon": "icons/wld.png",
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
    "icon": "icons/grt.png",
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
    cashBalance: 10000.00, // $10,000 USD virtual demo cash
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
  const emailInput = document.getElementById('login-email');
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
        const regEmail = document.getElementById('register-email');
        if (regEmail) regEmail.value = cleanEmail;
        return;
      }
    } catch (e) {}
  }

  if (!user && !cloudAccountExists) {
    showAuthAlert('⚠️ Account is not registered. Please create an account first.', 'error');
    showToast('Account is not registered. Please create an account first.', 'error');
    switchAuthTab('register');
    const regEmail = document.getElementById('register-email');
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
  const pwdInput = document.getElementById('login-password');
  if (pwdInput) pwdInput.value = newPwd;
}

async function handleAuthLogin(event) {
  if (event) event.preventDefault();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (typeof updateNetworkStatus === 'function') updateNetworkStatus(false);
    showAuthAlert('Internet connection is required to sign in.', 'error');
    showToast('Internet connection is required to sign in. Please connect to internet.', 'error');
    return;
  }

  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const rememberBox = document.getElementById('login-remember');
  const loginBtn = document.querySelector('#auth-login-form button[type="submit"]') || document.getElementById('login-submit-btn');

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
      const regEmail = document.getElementById('register-email');
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

  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const pwdInput = document.getElementById('register-password');
  const regBtn = document.querySelector('#auth-register-form button[type="submit"]') || document.getElementById('register-submit-btn');

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
    const loginEmail = document.getElementById('login-email');
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
      showToast(`Account created! Welcome to VTrade, ${sess.username}!`, 'success');
      syncWalletWithCloud(true);
      return;
    } else {
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 400 && data.error && data.error.includes('already exists')) {
        showAuthAlert('⚠️ Account already exists! Please Sign In.', 'error');
        showToast('Account already exists! Please Sign In.', 'error');
        switchAuthTab('login');
        const loginEmail = document.getElementById('login-email');
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

// ─── 7. BOTTOM NAVIGATION CONTROLLER & ANIMATION ENGINE ─────────────────
function switchBottomTab(tab) {
  activeTab = tab || 'home';

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

  if (activeTab === 'home') renderHomeScreen();
  else if (activeTab === 'markets') renderMarketsScreen();
  else if (activeTab === 'trade') renderTradeScreen();
  else if (activeTab === 'portfolio') renderPortfolioScreen();
  else if (activeTab === 'account') renderAccountScreen();
  else if (activeTab === 'auth') renderDesktopAuthPage();

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

function initScrollRevealEngine() {
  const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed), .home-market-intel-grid:not(.is-revealed)');
  if (elements.length === 0) return;

  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) {
    elements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

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

window.updateNavIndicator = updateNavIndicator;
window.initHeroTextAnimation = initHeroTextAnimation;
window.initScrollRevealEngine = initScrollRevealEngine;
window.initSpotlightAndTiltCards = initSpotlightAndTiltCards;

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

function renderHomeSpotlightBento() {
  const bentoGrid = document.getElementById('home-spotlight-bento');
  if (!bentoGrid || typeof COINS === 'undefined') return;

  const spotlightIds = ['bitcoin', 'ethereum', 'gold', 'solana'];
  const spotlightCoins = spotlightIds.map(id => COINS.find(c => c.id === id)).filter(Boolean);

  bentoGrid.innerHTML = spotlightCoins.map(c => {
    const isUp = c.change >= 0;
    const displayPair = getCoinDisplayPair(c);
    return `
      <div class="bento-card spotlight-card tilt-card" onclick="selectCoinAndTrade('${c.id}')">
        <div class="bento-card-top">
          <div class="bento-card-asset">
            <img src="${c.icon}" alt="${c.symbol}" class="bento-coin-icon" onerror="handleCoinIconError(this, '${c.symbol}', '${c.category}')" />
            <div>
              <div class="bento-sym">${displayPair}</div>
              <div class="bento-name">${c.name}</div>
            </div>
          </div>
          <span class="coin-lev-badge">${c.maxLev}x</span>
        </div>
        <div class="bento-price-row">
          <span class="bento-price">${getCurrencySymbol()}${fmtPrice(c.price)}</span>
          <span class="bento-chg ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${c.change ? c.change.toFixed(2) : '0.00'}%</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#8b92a4; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05);">
          <span>24h Vol: ${c.vol || 'N/A'}</span>
          <span style="color:#ff9900; font-weight:700;">Trade Desk →</span>
        </div>
      </div>
    `;
  }).join('');
  if (typeof initSpotlightAndTiltCards === 'function') initSpotlightAndTiltCards();
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
  timezone: 'Etc/UTC'
};

let currentChartSettings = { ...DEFAULT_CHART_SETTINGS };

function loadChartSettings() {
  try {
    const raw = localStorage.getItem('vtrade_tv_chart_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        currentChartSettings = { ...DEFAULT_CHART_SETTINGS, ...parsed };
      }
    }
  } catch (e) {}
}

function saveChartSettings() {
  try {
    localStorage.setItem('vtrade_tv_chart_settings', JSON.stringify(currentChartSettings));
  } catch (e) {}
}

function getTradingViewOverrides() {
  loadChartSettings();
  const up = currentChartSettings.upColor || '#00c087';
  const down = currentChartSettings.downColor || '#f04f5e';
  const bg = currentChartSettings.bgColor || '#080b11';
  let gridColor = 'rgba(0, 0, 0, 0)';
  if (currentChartSettings.grid === 'subtle') gridColor = 'rgba(255, 255, 255, 0.04)';
  if (currentChartSettings.grid === 'visible') gridColor = 'rgba(255, 255, 255, 0.09)';

  return {
    "paneProperties.background": bg,
    "paneProperties.vertGridProperties.color": gridColor,
    "paneProperties.horzGridProperties.color": gridColor,
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
    "mainSeriesProperties.haStyle.borderDownColor": down
  };
}

function renderTradingViewChart() {
  const forceReload = arguments[0] === true;
  const iframe = document.getElementById('tradingview-chart-iframe');
  if (!iframe) return;

  loadChartSettings();
  const overrides = getTradingViewOverrides();

  const tvSymbol = selectedCoin.tvSymbol || ('BINANCE:' + (selectedCoin.binanceSym || 'BTCUSDT'));
  const tvIntervalMap = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30',
    '1h': '60', '2h': '120', '4h': '240', '1d': 'D', '1w': 'W', '1M': 'M'
  };
  const intervalCode = tvIntervalMap[chartInterval] || '60';

  const newSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview-chart-iframe&symbol=${encodeURIComponent(tvSymbol)}&interval=${intervalCode}&theme=dark&style=${currentChartSettings.chartStyle}&timezone=${encodeURIComponent(currentChartSettings.timezone)}&studies=%5B%5D&hide_side_toolbar=1&hide_top_toolbar=0&allow_symbol_change=0&save_image=0&locale=en&overrides=${encodeURIComponent(JSON.stringify(overrides))}`;

  if (forceReload || !iframe.src || !iframe.src.includes(`symbol=${encodeURIComponent(tvSymbol)}`) || !iframe.src.includes(`interval=${intervalCode}`)) {
    iframe.src = newSrc;
  }
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
    const isUp = selectedCoin.change >= 0;
    chgEl.className = `tv-fs-change-pill ${isUp ? 'up' : 'down'}`;
    chgEl.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
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

  const url = `https://s.tradingview.com/widgetembed/?frameElementId=tv-fullscreen-iframe&symbol=${encodeURIComponent(tvSymbol)}&interval=${intervalCode}&theme=dark&style=${currentChartSettings.chartStyle}&timezone=${encodeURIComponent(currentChartSettings.timezone)}&studies=%5B%5D&hide_side_toolbar=0&hide_top_toolbar=0&allow_symbol_change=1&save_image=0&enable_publishing=0&hideideas=1&withdateranges=1&locale=en&overrides=${encodeURIComponent(JSON.stringify(overrides))}`;
  if (forceReload || !iframe.src || iframe.src !== url) {
    iframe.src = url;
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

function syncChartSettingsUI() {
  const upInput = document.getElementById('cs-input-up');
  const downInput = document.getElementById('cs-input-down');
  const upHex = document.getElementById('cs-hex-up');
  const downHex = document.getElementById('cs-hex-down');
  const tzSelect = document.getElementById('cs-timezone-select');

  if (upInput) upInput.value = currentChartSettings.upColor;
  if (downInput) downInput.value = currentChartSettings.downColor;
  if (upHex) upHex.textContent = currentChartSettings.upColor;
  if (downHex) downHex.textContent = currentChartSettings.downColor;
  if (tzSelect) tzSelect.value = currentChartSettings.timezone || 'Etc/UTC';

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
  const bgMap = {
    '#080b11': 'cs-bg-obsidian',
    '#000000': 'cs-bg-pure',
    '#0c101a': 'cs-bg-navy',
    '#151c2c': 'cs-bg-slate'
  };
  Object.entries(bgMap).forEach(([color, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', currentChartSettings.bgColor.toLowerCase() === color.toLowerCase());
  });
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
  if (upHex) upHex.textContent = up;
  if (downHex) downHex.textContent = down;

  document.querySelectorAll('.cs-preset-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function onCustomColorChange() {
  const upInput = document.getElementById('cs-input-up');
  const downInput = document.getElementById('cs-input-down');
  const upHex = document.getElementById('cs-hex-up');
  const downHex = document.getElementById('cs-hex-down');
  if (upInput) {
    currentChartSettings.upColor = upInput.value;
    if (upHex) upHex.textContent = upInput.value;
  }
  if (downInput) {
    currentChartSettings.downColor = downInput.value;
    if (downHex) downHex.textContent = downInput.value;
  }
  document.querySelectorAll('.cs-preset-pill').forEach(p => p.classList.remove('active'));
}

function applyBgPreset(bg, btn) {
  currentChartSettings.bgColor = bg;
  document.querySelectorAll('.cs-bg-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function setChartGrid(grid) {
  currentChartSettings.grid = grid;
  ['hidden', 'subtle', 'visible'].forEach(g => {
    const btn = document.getElementById(`cs-grid-${g}`);
    if (btn) btn.classList.toggle('active', g === grid);
  });
}

function setChartStyle(style) {
  currentChartSettings.chartStyle = style;
  ['1', '9', '8', '2'].forEach(s => {
    const btn = document.getElementById(`cs-style-${s}`);
    if (btn) btn.classList.toggle('active', s === style);
  });
}

function onTimezoneChange(tz) {
  currentChartSettings.timezone = tz;
}

function resetChartSettingsToDefault() {
  currentChartSettings = { ...DEFAULT_CHART_SETTINGS };
  saveChartSettings();
  syncChartSettingsUI();
  showToast('Chart settings reset to default');
}

function saveAndApplyChartSettings() {
  saveChartSettings();
  closeFsSettings();
  const fsModal = document.getElementById('tv-fullscreen-modal');
  if (fsModal && !fsModal.classList.contains('hidden')) {
    openFullscreenChart(true);
  }
  renderTradingViewChart(true);
  showToast('Chart colors & settings applied!', 'success');
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

  if (curIcon) {
    curIcon.src = selectedCoin.icon;
    curIcon.onerror = function() { handleCoinIconError(this, selectedCoin.symbol, selectedCoin.category); };
  }
  if (curSym) curSym.textContent = selectedCoin.pair;
  if (curFull) curFull.textContent = `${selectedCoin.name} Perpetual`;

  const isUp = selectedCoin.change >= 0;
  if (livePriceEl) livePriceEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
  if (liveChangeEl) {
    liveChangeEl.className = `trade-live-change ${isUp ? 'up' : 'down'}`;
    liveChangeEl.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
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
  if (priceVal) priceVal.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
  if (changeVal) {
    changeVal.className = `tib-val ${isUp ? 'up' : 'down'}`;
    changeVal.textContent = `${isUp ? '+' : ''}${selectedCoin.change ? selectedCoin.change.toFixed(2) : '0.00'}%`;
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
  connectCoinTickerWs(selectedCoin.binanceSym);
  updateDesktopOrderCalculations();
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
      showToast(`⚠️ Low demo funds refilled to ${getCurrencySymbol()}${fmtMoney(10000.00)}! Order executing...`, 'info');
    } else {
      showToast(`❌ Insufficient demo funds! Required: ${getCurrencySymbol()}${fmtMoney(reqMarginUsd)}, Available: ${getCurrencySymbol()}${fmtMoney(walletState.cashBalance)}`, 'error');
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
    closeCoinPickerModal();
    renderTradeScreen();
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
    const goldTmr = setTimeout(() => goldCtl.abort(), 2000);
    let tvGold = null;
    try {
      const tvResp = await fetch('https://scanner.tradingview.com/symbol?symbol=TVC:GOLD&fields=close,change,change_abs,open,high,low', { signal: goldCtl.signal });
      if (tvResp && tvResp.ok) tvGold = await tvResp.json();
    } catch (e) {}

    const gold = COINS.find(c => c.id === 'gold');
    if (gold) {
      if (tvGold && typeof tvGold.close === 'number' && tvGold.close > 0) {
        gold.price = parseFloat(tvGold.close.toFixed(2));
        if (typeof tvGold.change === 'number') gold.change = parseFloat(tvGold.change.toFixed(2));
        if (typeof tvGold.open === 'number') gold.open = parseFloat(tvGold.open.toFixed(2));
        if (typeof tvGold.high === 'number') gold.high = parseFloat(tvGold.high.toFixed(2));
        if (typeof tvGold.low === 'number') gold.low = parseFloat(tvGold.low.toFixed(2));
      } else {
        const goldR = await fetch('https://api.gold-api.com/price/XAU', { signal: goldCtl.signal }).then(r => r.json()).catch(() => null);
        if (goldR && goldR.price) {
          gold.price = parseFloat(parseFloat(goldR.price).toFixed(2));
          if (!gold.open || gold.open === 4166.10 || gold.open === 4133.65) gold.open = 4140.77;
          const diff = gold.price - gold.open;
          gold.change = parseFloat(((diff / gold.open) * 100).toFixed(2));
        }
      }
      if (activeTab === 'trade' && selectedCoin && selectedCoin.id === 'gold') {
        renderLivePriceUpdates();
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
  }, 2000); // Live 2-second TradingView price sync when viewing Gold
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
  if (binanceSym === 'PAXGUSDT') {
    pollLiveGoldPrice();
    return; // Gold uses direct TVC:GOLD TradingView scanner feed
  }

  // Connect to unblocked Binance Vision WebSocket with stream.binance.com fallback
  const endpoints = [
    `wss://data-stream.binance.vision/ws/${binanceSym.toLowerCase()}@kline_1d`,
    `wss://stream.binance.com:9443/ws/${binanceSym.toLowerCase()}@kline_1d`
  ];

  let endpointIdx = 0;

  function tryConnect() {
    if (activeTab !== 'trade' || !selectedCoin || selectedCoin.binanceSym !== binanceSym) return;
    try {
      const url = endpoints[endpointIdx % endpoints.length];
      liveTickerWs = new WebSocket(url);

      liveTickerWs.onmessage = (event) => {
        try {
          const d = JSON.parse(event.data);
          if (d && d.s === binanceSym && d.k && selectedCoin && selectedCoin.binanceSym === binanceSym) {
            const k = d.k;
            const newPrice = parseFloat(k.c);
            const openPrice = parseFloat(k.o);
            if (newPrice > 0 && !isNaN(newPrice)) {
              selectedCoin.price = newPrice;
              if (openPrice > 0 && !isNaN(openPrice)) {
                const diff = newPrice - openPrice;
                selectedCoin.change = parseFloat(((diff / openPrice) * 100).toFixed(2));
                selectedCoin.open = openPrice;
              }
              if (k.h) selectedCoin.high = parseFloat(k.h);
              if (k.l) selectedCoin.low = parseFloat(k.l);

              // Immediate order checking (0ms latency for limits/triggers)
              checkPendingOrdersTrigger();

              // Smooth 600ms DOM update throttle: eliminates rapid buzzing & matches TradingView cadence
              const now = Date.now();
              if (now - lastWsRenderTime >= 600) {
                lastWsRenderTime = now;
                if (wsRenderTimer) { clearTimeout(wsRenderTimer); wsRenderTimer = null; }
                renderLivePriceUpdates();
              } else if (!wsRenderTimer) {
                wsRenderTimer = setTimeout(() => {
                  lastWsRenderTime = Date.now();
                  wsRenderTimer = null;
                  renderLivePriceUpdates();
                }, 600 - (now - lastWsRenderTime));
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
    `https://data-api.binance.vision/api/v3/ticker/tradingDay?symbols=${encodedSymbols}`,
    `https://api.binance.com/api/v3/ticker/tradingDay?symbols=${encodedSymbols}`,
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
            // NEVER overwrite selectedCoin on Trade tab from background REST polling!
            // Live WebSocket handles selectedCoin exclusively to prevent jump/flicker
            if (activeTab === 'trade' && selectedCoin && c.id === selectedCoin.id) {
              return;
            }
            const t = tickerMap.get(c.binanceSym) || tickerMap.get(c.id);
            if (t) {
              c.price = parseFloat(t.lastPrice);
              c.change = parseFloat(t.priceChangePercent);
              if (t.openPrice) c.open = parseFloat(t.openPrice);
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
  } else if (activeTab === 'markets') {
    renderMarketsScreen();
  } else if (activeTab === 'trade') {
    const livePriceEl = document.getElementById('trade-header-price');
    const liveChangeEl = document.getElementById('trade-header-change');
    const isUp = selectedCoin.change >= 0;
    if (livePriceEl) {
      const prevPrice = lastRecordedPrices[selectedCoin.id];
      if (typeof prevPrice === 'number' && prevPrice !== selectedCoin.price) {
        triggerPriceFlash(livePriceEl, selectedCoin.price, prevPrice);
      }
      livePriceEl.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
    }
    if (liveChangeEl) {
      liveChangeEl.className = `trade-live-change ${isUp ? 'up' : 'down'}`;
      liveChangeEl.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
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
      const prevPrice = lastRecordedPrices[selectedCoin.id];
      if (typeof prevPrice === 'number' && prevPrice !== selectedCoin.price) {
        triggerPriceFlash(fsPrice, selectedCoin.price, prevPrice);
      }
      fsPrice.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.price)}`;
    }
    if (fsChange) {
      const isUp = selectedCoin.change >= 0;
      fsChange.className = `tv-fs-change-pill ${isUp ? 'up' : 'down'}`;
      fsChange.textContent = `${isUp ? '+' : ''}${selectedCoin.change.toFixed(2)}%`;
    }
    if (fsHigh) fsHigh.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.high || selectedCoin.price * 1.018)}`;
    if (fsLow) fsLow.textContent = `${getCurrencySymbol()}${fmtPrice(selectedCoin.low || selectedCoin.price * 0.982)}`;
    if (fsVol) fsVol.textContent = `${selectedCoin.vol || '304.6M USDT'}`;
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

  // Render TradingView Chart for active coin
  renderTradingViewChart();

  // Render initial screen
  switchBottomTab('home');

  // Initialize Aceternity & Skiper-UI Animation Suite
  initHeroTextAnimation();
  initScrollRevealEngine();
  initSpotlightAndTiltCards();
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
let desktopLeverage = 20;
let desktopSizeCoins = 0.05;

function syncDesktopHeaderState() {
  const tabs = ['home', 'markets', 'trade', 'portfolio', 'account', 'auth'];
  tabs.forEach(t => {
    const dbtn = document.getElementById(`dnav-${t}`);
    if (dbtn) dbtn.classList.toggle('active', t === activeTab);
  });
  const cashValEl = document.getElementById('header-cash-val');
  if (cashValEl && typeof walletState !== 'undefined') {
    cashValEl.textContent = `${getCurrencySymbol()}${fmtMoney(walletState.cashBalance || 10000)}`;
  }

  // Update Auth nav item & Header user pill
  const sess = typeof getAuthSession === 'function' ? getAuthSession() : null;
  const dnavAuthText = document.getElementById('dnav-auth-text');
  const hubName = document.getElementById('hub-name');
  const hubAvatar = document.getElementById('hub-avatar');

  if (sess && !sess.isGuest && sess.email) {
    const displayName = (userProfile && userProfile.name) || sess.username || 'Account';
    if (dnavAuthText) dnavAuthText.textContent = displayName;
    if (hubName) hubName.textContent = displayName;
    if (hubAvatar) hubAvatar.textContent = '🟢';
  } else {
    if (dnavAuthText) dnavAuthText.textContent = 'Sign In';
    if (hubName) hubName.textContent = 'Sign In';
    if (hubAvatar) hubAvatar.textContent = '👤';
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

function logoutDesktopUser() {
  logoutAuthUser();
  renderDesktopAuthPage();
  syncDesktopHeaderState();
  showToast('Signed out successfully.', 'info');
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
  });
}

function selectCoinAndTrade(coinId) {
  const found = COINS.find(c => c.id === coinId || c.symbol.toLowerCase() === coinId.toLowerCase());
  if (found) {
    selectedCoin = found;
  }
  switchBottomTab('trade');
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
  const mBtn = document.getElementById('dtod-type-market');
  const lBtn = document.getElementById('dtod-type-limit');
  const limitGroup = document.getElementById('dtod-limit-group');

  if (mBtn) mBtn.classList.toggle('active', type === 'market');
  if (lBtn) lBtn.classList.toggle('active', type === 'limit');
  if (limitGroup) limitGroup.classList.toggle('hidden', type !== 'limit');
  updateDesktopOrderCalculations();
}

function handleDesktopLeverageInput(val) {
  desktopLeverage = Math.min(parseInt(val) || 20, selectedCoin.maxLev || 150);
  const levVal = document.getElementById('dtod-lev-val');
  if (levVal) levVal.textContent = `${desktopLeverage}x`;

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
    c.classList.toggle('active', c.textContent.trim() === `${pct}%`);
  });
  updateDesktopOrderCalculations();
}

function updateDesktopOrderCalculations() {
  if (!selectedCoin) return;
  const unitEl = document.getElementById('dtod-coin-unit');
  if (unitEl) unitEl.textContent = selectedCoin.symbol;

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
  ['positions', 'orders', 'history'].forEach(t => {
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

function renderTradeBottomLedger() {
  const posCount = document.getElementById('ledger-pos-count');
  const ordCount = document.getElementById('ledger-ord-count');
  const histCount = document.getElementById('ledger-hist-count');
  
  const historyList = getTradeHistoryList();
  if (posCount && walletState && walletState.positions) posCount.textContent = walletState.positions.length;
  if (ordCount && walletState && walletState.orders) ordCount.textContent = walletState.orders.length;
  if (histCount) histCount.textContent = historyList.length;

  const posTbody = document.getElementById('tblc-positions-tbody');
  if (posTbody && walletState) {
    if (!walletState.positions || walletState.positions.length === 0) {
      posTbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:32px; color:#555f75;">No open positions. Place a Buy/Long or Sell/Short order above.</td></tr>`;
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
            <td><strong>${displayPair}</strong></td>
            <td><span class="pos-dir-badge ${pos.side}">${pos.side.toUpperCase()}</span></td>
            <td>${pos.leverage}x</td>
            <td>${pos.size} ${pos.symbol}</td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtPrice(pos.entryPrice)}</td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtPrice(curPrice)}</td>
            <td style="font-family:var(--font-price); color:#ff9900;">${getCurrencySymbol()}${fmtPrice(pos.liqPrice)}</td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtMoney(pos.margin)}</td>
            <td style="font-family:var(--font-price); font-weight:700;" class="${isUp ? 'up' : 'down'}">
              ${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnlUsd)} (${isUp ? '+' : ''}${roe.toFixed(2)}%)
            </td>
            <td>
              <button class="pos-close-btn" style="padding:4px 10px; font-size:12px;" onclick="closePosition(${pos.id})">Close</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const ordTbody = document.getElementById('tblc-orders-tbody');
  if (ordTbody && walletState) {
    if (!walletState.orders || walletState.orders.length === 0) {
      ordTbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:#555f75;">No pending limit orders.</td></tr>`;
    } else {
      ordTbody.innerHTML = walletState.orders.map(ord => {
        const coin = COINS.find(c => c.id === ord.coinId) || selectedCoin;
        const displayPair = getCoinDisplayPair(coin);
        return `
          <tr>
            <td><strong>${displayPair}</strong></td>
            <td>LIMIT</td>
            <td><span class="pos-dir-badge ${ord.side}">${ord.side.toUpperCase()}</span></td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtPrice(ord.price)}</td>
            <td>${ord.size} ${ord.symbol}</td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtMoney(ord.margin)}</td>
            <td style="color:#8b92a4; font-size:12px;">${ord.time || 'Just now'}</td>
            <td>
              <button class="pos-close-btn" style="padding:4px 10px; font-size:12px;" onclick="cancelPendingOrder(${ord.id})">Cancel</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const histTbody = document.getElementById('tblc-history-tbody');
  if (histTbody && walletState) {
    if (!historyList || historyList.length === 0) {
      histTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#555f75;">No closed trades yet.</td></tr>`;
    } else {
      histTbody.innerHTML = historyList.map(tr => {
        const pnlVal = typeof tr.pnl === 'number' ? tr.pnl : 0;
        const isUp = pnlVal >= 0;
        const symbolStr = tr.symbol || (tr.pair ? tr.pair.replace('/USDT', '') : 'BTC');
        const pairStr = tr.pair || `${symbolStr}/USDT`;
        const priceVal = tr.closePrice || tr.price || tr.entryPrice || 0;
        const timeStr = tr.closed_at ? new Date(tr.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (tr.time || 'Recently');
        return `
          <tr>
            <td><strong>${pairStr}</strong></td>
            <td><span class="pos-dir-badge ${tr.side}">${(tr.side || 'LONG').toUpperCase()}</span></td>
            <td>${tr.size} ${symbolStr}</td>
            <td style="font-family:var(--font-price);">${getCurrencySymbol()}${fmtPrice(priceVal)}</td>
            <td style="font-family:var(--font-price); font-weight:700;" class="${isUp ? 'up' : 'down'}">
              ${isUp ? '+' : ''}${getCurrencySymbol()}${fmtMoney(pnlVal)}
            </td>
            <td style="color:#8b92a4; font-size:12px;">${timeStr}</td>
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

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(initVTradeApp, 50);
    });
  } else {
    // DOM already loaded / interactive - start immediately!
    setTimeout(initVTradeApp, 20);
  }
}
