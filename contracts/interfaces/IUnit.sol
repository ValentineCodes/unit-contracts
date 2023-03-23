// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../libraries/types/DataTypes.sol";

interface IUnit {
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

    function withdrawFees(address token, uint256 amount) external;
}
