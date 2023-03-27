// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

interface Errors {
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
    error Unit__CannotCreateOfferOnOwnItem();
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
}
