const affirm = require("affirm.js");
const browserUtil = require("./browserUtil");
const Web3 = require('web3');
const config = require("./conf");
const feeABI = require("../../build/contracts/Fee.json").abi;
const levABI = require("../../build/contracts/Token.json").abi;
const stakeABI = require("../../build/contracts/Stake.json").abi;

module.exports = (function () {
  let contract = {};
  contract.isManual = browserUtil.getLocal("isManual") === "true";
  contract.user = browserUtil.getLocal('userid');
  let stake, lev, fee;
  let userInfo = {};
  contract.isMetaMask = function () {
    return !!(window.web3 && window.web3.currentProvider);
  };

  contract.setManual = async function (_isManual) {
    contract.isManual = _isManual;
    let provider = _isManual ? new Web3.providers.HttpProvider(config.network) : window.web3.currentProvider;
    window.web3 = new Web3(provider);
    await setUser();
    stake = new web3.eth.Contract(stakeABI, config.stake);
    lev = new web3.eth.Contract(levABI, config.lev);
    fee = new web3.eth.Contract(feeABI, config.fee);
  };

  contract.setUser = function (_user) {
    user = _user;
    browserUtil.setLocal("userid", _user);
  };

  contract.updateUserInfo = async function () {
    let result = await Promise.all([
      lev.methods.balanceOf(user).call(),
      stake.methods.stakes(user).call(),
      lev.methods.allowance(user, config.stake).call()
    ]);
    result = result.map(num => ((num - 0) / Math.pow(10, config.levDecimals)).toFixed(config.levDecimals) - 0);
    userInfo = {lev: result[0], staked: result[1], approved: result[2]};
  };

  contract.getApproveInfo = async function (levCounts) {
    affirm(levCounts > 0, "Amount to approve must be greater than 0");
    let amount = Math.floor(levCounts * Math.pow(10, config.levDecimals));
    let tx = await lev.methods.approve(config.stake, amount);
    return {
      address: config.lev,
      amount: 0,
      gas: await tx.estimateGas(),
      data: tx.encodeABI()
    };
  };

  contract.approve = async function (levCounts) {
    if (contract.isManual) return;
    affirm(levCounts > 0, "Amount to approve must be greater than 0");
    let amount = Math.floor(levCounts * Math.pow(10, config.levDecimals));
    await lev.methods.approve(config.stake, amount).send({from: user});
  };

  contract.getStakeInfo = async function (levCounts) {
    affirm(levCounts > 0, "Amount to stake must be greater than 0");
    let amount = Math.floor(levCounts * Math.pow(10, config.levDecimals));
    let tx = await stake.methods.stakeTokens(amount);
    return {
      address: config.stake,
      amount: 0,
      gas: await tx.estimateGas(),
      data: tx.encodeABI()
    };
  };

  contract.stake = async function (levCounts) {
    if (contract.isManual) return;
    affirm(levCounts > 0, "Amount to approve must be greater than 0");
    let amount = Math.floor(levCounts * Math.pow(10, config.levDecimals));
    await stake.methods.stakeTokens(amount).send({from: user});
  };

  contract.getUserInfo = function () {
    return userInfo;
  };

  async function setUser() {
    if (!contract.isManual) user = (await web3.eth.getAccounts())[0];
  }

  return contract;
})();