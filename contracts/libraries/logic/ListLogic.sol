// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../types/DataTypes.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error Unit__ItemListed(address nft, uint256 tokenId);
error Unit__ItemNotListed(address nft, uint256 tokenId);
error Unit__NotOwner();
error Unit__ZeroAddress();
error Unit__NotApprovedToSpendNFT();
error Unit__InsufficientAmount();
error Unit__ItemInAuction(address nft, uint256 tokenId);
error Unit__InvalidDeadline();

library ListLogic {
    event ItemListed(
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 price,
        bool auction,
        uint256 deadline
    );

    event ItemUnlisted(
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId
    );

    event ItemDeadlineExtended(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    event ItemPriceUpdated(
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 oldPrice,
        uint256 indexed newPrice
    );

    event ItemSellerUpdated(
        address indexed nft,
        uint256 indexed tokenId,
        address oldSeller,
        address indexed newSeller
    );

    event ItemAuctionEnabled(address nft, uint256 tokenId);

    event ItemAuctionDisabled(address nft, uint256 tokenId);

    function listItem(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        address token,
        uint256 price,
        bool auction,
        uint256 deadline
    ) external {
        if (price == 0) revert Unit__InsufficientAmount();

        IERC721 _nft = IERC721(nft);

        if (_nft.ownerOf(tokenId) != msg.sender) revert Unit__NotOwner();
        if (_nft.getApproved(tokenId) != address(this))
            revert Unit__NotApprovedToSpendNFT();
        if (deadline > 0 && deadline <= block.timestamp)
            revert Unit__InvalidDeadline();

        s_listings[nft][tokenId] = DataTypes.Listing({
            seller: msg.sender,
            nft: nft,
            tokenId: tokenId,
            token: token,
            price: price,
            auction: auction,
            deadline: deadline
        });

        emit ItemListed(
            msg.sender,
            nft,
            tokenId,
            token,
            price,
            auction,
            deadline
        );
    }

    function unlistItem(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId
    ) external {
        delete s_listings[nft][tokenId];
        emit ItemUnlisted(msg.sender, nft, tokenId);
    }

    function updateItemSeller(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        address newSeller
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];
        address oldSeller = listing.seller;

        if (listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);

        s_listings[nft][tokenId].seller = newSeller;

        emit ItemSellerUpdated(nft, tokenId, oldSeller, newSeller);
    }

    function updateItemPrice(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        uint256 oldPrice = listing.price;

        if (oldPrice <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if (newPrice <= 0) revert Unit__InsufficientAmount();

        s_listings[nft][tokenId].price = newPrice;

        emit ItemPriceUpdated(nft, tokenId, listing.token, oldPrice, newPrice);
    }

    function extendItemDeadline(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        uint256 offset
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        uint256 oldDeadline = listing.deadline;
        uint256 newDeadline = oldDeadline + offset;

        if (listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if (newDeadline <= block.timestamp) revert Unit__InvalidDeadline();

        s_listings[nft][tokenId].deadline = newDeadline;

        emit ItemDeadlineExtended(
            msg.sender,
            nft,
            tokenId,
            oldDeadline,
            newDeadline
        );
    }

    function enableAuction(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        if (listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);

        if (newPrice == 0) {
            s_listings[nft][tokenId].auction = true;
        } else {
            listing.auction = true;
            listing.price = newPrice;
            s_listings[nft][tokenId] = listing;
        }

        emit ItemAuctionEnabled(nft, tokenId);
    }

    function disableAuction(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        if (listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);

        if (newPrice == 0) {
            s_listings[nft][tokenId].auction = false;
        } else {
            listing.auction = false;
            listing.price = newPrice;
            s_listings[nft][tokenId] = listing;
        }

        emit ItemAuctionDisabled(nft, tokenId);
    }
}
