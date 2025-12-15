// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable {
    uint256 private _value;

    event ValueChanged(uint256 value);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function store(uint256 value) external onlyOwner {
        _value = value;
        emit ValueChanged(value);
    }

    function retrieve() external view returns (uint256) {
        return _value;
    }
}
