// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

library Helpers {
    function extractFee(
        uint256 amount
    ) internal pure returns (uint256 earnings, uint256 fee) {
        fee = amount / 100; // 1% fee... Too generous?🧐
        earnings = amount - fee;
    }
}
