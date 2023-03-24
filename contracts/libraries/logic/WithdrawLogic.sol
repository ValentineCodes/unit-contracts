// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../types/DataTypes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Errors} from "../types/Errors.sol";

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

    address private constant ETH = address(0);

    function withdrawEarnings(
        mapping(address => mapping(address => uint256)) storage s_earnings,
        address token
    ) external {
        uint256 earnings = s_earnings[msg.sender][token];

        if (earnings <= 0) revert Errors.Unit__ZeroEarnings();

        delete s_earnings[msg.sender][token];

        if (token == ETH) {
            // Handle Eth transfer
            (bool success, ) = payable(msg.sender).call{value: earnings}("");

            if (!success)
                revert Errors.Unit__EthTransferFailed(msg.sender, earnings);
        } else {
            // Handle token transfer
            if (IERC20(token).transfer(msg.sender, earnings) == false)
                revert Errors.Unit__TokenTransferFailed(
                    msg.sender,
                    token,
                    earnings
                );
        }

        emit EarningsWithdrawn(msg.sender, token, earnings);
    }

    function withdrawFees(
        mapping(address => uint256) storage s_fees,
        address token
    ) external {
        uint256 amount = s_fees[token];

        if (amount <= 0) revert Errors.Unit__ZeroEarnings();

        delete s_fees[token];

        if (token == ETH) {
            // Handle Eth transfer
            (bool success, ) = payable(msg.sender).call{value: amount}("");

            if (!success)
                revert Errors.Unit__EthTransferFailed(msg.sender, amount);
        } else {
            // Handle token transfer
            if (IERC20(token).transfer(msg.sender, amount) == false)
                revert Errors.Unit__TokenTransferFailed(
                    msg.sender,
                    token,
                    amount
                );
        }

        emit FeesWithdrawn(msg.sender, token, amount);
    }
}
