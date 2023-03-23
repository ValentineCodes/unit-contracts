// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IUnit} from "./interfaces/IUnit.sol";

import {DataTypes} from "./libraries/types/DataTypes.sol";
import {ListLogic} from "./libraries/logic/ListLogic.sol";
import {BuyLogic} from "./libraries/logic/BuyLogic.sol";
import {OfferLogic} from "./libraries/logic/OfferLogic.sol";
import {WithdrawLogic} from "./libraries/logic/WithdrawLogic.sol";

error Unit__ItemListed(address nft, uint256 tokenId);
error Unit__NotOwner();
error Unit__ZeroAddress();
error Unit__OfferDoesNotExist(address nft, uint256 tokenId, address offerOwner);

contract Unit is IUnit, Ownable {
    uint256 public constant MIN_BID_DEADLINE = 1 hours;
    address private constant ETH = address(0);

    mapping(address => mapping(uint256 => DataTypes.Listing))
        private s_listings; // nft => token id => DataTypes.Listing

    mapping(address => mapping(address => mapping(uint256 => DataTypes.Offer)))
        private s_offers; // offerOwner => nft => tokenId => Offer

    mapping(address => mapping(address => uint256)) private s_earnings; // owner > token > amount

    mapping(address => uint256) private s_fees; // token => amount

    modifier isNotListed(address nft, uint256 tokenId) {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];
        if (listing.price > 0) revert Unit__ItemListed(nft, tokenId);
        _;
    }

    modifier isOwner(
        address nft,
        uint256 tokenId,
        address spender
    ) {
        IERC721 _nft = IERC721(nft);
        if (_nft.ownerOf(tokenId) != spender) revert Unit__NotOwner();
        _;
    }

    function getListing(
        address nft,
        uint256 tokenId
    ) external view override returns (DataTypes.Listing memory) {
        return s_listings[nft][tokenId];
    }

    // Zero address => ETH
    function getEarnings(
        address seller,
        address token
    ) external view override returns (uint256) {
        return s_earnings[seller][token];
    }

    // Zero address => ETH
    function getFees(address token) external view override returns (uint256) {
        return s_fees[token];
    }

    function getOffer(
        address offerOwner,
        address nft,
        uint256 tokenId
    ) external view override returns (DataTypes.Offer memory offer) {
        offer = s_offers[offerOwner][nft][tokenId];
        if (offer.amount <= 0)
            revert Unit__OfferDoesNotExist(nft, tokenId, offerOwner);
    }

    // TO-DO: Approve Unit to spend NFT
    // Zero deadline => No deadline
    function listItem(
        address nft,
        uint256 tokenId,
        uint256 price,
        uint256 deadline
    ) external override isNotListed(nft, tokenId) {
        if (nft == address(0)) revert Unit__ZeroAddress();

        ListLogic.listItem(
            s_listings,
            nft,
            tokenId,
            ETH,
            price,
            false,
            deadline
        );
    }

    function listItemWithToken(
        address nft,
        uint256 tokenId,
        address token,
        uint256 price,
        bool auction,
        uint256 deadline
    ) external override isNotListed(nft, tokenId) {
        if (nft == address(0) || token == address(0))
            revert Unit__ZeroAddress();

        ListLogic.listItem(
            s_listings,
            nft,
            tokenId,
            token,
            price,
            auction,
            deadline
        );
    }

    function unlistItem(
        address nft,
        uint256 tokenId
    ) external override isOwner(nft, tokenId, msg.sender) {
        ListLogic.unlistItem(s_listings, nft, tokenId);
    }

    function updateItemSeller(
        address nft,
        uint256 tokenId,
        address newSeller
    ) external override isOwner(nft, tokenId, newSeller) {
        ListLogic.updateItemSeller(s_listings, nft, tokenId, newSeller);
    }

    function updateItemPrice(
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external override isOwner(nft, tokenId, msg.sender) {
        ListLogic.updateItemPrice(s_listings, nft, tokenId, newPrice);
    }

    function extendItemDeadline(
        address nft,
        uint256 tokenId,
        uint256 extraTime
    ) external override isOwner(nft, tokenId, msg.sender) {
        ListLogic.extendItemDeadline(s_listings, nft, tokenId, extraTime);
    }

    function enableAuction(
        address nft,
        uint256 tokenId,
        uint256 newPrice // starting price (Optional)
    ) external override isOwner(nft, tokenId, msg.sender) {
        ListLogic.enableAuction(s_listings, nft, tokenId, newPrice);
    }

    function disableAuction(
        address nft,
        uint256 tokenId,
        uint256 newPrice // fixed price (Optional)
    ) external override isOwner(nft, tokenId, msg.sender) {
        ListLogic.disableAuction(s_listings, nft, tokenId, newPrice);
    }

    function buyItem(address nft, uint256 tokenId) external payable override {
        BuyLogic.buyItem(
            s_listings,
            s_earnings,
            s_fees,
            nft,
            tokenId,
            msg.value
        );
    }

    function buyItem(
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount
    ) external override {
        BuyLogic.buyItemWithToken(
            s_listings,
            s_earnings,
            s_fees,
            nft,
            tokenId,
            token,
            amount
        );
    }

    function createOffer(
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount,
        uint256 deadline
    ) external override {
        OfferLogic.createOffer(
            s_listings,
            s_offers,
            nft,
            tokenId,
            token,
            amount,
            deadline
        );
    }

    function acceptOffer(
        address offerOwner,
        address nft,
        uint256 tokenId
    ) external override isOwner(nft, tokenId, msg.sender) {
        OfferLogic.acceptOffer(
            s_listings,
            s_offers,
            s_earnings,
            s_fees,
            offerOwner,
            nft,
            tokenId
        );
    }

    function extendOfferDeadline(
        address nft,
        uint256 tokenId,
        uint256 extraTime
    ) external override {
        OfferLogic.extendOfferDeadline(
            s_listings,
            s_offers,
            nft,
            tokenId,
            extraTime
        );
    }

    function removeOffer(address nft, uint256 tokenId) external override {
        OfferLogic.removeOffer(s_listings, s_offers, nft, tokenId);
    }

    function withdrawEarnings(address token) external override {
        WithdrawLogic.withdrawEarnings(s_earnings, token);
    }

    function withdrawFees(
        address token,
        uint256 amount
    ) external override onlyOwner {
        WithdrawLogic.withdrawFees(s_fees, token, amount);
    }
}
