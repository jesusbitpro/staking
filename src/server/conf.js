module.exports = {
  "common": {
    "network": process.env.NETWORK,
    "stake": process.env.STAKE,
    "fee": process.env.FEE,
    "lev": process.env.LEV,
    "sale": process.env.SALE,
    "feeDecimals": process.env.FEEDECIMALS - 0,
    "levDecimals": process.env.LEVDECIMALS - 0,
  },
  "ip": "0.0.0.0",
  "port": "8888",
  "socketprovider": process.env.SOCKETPROVIDER,
}
