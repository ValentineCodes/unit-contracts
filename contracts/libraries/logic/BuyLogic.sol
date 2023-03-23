// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../types/DataTypes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Helpers} from "../helpers/Helpers.sol";

error Unit__ItemNotListed(address nft, uint256 tokenId);
error Unit__ItemInAuction(address nft, uint256 tokenId);
error Unit__ItemPriceInEth(address nft, uint256 tokenId);
error Unit__ItemPriceInToken(address nft, uint256 tokenId, address token);
error Unit__InsufficientAmount();
error Unit__InvalidItemToken(address requestedToken, address actualToken);
error Unit__TokenTransferFailed(address to, address token, uint256 amount);
error Unit__ItemDeadlineReached();

library BuyLogic {
    event ItemBought(
        address indexed buyer,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 price
    );

    address private constant ETH = address(0);

    function buyItem(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        mapping(address => mapping(address => uint256)) storage s_earnings,
        mapping(address => uint256) storage s_fees,
        address nft,
        uint256 tokenId,
        uint256 amount
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        if (listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if (listing.auction) revert Unit__ItemInAuction(nft, tokenId);
        if (listing.token != ETH)
            revert Unit__ItemPriceInToken(nft, tokenId, listing.token); // Use buyItem(address, uint256, address, uint256)
        if (listing.price < amount) revert Unit__InsufficientAmount();

        // Item has deadline and it has been reached
        if (listing.deadline > 0 && block.timestamp >= listing.deadline)
            revert Unit__ItemDeadlineReached();

        delete s_listings[nft][tokenId];

        IERC721(nft).safeTransferFrom(listing.seller, msg.sender, tokenId);

        (uint256 earnings, uint256 fee) = Helpers.extractFee(amount);
        s_earnings[listing.seller][ETH] += earnings;
        s_fees[ETH] += fee;

        emit ItemBought(msg.sender, nft, tokenId, ETH, amount);
    }

    function buyItemWithToken(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        mapping(address => mapping(address => uint256)) storage s_earnings,
        mapping(address => uint256) storage s_fees,
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        if (listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if (listing.price < amount) revert Unit__InsufficientAmount();
        if (listing.token == ETH) revert Unit__ItemPriceInEth(nft, tokenId); // Use payable buyItem(address, uint256)
        if (listing.token != token)
            revert Unit__InvalidItemToken(token, listing.token);

        // Item has deadline and it has been reached
        if (listing.deadline > 0 && block.timestamp >= listing.deadline)
            revert Unit__ItemDeadlineReached();

        delete s_listings[nft][tokenId];

        IERC721(nft).safeTransferFrom(listing.seller, msg.sender, tokenId);

        if (
            IERC20(token).transferFrom(msg.sender, address(this), amount) ==
            false
        ) revert Unit__TokenTransferFailed(address(this), token, amount);

        (uint256 earnings, uint256 fee) = Helpers.extractFee(amount);
        s_earnings[listing.seller][token] += earnings;
        s_fees[token] += fee;

        emit ItemBought(msg.sender, nft, tokenId, token, amount);
    }
}
