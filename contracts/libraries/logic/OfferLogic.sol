// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../types/DataTypes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Helpers} from "../helpers/Helpers.sol";
import {Errors} from "../../interfaces/Errors.sol";

library OfferLogic {
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

    function createOffer(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        mapping(address => mapping(address => mapping(uint256 => DataTypes.Offer)))
            storage s_offers,
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount,
        uint256 deadline
    ) external {
        if (token == address(0)) revert Errors.Unit__ZeroAddress();

        DataTypes.Listing memory listing = s_listings[nft][tokenId];
        DataTypes.Offer memory currentOffer = s_offers[msg.sender][nft][
            tokenId
        ];

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        if (currentOffer.amount > 0 && currentOffer.deadline > block.timestamp)
            revert Errors.Unit__PendingOffer(
                msg.sender,
                nft,
                tokenId,
                currentOffer.token,
                currentOffer.amount
            );
        if (amount <= 0) revert Errors.Unit__InsufficientAmount();

        // Unit must be approved to spend token
        if (IERC20(token).allowance(msg.sender, address(this)) < amount)
            revert Errors.Unit__NotApprovedToSpendToken(token);

        uint256 _deadline = deadline > 0 ? block.timestamp + deadline : 0;

        if (_deadline == 0 || _deadline > listing.deadline) {
            _deadline = listing.deadline;
        }

        s_offers[msg.sender][nft][tokenId] = DataTypes.Offer(
            token,
            amount,
            _deadline
        );

        if (listing.deadline > 0) {
            s_listings[nft][tokenId].deadline += 1 hours;
        }

        emit OfferCreated(msg.sender, nft, tokenId, token, amount, _deadline);
    }

    function acceptOffer(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        mapping(address => mapping(address => mapping(uint256 => DataTypes.Offer)))
            storage s_offers,
        mapping(address => mapping(address => uint256)) storage s_earnings,
        mapping(address => uint256) storage s_fees,
        address offerOwner,
        address nft,
        uint256 tokenId
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];
        DataTypes.Offer memory offer = s_offers[offerOwner][nft][tokenId];

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        if (offer.amount <= 0)
            revert Errors.Unit__OfferDoesNotExist(nft, tokenId, offerOwner);
        if (offer.deadline <= block.timestamp)
            revert Errors.Unit__OfferExpired(
                nft,
                tokenId,
                offer.token,
                offer.amount
            );

        delete s_listings[nft][tokenId];

        IERC721(nft).safeTransferFrom(listing.seller, offerOwner, tokenId);

        if (
            IERC20(offer.token).transferFrom(
                offerOwner,
                address(this),
                offer.amount
            ) == false
        ) {
            revert Errors.Unit__TokenTransferFailed(
                address(this),
                offer.token,
                offer.amount
            );
        }

        (uint256 earnings, uint256 fee) = Helpers.extractFee(offer.amount);
        s_earnings[listing.seller][offer.token] += earnings;
        s_fees[offer.token] += fee;

        emit OfferAccepted(offerOwner, nft, tokenId, offer.token, offer.amount);
    }

    function extendOfferDeadline(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        mapping(address => mapping(address => mapping(uint256 => DataTypes.Offer)))
            storage s_offers,
        address nft,
        uint256 tokenId,
        uint256 extraTime
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];
        uint256 oldDeadline = s_offers[msg.sender][nft][tokenId].deadline;
        uint256 newDeadline = oldDeadline + extraTime;

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        if (oldDeadline <= 0)
            revert Errors.Unit__OfferDoesNotExist(nft, tokenId, msg.sender);

        if (newDeadline <= block.timestamp)
            revert Errors.Unit__InvalidDeadline();
        if (listing.deadline > 0 && newDeadline > listing.deadline)
            revert Errors.Unit__ItemDeadlineExceeded();

        s_offers[msg.sender][nft][tokenId].deadline = newDeadline;

        emit OfferDeadlineExtended(
            msg.sender,
            nft,
            tokenId,
            oldDeadline,
            newDeadline
        );
    }

    function removeOffer(
        mapping(address => mapping(uint256 => DataTypes.Listing))
            storage s_listings,
        mapping(address => mapping(address => mapping(uint256 => DataTypes.Offer)))
            storage s_offers,
        address nft,
        uint256 tokenId
    ) external {
        DataTypes.Listing memory listing = s_listings[nft][tokenId];
        DataTypes.Offer memory offer = s_offers[msg.sender][nft][tokenId];

        if (listing.price <= 0) revert Errors.Unit__ItemNotListed(nft, tokenId);
        if (offer.amount <= 0)
            revert Errors.Unit__OfferDoesNotExist(nft, tokenId, msg.sender);

        delete s_offers[msg.sender][nft][tokenId];

        emit OfferRemoved(nft, tokenId, msg.sender);
    }
}
