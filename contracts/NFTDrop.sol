// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SignedNFTDistributorSimple is Ownable {
    IERC721Enumerable public immutable nft;
    address public signer; 
    mapping(bytes32 => bool) public usedHash;

    event Distributed(address indexed to, uint256 indexed tokenId, bytes32 indexed hash);

    constructor(address _nft, address _signer) Ownable(msg.sender) {
        require(_nft != address(0), "invalid nft");
        require(_signer != address(0), "invalid signer");
        nft = IERC721Enumerable(_nft);
        signer = _signer;
    }

    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "invalid signer");
        signer = _signer;
    }

    function mint(
        address to,
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(to != address(0), "invalid to");
        require(!usedHash[hash], "hash already used");

        uint256 balance = nft.balanceOf(address(this));
        require(balance > 0, "no nft left");

        uint256 tokenId = nft.tokenOfOwnerByIndex(address(this), 0);

        bytes32 message = keccak256(abi.encodePacked(to, hash));
        address recovered = ecrecover(message, v, r, s);
        require(recovered == signer, "invalid signature");

        usedHash[hash] = true;
        nft.safeTransferFrom(address(this), to, tokenId);

        emit Distributed(to, tokenId, hash);
    }
}