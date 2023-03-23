// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

library DataTypes {
    struct Offer {
        address token;
        uint256 amount;
        uint256 deadline;
    }

    struct Listing {
        address seller;
        address nft;
        uint256 tokenId;
        address token; // Zero address => ETH
        uint256 price;
        bool auction;
        uint256 deadline;
    }
}
