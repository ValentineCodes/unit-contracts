// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Unit__ItemListed(address nft, uint256 tokenId);
error Unit__ItemNotListed(address nft, uint256 tokenId);
error Unit__NotOwner();
error Unit__ZeroAddress();
error Unit__NotApprovedToSpendNFT();
error Unit__InsufficientAmount();
error Unit__PendingOffer(address offer_owner, address nft, uint256 tokenId, address token, uint256 amount);
error Unit__OfferDoesNotExist(address nft, uint256 tokenId, address offer_owner);
error Unit__DeadlineLessThanMinimum(uint256 deadline, uint256 minimumDeadline);
error Unit__DeadlineNotReached(uint256 currentTime, uint256 deadline);
error Unit__ZeroEarnings();
error Unit__NftTransferFailed(address to, address nft, uint256 tokenId);
error Unit__TokenTransferFailed(address to, address token, uint256 amount);
error Unit__EthTransferFailed(address to, uint256 amount);
error Unit__NotListingOwner(address nft, uint256 tokenId);
error Unit__InsufficientFees(uint256 feeBalance, uint256 requestedAmount);
error Unit__ItemPriceInEth(address nft, uint256 tokenId);
error Unit__ItemPriceInToken(address nft, uint256 tokenId, address token);
error Unit__ItemInAuction(address nft, uint256 tokenId);
error Unit__InvalidItemToken(address param_token, address requestedToken);
error Unit__OfferExpired(address nft, uint256 tokenId, address token, uint256 amount);
error Unit__ItemDeadlineExceeded();

contract Unit is Ownable {

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
        mapping(address => Offer) offers;
    }

    event ItemListed (
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 price,
        bool auction,
        uint256 deadline
    );

    event ItemUnlisted (
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId
    );

    event ItemDeadlineExtended (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    event ItemPriceUpdated (
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 oldPrice,
        uint256 indexed newPrice
    );

    event ItemSellerUpdated (
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        address oldSeller,
        address indexed newSeller
    );

    event ItemBought (
        address indexed buyer,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 price
    );

    event ItemAuctionEnabled (
        address nft,
        uint256 tokenId
    );

    event ItemAuctionDisabled (
        address nft,
        uint256 tokenId
    );

    event OfferCreated (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 amount,
        uint256 deadline
    );

    event OfferAmountUpdated (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 oldAmount,
        uint256 newAmount
    );

    event OfferDeadlineExtended (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    event OfferAccepted (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 amount
    );

    event OfferRemoved (
        address nft,
        uint256 tokenId,
        address offer_owner
    )

    event EarningsWithdrawn (
        address indexed owner,
        address indexed token,
        uint256 indexed amount
    );

    event FeesWithdrawn (
        address indexed feeOwner,
        address indexed token,
        uint256 indexed amount
    );

    enum PaymentAction {
        ADD,
        UPDATE,
        DELETE
    };

    uint256 public constant MIN_BID_DEADLINE = 1 hours;
    address private constant ETH = address(0);

    mapping(address => mapping(uint256 => Listing)) private s_listings; // nft => token id => Listing
    mapping(address => mapping(address => uint256)) private s_earnings; // owner > token > amount
    mapping (address => uint256) private s_fees; // token => amount

    modifier isNotListed(address nft, uint256 tokenId) {
        Listing memory listing = s_listings[nft][tokenId];
        if(listing.price > 0) revert Unit__ItemListed(nft, tokenId);
        _;
    }

    modifier isOwner(address nft, uint256 tokenId, address spender) {
        IERC721 _nft = IERC721(nft);
        if(_nft.ownerOf(tokenId) != spender) revert Unit__NotOwner();
        _;
    }

    function getListing(address nft, uint256 tokenId) external view returns(Listing memory) {
        return s_listings[nft][tokenId];
    }

    // Zero address => ETH
    function getEarnings(address seller, address token) external view returns(uint256) {
        return s_earnings[seller][token];
    }

    // Zero address => ETH
    function getFees(address token) external view returns(uint256) {
        return s_fees[token];
    }

    function getOffer(address offer_owner, address nft, uint256 tokenId) external view returns(Offer memory bid) {
        bid = s_listings[nft][tokenId].offers[offer_owner];
        if(bid.amount <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, offer_owner);
    }

    // TO-DO: Approve Unit to spend NFT
    // Zero deadline => No deadline
    function listItem(address nft, uint256 tokenId, uint256 price, uint256 deadline) external isNotListed(nft, tokenId) {
        if(nft == address(0)) revert Unit__ZeroAddress();
        if(price == 0) revert Unit__InsufficientAmount();
        
        IERC721 _nft = IERC721(nft);

        if(_nft.ownerOf(tokenId) != msg.sender) revert Unit__NotOwner();
        if(_nft.getApproved(tokenId) != address(this)) revert Unit__NotApprovedToSpendNFT();

        Listing memory listing;

        listing.seller = msg.sender;
        listing.nft = nft;
        listing.tokenId = tokenId;
        listing.price = price;
        listing.deadline = deadline

        s_listings[nft][tokenId] = listing;

        emit ItemListed(msg.sender, nft, tokenId, ETH, price, auction, deadline);     
    }

    // TO-DO: Approve Unit to spend NFT
    function listItem(address nft, uint256 tokenId, address token, uint256 price, bool auction, uint256 deadline) external isNotListed(nft, tokenId) {
        if(nft == address(0) || token == address(0)) revert Unit__ZeroAddress();
        if(price == 0) revert Unit__InsufficientAmount();
        
        IERC721 _nft = IERC721(nft);

        if(_nft.ownerOf(tokenId) != msg.sender) revert Unit__NotOwner();
        if(_nft.getApproved(tokenId) != address(this)) revert Unit__NotApprovedToSpendNFT();

        Listing memory listing;

        listing.seller = msg.sender;
        listing.nft = nft;
        listing.tokenId = tokenId;
        listing.token = token;
        listing.price = price;
        listing.auction = auction;
        listing.deadline = deadline;

        s_listings[nft][tokenId] = listing;

        emit ItemListed(msg.sender, nft, tokenId, token, price, auction, deadline);     
    }

    function updateItemSeller(address nft, uint256 tokenId, address newSeller) external isOwner(nft, tokenId, newSeller) {
        Listing memory listing = s_listings[nft][tokenId];
        address oldSeller = listing.seller;

        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(newSeller == address(0)) revert Unit__ZeroAddress();

        s_listings[nft][tokenId].seller = newSeller;

        emit ItemSellerUpdated(nft, tokenId, oldSeller, newSeller);
    }

    function updateItemPrice(address nft, uint256 tokenId, uint256 newPrice) external isOwner(nft, tokenId, msg.sender) {
        Listing memory listing = s_listings[nft][tokenId];

        if(listing.auction) revert Unit__ItemInAuction(nft, tokenId)

        address oldPrice = listing.price;

        if(oldPrice <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(newPrice <= 0) revert Unit__InsufficientAmount();

        s_listings[nft][tokenId].price = newPrice;

        emit ItemPriceUpdated(nft, tokenId, listing.token, oldPrice, newPrice);
    }

    function extendItemDeadline(address nft, uint256 tokenId, uint256 offset) external isOwner(nft, tokenId, msg.sender) {
        Listing memory listing = s_listings[nft][tokenId];

        uint256 oldDeadline = listing.deadline;
        uint256 newDeadline = oldDeadline + offset;

        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);

        s_listings[nft][tokenId].deadline = newDeadline;

        emit ItemDeadlineExtended(msg.sender, nft, tokenId, oldDeadline, newDeadline);
    }

    function enableAuction(address nft, uint256 tokenId) external isOwner(nft, tokenId, msg.sender) {
        Listing memory listing = s_listings[nft][tokenId];

        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);

        s_listings[nft][tokenId].auction = true;

        emit ItemAuctionEnabled(nft, tokenId);
    }

    function disableAuction(address nft, uint256 tokenId) external isOwner(nft, tokenId, msg.sender) {
        Listing memory listing = s_listings[nft][tokenId];

        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);

        s_listings[nft][tokenId].auction = false;

        emit ItemAuctionDisabled(nft, tokenId);
    }

    function buyItem(address nft, uint256 tokenId) external payable {
        Listing memory listing = s_listings[nft][tokenId];
    
        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(listing.auction) revert Unit__ItemInAuction(nft, tokenId);
        if(listing.token != address(0)) revert Unit__ItemPriceInToken(nft, tokenId, listing.token); // Use buyItem(address, uint256, address, uint256)
        if(listing.price < msg.value) revert Unit__InsufficientAmount();

        delete s_listings[nft][tokenId];

        if(IERC721(nft).safeTransferFrom(listing.seller, msg.sender, tokenId) == false) revert Unit__NftTransferFailed(msg.sender, nft, tokenId);
    
        (uint256 earnings, uint256 fee) = _extractFee(msg.value);
        s_earnings[listing.seller][ETH] += earnings;
        s_fees[ETH] += fee;

        emit ItemBought(msg.sender, nft, tokenId, ETH, msg.value);
    }

    // TO-DO: Approve Unit to spend tokens
    function buyItem(address nft, uint256 tokenId, address token, uint256 amount) external {
        Listing memory listing = s_listings[nft][tokenId];
    
        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(listing.token == address(0)) revert Unit__ItemPriceInEth(nft, tokenId); // Use payable buyItem(address, uint256)
        if(listing.token != token) revert Unit__InvalidItemToken(token, listing.token);
        if(listing.price < amount) revert Unit__InsufficientAmount();

        delete s_listings[nft][tokenId];

        if(IERC721(nft).safeTransferFrom(listing.seller, msg.sender, tokenId) == false) revert Unit__NftTransferFailed(msg.sender, nft, tokenId);
        if(IERC20(token).transferFrom(msg.sender, address(this), amount) == false) revert Unit__TokenTransferFailed(address(this), token, amount);
    
        (uint256 earnings, uint256 fee) = _extractFee(amount);
        s_earnings[listing.seller][token] += earnings;
        s_fees[token] += fee;

        emit ItemBought(msg.sender, nft, tokenId, token, amount);
    }

    function unlistItem(address nft, uint256 tokenId) externat isOwner(nft, tokenId, msg.sender) {
        delete s_listings[nft][tokenId];
        emit ItemUnlisted(msg.sender, nft, tokenId);
    }

    /**
     * -- Note -- 
     *      Use MIN_BID_DEADLINE if deadline is not specified
     *      Approve Unit to spend tokens
     *      Overwrite any existing offer if deadline has passed
     *      Increase item deadline by an hour
     */
    function createOffer(address nft, uint256 tokenId, address token, uint256 amount, uint256 deadline) external {
        if(nft == address(0) || token == address(0)) revert Unit__ZeroAddress();

        Listing memory listing = s_listings[nft][tokenId];
        Offer memory currentOffer = listing.offers[msg.sender]
    
        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(currentOffer.amount > 0 && currentOffer.deadline > block.timestamp) revert Unit__PendingOffer(msg.sender, nft, tokenId, token, amount);
        if(amount <= 0) revert Unit__InsufficientAmount();
        if(deadline > listing.deadline) revert Unit__ItemDeadlineExceeded();

        uint256 _deadline = deadline;

        if(deadline == 0) {
            _deadline = MIN_BID_DEADLINE;
        } else if(deadline < block.timestamp + MIN_BID_DEADLINE) { 
            revert Unit__DeadlineLessThanMinimum(deadline, MIN_BID_DEADLINE);
        }

        s_listings[nft][tokenId].offers[msg.sender] = Offer(token, amount, deadline);
        s_listings[nft][tokenId].deadline += 1 hours;

        emit OfferCreated(msg.sender, nft, tokenId, token, amount, deadline);
    }

    function acceptOffer(address offer_owner, address nft, uint256 tokenId) external {
        Listing memory listing = s_listings[nft][tokenId];
        Offer memory offer = listing.offers[offer_owner];
        
        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(offer.amount <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, offer_owner);
        if(offer.deadline <= block.timestamp) revert Unit__OfferExpired(nft, tokenId, token, amount);

        delete s_listings[nft][tokenId];
        
        if(IERC721(nft).safeTransferFrom(listing.seller, offer_owner, tokenId) == false) revert Unit__NftTransferFailed(offer_owner, nft, tokenId);
        if(IERC20(offer.token).transferFrom(offer_owner, address(this), offer.amount) == false) revert Unit__TokenTransferFailed(address(this), offer.token, offer.amount);
    
        (uint256 earnings, uint256 fee) = _extractFee(offer.amount);
        s_earnings[listing.seller][offer.token] += earnings;
        s_fees[offer.token] += fee;

        emit OfferAccepted(offer_owner, nft, tokenId, offer.token, offer.amount);
    }

    function extendOfferDeadline(address nft, uint256 tokenId, uint256 offset) external {
        if(nft == address(0)) revert Unit__ZeroAddress();

        Listing memory listing = s_listings[nft][tokenId];
        uint256 oldDeadline = listing.offers[msg.sender].deadline;
        uint256 newDeadline = oldDeadline + offset;

        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(oldDeadline <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, msg.sender);
        if(newDeadline > listing.deadline) revert Unit__ItemDeadlineExceeded();

        s_listings[nft][tokenId].offers[msg.sender].deadline = newDeadline;

        emit OfferDeadlineExtended(msg.sender, nft, tokenId, oldDeadline, newDeadline);
    }

    function removeOffer(address nft, uint256 tokenId) external {
        Listing memory listing = s_listings[nft][tokenId];
        Offer memory offer = listing.offers[msg.sender];
        
        if(listing.price <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(offer.amount <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, msg.sender);

        delete s_listings[nft][tokenId].offers[msg.sender];

        emit OfferRemoved(nft, tokenId, msg.sender);
    }

    // Zero {token} address => Eth
    function withdrawEarnings(address token) external {
        uint256 earnings = s_earnings[msg.sender][token];

        if(earnings <= 0) revert Unit__ZeroEarnings();

        delete s_earnings[msg.sender][token];

        if(token == address(0)) {
            // Handle Eth transfer
            (bool success, ) = payable(msg.sender).call{value: earnings}("");

            if(!success) revert Unit__EthTransferFailed(msg.sender, earnings);

        } else {
            // Handle token transfer
            if(IERC20(token).transfer(msg.sender, earnings) == false) revert Unit__TokenTransferFailed(msg.sender, token, earnings);
        }

        emit EarningsWithdrawn(msg.sender, token, earnings);
    }

    // Zero {token} address => ETH
    function withdrawFees(address token, uint256 amount) external onlyOwner {
        if(s_fees[token] < amount) revert Unit__InsufficientFees(s_fees[token], amount);

        unchecked {
            s_fees[token] -= amount;
        }

        if(token == address(0)) {
            // Handle Eth transfer
            (bool success, ) = payable(msg.sender).call{value: amount}("");

            if(!success) revert Unit__EthTransferFailed(msg.sender, amount);

        } else {
            // Handle token transfer
            if(IERC20(token).transfer(msg.sender, amount) == false) revert Unit__TokenTransferFailed(msg.sender, token, amount);
        }

        emit FeesWithdrawn(msg.sender, token, amount);
    }

    /** 
     * @title Helper Functions
     */

    function _extractFee(uint256 amount) private pure returns(uint256 earnings, uint256 fee) {
        fee = amount / 100; // 1% fee... Too generous?🧐
        earnings = amount - fee;
    }
}