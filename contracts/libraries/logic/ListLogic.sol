// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../types/DataTypes.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Errors} from "../../interfaces/Errors.sol";

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
        address indexed owner,
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

    event ItemAuctionEnabled(
        address nft,
        uint256 tokenId,
        uint256 startingPrice
    );

    event ItemAuctionDisabled(address nft, uint256 tokenId, uint256 fixedPrice);

    address private constant ETH = address(0);

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
        if (price == 0) revert Errors.Unit__InsufficientAmount();

        IERC721 _nft = IERC721(nft);

        if (_nft.ownerOf(tokenId) != msg.sender) revert Errors.Unit__NotOwner();
        if (_nft.getApproved(tokenId) != address(this))
            revert Errors.Unit__NotApprovedToSpendNFT();

        uint256 _deadline = deadline > 0 ? block.timestamp + deadline : 0;

        s_listings[nft][tokenId] = DataTypes.Listing({
            seller: msg.sender,
            nft: nft,
            tokenId: tokenId,
            token: token,
            price: price,
            auction: auction,
            deadline: _deadline
        });

        emit ItemListed(
            msg.sender,
            nft,
            tokenId,
            token,
            price,
            auction,
            _deadline
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

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        if (oldSeller == newSeller) revert Errors.Unit__NoUpdateRequired();
        if (IERC721(nft).getApproved(tokenId) != address(this))
            revert Errors.Unit__NotApprovedToSpendNFT();

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

        if (oldPrice <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        if (oldPrice == newPrice) revert Errors.Unit__NoUpdateRequired();
        if (newPrice <= 0) revert Errors.Unit__InsufficientAmount();

        s_listings[nft][tokenId].price = newPrice;

        emit ItemPriceUpdated(nft, tokenId, listing.token, oldPrice, newPrice);
    }

    function extendItemDeadline(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        uint256 extraTime
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        uint256 oldDeadline = listing.deadline > 0
            ? listing.deadline
            : block.timestamp;
        uint256 newDeadline = oldDeadline + extraTime;

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        if (newDeadline <= block.timestamp)
            revert Errors.Unit__InvalidDeadline();

        s_listings[nft][tokenId].deadline = newDeadline;

        emit ItemDeadlineExtended(
            msg.sender,
            nft,
            tokenId,
            listing.deadline,
            newDeadline
        );
    }

    function enableAuction(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        uint256 startingPrice
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        // Only enable auction on items listed with token price
        if (listing.token == ETH)
            revert Errors.Unit__ItemPriceInEth(nft, tokenId);

        if (startingPrice == 0 || startingPrice == listing.price) {
            s_listings[nft][tokenId].auction = true;
        } else {
            listing.auction = true;
            listing.price = startingPrice;
            s_listings[nft][tokenId] = listing;
        }

        emit ItemAuctionEnabled(nft, tokenId, listing.price);
    }

    function disableAuction(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        address nft,
        uint256 tokenId,
        uint256 fixedPrice
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);

        if (fixedPrice == 0 || fixedPrice == listing.price) {
            s_listings[nft][tokenId].auction = false;
        } else {
            listing.auction = false;
            listing.price = fixedPrice;
            s_listings[nft][tokenId] = listing;
        }

        emit ItemAuctionDisabled(nft, tokenId, listing.price);
    }
}
