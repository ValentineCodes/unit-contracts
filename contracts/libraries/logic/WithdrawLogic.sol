// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../types/DataTypes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error Unit__ZeroEarnings();
error Unit__TokenTransferFailed(address to, address token, uint256 amount);
error Unit__EthTransferFailed(address to, uint256 amount);
error Unit__InsufficientFees(uint256 feeBalance, uint256 requestedAmount);

library WithdrawLogic {
    event EarningsWithdrawn(
        address indexed owner,
        address indexed token,
        uint256 indexed amount
    );

    event FeesWithdrawn(
        address indexed feeOwner,
        address indexed token,
        uint256 indexed amount
    );

    function withdrawEarnings(
        mapping(address => mapping(address => uint256)) storage s_earnings,
        address token
    ) external {
        uint256 earnings = s_earnings[msg.sender][token];

        if (earnings <= 0) revert Unit__ZeroEarnings();

        delete s_earnings[msg.sender][token];

        if (token == address(0)) {
            // Handle Eth transfer
            (bool success, ) = payable(msg.sender).call{value: earnings}("");

            if (!success) revert Unit__EthTransferFailed(msg.sender, earnings);
        } else {
            // Handle token transfer
            if (IERC20(token).transfer(msg.sender, earnings) == false)
                revert Unit__TokenTransferFailed(msg.sender, token, earnings);
        }

        emit EarningsWithdrawn(msg.sender, token, earnings);
    }

    function withdrawFees(
        mapping(address => uint256) storage s_fees,
        address token,
        uint256 amount
    ) external {
        if (s_fees[token] < amount)
            revert Unit__InsufficientFees(s_fees[token], amount);

        unchecked {
            s_fees[token] -= amount;
        }

        if (token == address(0)) {
            // Handle Eth transfer
            (bool success, ) = payable(msg.sender).call{value: amount}("");

            if (!success) revert Unit__EthTransferFailed(msg.sender, amount);
        } else {
            // Handle token transfer
            if (IERC20(token).transfer(msg.sender, amount) == false)
                revert Unit__TokenTransferFailed(msg.sender, token, amount);
        }

        emit FeesWithdrawn(msg.sender, token, amount);
    }
}
