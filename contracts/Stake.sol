/**
  * stake users levs
  * get fee from trading contract
  * get eth from trading contract
  * calculate fee tokens to be generated
  * distribute fee tokens and lev to users in chunks.
  * re-purpose it for next trading duration.
  * what happens to extra fee if not enough trading happened? destroy it.
  * Stake will have full control over FEE.sol
  */

pragma solidity ^0.4.11;


import "tokens/HumanStandardToken.sol";


//import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./Fee.sol";


contract Stake {

    event StakeDebug(address indexed _owner, uint256 _value);
    /* user address to (lev tokens)*(blocks left to expiry) */
    mapping (address => uint256) levBlocks;
    /*user address to lev tokens at stake*/
    mapping (address => uint256) stakes;

    //todo: total lev tokens. This may not be required. revisit
    uint256 public totalLevs;

    /*total lev blocks. this will be help not to iterate through full mapping*/
    uint256 public totalLevBlocks;

    /*wei for each Fee token*/
    uint256 public weiPerFee;
    /* total fee to be distributed */
    uint256 public feeForThePeriod;

    /*Lev token reference*/
    address public tokenid;

    HumanStandardToken public token;

    uint public startBlock;

    uint public expiryBlock;

    /*owner address for admin functions*/
    address public owner;

    /* fee token reference*/
    address public feeTokenId;

    Fee public fee;

    /* wei owned by contarct */
    uint256 public weiAsFee;


    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    modifier started{
        require(block.number >= startBlock);
        _;
    }

    modifier notExpired{
        require(block.number < expiryBlock);
        _;
    }

    modifier hasExpired{
        require(block.number >= expiryBlock);
        _;
    }

    function getLevBlocks(address _for) constant returns (uint256 levBlock){
        return levBlocks[_for];
    }

    function getStakes(address _for) constant returns (uint256 stake){
        return stakes[_for];
    }

    function Stake(address _owner, uint256 _weiPerFee, address _tokenid, uint _expiryBlock){
        require(_weiPerFee > 0);
        tokenid = _tokenid;
        expiryBlock = _expiryBlock;
        owner = _owner;
        token = HumanStandardToken(_tokenid);
        weiPerFee = _weiPerFee;
    }

    function setToken(address _tokenid) onlyOwner {
        tokenid = _tokenid;
        token = HumanStandardToken(_tokenid);
    }

    function setFeeToken(address _feeTokenId) onlyOwner {
        feeTokenId = _feeTokenId;
        fee = Fee(_feeTokenId);
    }

    function setBlocks(uint _start, uint _expiry) onlyOwner {
        startBlock = _start;
        expiryBlock = _expiry;
    }


    /**
      * staking function for user.
      * User has to approve staking contract on token before calling this function.
      * refer to tests.
      */
    function stakeTokens(uint256 _quantity) started notExpired returns (bool result){
        require(token.balanceOf(msg.sender) >= _quantity);
        levBlocks[msg.sender] += _quantity * (expiryBlock - block.number);
        stakes[msg.sender] += _quantity;
        totalLevBlocks += _quantity * (expiryBlock - block.number);
        totalLevs += _quantity;
        return token.transferFrom(msg.sender, this, _quantity);
    }

    function() payable {
        weiAsFee += msg.value;
    }

    function updateFeeForCurrentPeriod()  returns (bool result){
        feeForThePeriod = fee.balanceOf(this) + weiAsFee / weiPerFee;
        return true;
    }

}