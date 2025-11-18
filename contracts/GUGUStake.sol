// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTStaking is ERC721Holder, Ownable, ReentrancyGuard {
    IERC721 public immutable nftToken;
    IERC20 public immutable rewardToken;

    // 每个NFT每天的奖励数量（默认2e18 = 2枚，18位小数），owner可修改
    uint256 public dailyReward = 2 * 10**18;
    mapping(uint256 => address) public stakeOwner;
    mapping(uint256 => uint256) public stakeTimestamp;
    mapping(address => uint256[]) public stakedTokensOf;

    event Staked(address indexed user, uint256[] tokenIds);
    event Unstaked(address indexed user, uint256[] tokenIds, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);
    event DailyRewardUpdated(uint256 newDailyReward);

    constructor(address _nftToken, address _rewardToken,address _initOwner) ERC721Holder() Ownable(_initOwner) ReentrancyGuard() {
        nftToken = IERC721(_nftToken);
        rewardToken = IERC20(_rewardToken);
    }

    /* ==================== Owner ==================== */
    function setDailyReward(uint256 _newDailyReward) external onlyOwner {
        dailyReward = _newDailyReward;
        emit DailyRewardUpdated(_newDailyReward);
    }

    /* ==================== View ==================== */
    function pendingRewardOfToken(uint256 tokenId) public view returns (uint256) {
        if (stakeOwner[tokenId] == address(0)) return 0;
        uint256 timeDiff = block.timestamp - stakeTimestamp[tokenId];
        return (timeDiff * dailyReward) / 1 days;
    }

    function pendingReward(address user) public view returns (uint256 total) {
        uint256[] memory tokenIds = stakedTokensOf[user];
        for (uint256 i = 0; i < tokenIds.length; i++) {
            total += pendingRewardOfToken(tokenIds[i]);
        }
    }

    function stakedTokens(address user) external view returns (uint256[] memory) {
        return stakedTokensOf[user];
    }

    /* ==================== Stake ==================== */
    function stake(uint256[] calldata tokenIds) external nonReentrant {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(stakeOwner[tokenId] == address(0), "Already staked");
            nftToken.safeTransferFrom(msg.sender, address(this), tokenId);

            stakeOwner[tokenId] = msg.sender;
            stakeTimestamp[tokenId] = block.timestamp;
            stakedTokensOf[msg.sender].push(tokenId);
        }
        emit Staked(msg.sender, tokenIds);
    }

    /* ==================== Unstake ==================== */
    function unstake(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalReward = _calculateAndUpdateRewards(msg.sender, tokenIds);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(stakeOwner[tokenId] == msg.sender, "Not owner");

            uint256[] storage tokens = stakedTokensOf[msg.sender];
            for (uint256 j = 0; j < tokens.length; j++) {
                if (tokens[j] == tokenId) {
                    tokens[j] = tokens[tokens.length - 1];
                    tokens.pop();
                    break;
                }
            }

            delete stakeOwner[tokenId];
            delete stakeTimestamp[tokenId];

            nftToken.safeTransferFrom(address(this), msg.sender, tokenId);
        }

        if (totalReward > 0) {
            require(rewardToken.transfer(msg.sender, totalReward), "Transfer failed");
        }
        emit Unstaked(msg.sender, tokenIds, totalReward);
    }

    /* ==================== Claim ==================== */
    function claimRewards() external nonReentrant {
        uint256[] memory tokenIds = stakedTokensOf[msg.sender];
        require(tokenIds.length > 0, "No staked NFTs");

        uint256 totalReward = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 reward = pendingRewardOfToken(tokenId);
            if (reward > 0) {
                totalReward += reward;
                stakeTimestamp[tokenId] = block.timestamp; 
            }
        }

        if (totalReward > 0) {
            require(rewardToken.transfer(msg.sender, totalReward), "Transfer failed");
            emit RewardClaimed(msg.sender, totalReward);
        }
    }

    /* ==================== Internal ==================== */
    function _calculateAndUpdateRewards(address user, uint256[] calldata tokenIds) 
        internal returns (uint256 totalReward) 
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(stakeOwner[tokenId] == user, "Not staked owner");
            uint256 reward = pendingRewardOfToken(tokenId);
            totalReward += reward;
            stakeTimestamp[tokenId] = block.timestamp;
        }
    }
}