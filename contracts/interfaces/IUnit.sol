// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../libraries/types/DataTypes.sol";

interface IUnit {
    error Unit__ItemListed(address nft, uint256 tokenId);
    error Unit__ItemNotListed(address nft, uint256 tokenId);
    error Unit__NotOwner();
    error Unit__ZeroAddress();
    error Unit__NotApprovedToSpendNFT();
    error Unit__InsufficientAmount();
    error Unit__InvalidAmount();
    error Unit__ItemInAuction(address nft, uint256 tokenId);
    error Unit__InvalidDeadline();
    error Unit__ItemPriceInEth(address nft, uint256 tokenId);
    error Unit__ItemPriceInToken(address nft, uint256 tokenId, address token);
    error Unit__InvalidItemToken(address requestedToken, address actualToken);
    error Unit__TokenTransferFailed(address to, address token, uint256 amount);
    error Unit__ListingExpired();
    error Unit__NoUpdateRequired();
    error Unit__CannotBuyOwnNFT();
    error Unit__PendingOffer(
        address offerOwner,
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount
    );
    error Unit__OfferDoesNotExist(
        address nft,
        uint256 tokenId,
        address offerOwner
    );
    error Unit__OfferExpired(
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount
    );
    error Unit__ItemDeadlineExceeded();
    error Unit__DeadlineLessThanMinimum(
        uint256 deadline,
        uint256 minimumDeadline
    );
    error Unit__NotApprovedToSpendToken(address token);
    error Unit__ZeroEarnings();
    error Unit__EthTransferFailed(address to, uint256 amount);
    error Unit__InsufficientFees(uint256 feeBalance, uint256 requestedAmount);

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

    event ItemAuctionEnabled(
        address nft,
        uint256 tokenId,
        uint256 startingPrice
    );

    event ItemAuctionDisabled(address nft, uint256 tokenId, uint256 fixedPrice);

    event ItemBought(
        address indexed buyer,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 price
    );

    event OfferCreated(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 amount,
        uint256 deadline
    );

    event OfferAmountUpdated(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 oldAmount,
        uint256 newAmount
    );

    event OfferDeadlineExtended(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    event OfferAccepted(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 amount
    );

    event OfferRemoved(address nft, uint256 tokenId, address offerOwner);

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

    function getListing(
        address nft,
        uint256 tokenId
    ) external view returns (DataTypes.Listing memory);

    function getEarnings(
        address seller,
        address token
    ) external view returns (uint256);

    function getFees(address token) external view returns (uint256);

    function getOffer(
        address offerOwner,
        address nft,
        uint256 tokenId
    ) external view returns (DataTypes.Offer memory offer);

    function listItem(
        address nft,
        uint256 tokenId,
        uint256 price,
        uint256 deadline
    ) external;

    function listItemWithToken(
        address nft,
        uint256 tokenId,
        address token,
        uint256 price,
        bool auction,
        uint256 deadline
    ) external;

    function unlistItem(address nft, uint256 tokenId) external;

    function updateItemSeller(
        address nft,
        uint256 tokenId,
        address newSeller
    ) external;

    function updateItemPrice(
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external;

    function extendItemDeadline(
        address nft,
        uint256 tokenId,
        uint256 offset
    ) external;

    function enableAuction(
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external;

    function disableAuction(
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external;

    function buyItem(address nft, uint256 tokenId) external payable;

    function buyItemWithToken(
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount
    ) external;

    function createOffer(
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount,
        uint256 deadline
    ) external;

    function acceptOffer(
        address offerOwner,
        address nft,
        uint256 tokenId
    ) external;

    function extendOfferDeadline(
        address nft,
        uint256 tokenId,
        uint256 offset
    ) external;

    function removeOffer(address nft, uint256 tokenId) external;

    function withdrawEarnings(address token) external;

    function withdrawFees(address token) external;
}
