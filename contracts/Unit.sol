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
error Unit__OfferAlreadyExists(address nft, uint256 tokenId, address offer_owner);
error Unit__OfferDoesNotExist(address nft, uint256 tokenId, address offer_owner);
error Unit__DeadlineMustBeADayOrMore();
error Unit__DeadlineNotReached(uint256 currentTime, uint256 deadline);
error Unit__ZeroEarnings();
error Unit__NftTransferFailed(address to, address nft, uint256 tokenId);
error Unit__TokenTransferFailed(address to, address token, uint256 amount);
error Unit__EthTransferFailed(address to, uint256 amount);
error Unit__NotListingOwner(address nft, uint256 tokenId);
error Unit__InsufficientFees(uint256 feeBalance, uint256 requestedAmount);

contract Unit is Ownable {

    struct PaymentOption {
        address token;
        uint256 price;
    }

    struct Offer {
        uint256 amount;
        uint256 deadline;
    }

    struct Listing {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 price;
    }

    event ItemListed (
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemUnlisted (
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId
    );

    event ItemPriceUpdated (
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 indexed newPrice
    );

    event ItemSellerUpdated (
        address indexed nft,
        uint256 indexed tokenId,
        address oldSeller,
        address indexed newSeller
    );

    event ItemBought (
        address indexed buyer,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemOffer (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 deadline
    );

    event OfferAmountUpdated (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldAmount,
        uint256 newAmount
    );

    event OfferDeadlineUpdated (
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
        uint256 price
    );

    event OfferWithdrawn (
        address indexed offer_owner,
        address indexed nft,
        uint256 indexed tokenId
    );

    event EarningsWithdrawn (
        address indexed owner,
        uint256 indexed amount
    );

    event FeesWithdrawn (
        address indexed feeOwner,
        uint256 indexed amount
    );

    enum PaymentAction {
        ADD,
        UPDATE,
        DELETE
    };

    uint256 public constant MIN_BID_DEADLINE = 24 hours;

    uint256 private s_fees;

    mapping(address => uint256 => Listing) private s_listings; // nft => token id => Listing
    mapping(address => address => uint256 => Offer) private s_offers; // offer_owner => nft => token id => Offer
    mapping(address => uint256) private s_earnings; // owner > amount

    modifier isListed(address nft, uint256 tokenId) {
        Listing memory listing = s_listings[nft][tokenId];
        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        _;
    }

    modifier isNotListed(address nft, uint256 tokenId) {
        Listing memory listing = s_listings[nft][tokenId];
        if(listing.seller != address(0)) revert Unit__ItemListed(nft, tokenId);
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

    function getEarnings(address seller) external view returns(uint256) {
        return s_earnings[seller];
    }

    function getFees() external view returns(uint256) {
        return s_fees;
    }

    function getOffer(address offer_owner, address nft, uint256 tokenId) external view returns(Offer memory offer) {
        offer = s_offers[offer_owner][nft][tokenId];
        if(offer.amount <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, offer_owner);
    }

    // TO-DO: Approve Unit to spend NFT
    function listItem(address nft, uint256 tokenId, uint256 price) external isNotListed(nft, tokenId) isOwner(nft, tokenId, msg.sender) {
        if(nft == address(0)) revert Unit__ZeroAddress();
        if(price == 0) revert Unit__InsufficientAmount();
        
        IERC721 _nft = IERC721(nft);

        if(_nft.ownerOf(tokenId) != msg.sender) revert Unit__NotOwner();
        if(_nft.getApproved(tokenId) != address(this)) revert Unit__NotApprovedToSpendNFT();

        s_listings[nft][tokenId] = Listing(msg.sender, nft, tokenId, price);

        emit ItemListed(msg.sender, nft, tokenId, price);     
    }

    function updateItemSeller(address nft, uint256 tokenId, address newSeller) external isOwner(nft, tokenId, newSeller) {
        Listing memory listing = s_listings[nft][tokenId];
        address oldSeller = listing.seller;

        if(oldSeller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(newSeller == address(0)) revert Unit__ZeroAddress();

        s_listings[nft][tokenId].seller = newSeller;

        emit ItemSellerUpdated(nft, tokenId, oldSeller, newSeller);
    }

    function updateItemPrice(address nft, uint256 tokenId, uint256 newPrice) external isOwner(nft, tokenId, msg.sender) {
        Listing memory listing = s_listings[nft][tokenId];
        address oldPrice = listing.price;

        if(oldPrice <= 0) revert Unit__ItemNotListed(nft, tokenId);
        if(newPrice <= 0) revert Unit__InsufficientAmount();

        s_listings[nft][tokenId].price = newPrice;

        emit ItemPriceUpdated(nft, tokenId, oldPrice, newPrice);
    }

    function buyItem(address nft, uint256 tokenId) external payable {
        Listing memory listing = s_listings[nft][tokenId];
    
        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(listing.price < msg.value) revert Unit__InsufficientAmount();

        delete s_listings[nft][tokenId];

        if(IERC721(nft).safeTransferFrom(listing.seller, msg.sender, tokenId) == false) revert Unit__NftTransferFailed(msg.sender, nft, tokenId);
    
        (uint256 earnings, uint256 fee) = _extractFee(msg.value);
        s_earnings[listing.seller] += earnings;
        s_fees += fee;

        emit ItemBought(msg.sender, nft, tokenId, msg.value);
    }

    function unlistItem(address nft, uint256 tokenId) externat isOwner(nft, tokenId, msg.sender) {
        delete s_listings[nft][tokenId];
        emit ItemUnlisted(msg.sender, nft, tokenId);
    }

    /**
     * -- Note -- 
     *      Use MIN_BID_DEADLINE if deadline is not specified
     */
    function placeOffer(address nft, uint256 tokenId, uint256 deadline) external payable {
        Listing memory listing = s_listings[nft][tokenId];
    
        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(s_offers[msg.sender][nft][tokenId].amount > 0) revert Unit__OfferAlreadyExists(nft, tokenId, msg.sender);
        if(msg.value <= 0) revert Unit__InsufficientAmount();

        uint256 _deadline = deadline;

        if(deadline == 0) {
            _deadline = MIN_BID_DEADLINE;
        } else if(deadline < block.timestamp + MIN_BID_DEADLINE) { 
            revert Unit__DeadlineMustBeADayOrMore();
        }

        s_offers[msg.sender][nft][tokenId] = Offer(msg.value, _deadline);

        emit ItemOffer(msg.sender, nft, tokenId, amount, deadline);
    }

    function acceptOffer(address offer_owner, address nft, uint256 tokenId) external {
        Listing memory listing = s_listings[nft][tokenId];
        Offer memory offer = s_offers[offer_owner][nft][tokenId];
        
        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);

        if(offer.amount <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, offer_owner, offer_owner);
        if(offer.deadline <= block.timestamp) revert Unit__OfferExpired();

        delete s_listings[nft][tokenId];
        delete s_offers[offer_owner][nft][tokenId];
        
        if(IERC721(nft).safeTransferFrom(listing.seller, offer_owner, tokenId) == false) revert Unit__NftTransferFailed(offer_owner, nft, tokenId);
    
        (uint256 earnings, uint256 fee) = _extractFee(offer.amount);
        s_earnings[listing.seller] += earnings;
        s_fees += fee;

        emit OfferAccepted(offer_owner, nft, tokenId, offer.amount);

    }

    function updateOfferAmount(address nft, uint256 tokenId, uint256 newAmount) external {
        Listing memory listing = s_listings[nft][tokenId];
        uint256 oldAmount = s_offers[msg.sender][nft][tokenId].amount;

        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(oldAmount <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, msg.sender);
        if(newAmount <= 0) revert Unit__InsufficientAmount();

        s_offers[msg.sender][nft][tokenId].amount = newAmount;

        emit OfferAmountUpdated(msg.sender, nft, tokenId, oldAmount, newAmount);
    }

    // function updateOfferDeadline(address nft, uint256 tokenId, uint256 newDeadline) external {
    //     if(nft == address(0)) revert Unit__ZeroAddress();

    //     Listing memory listing = s_listings[nft][tokenId];
    //     uint256 oldDeadline = s_offers[msg.sender][nft][tokenId].deadline;

    //     if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
    //     if(oldDeadline <= 0) revert Unit__OfferDoesNotExist(nft, tokenId, msg.sender);
    //     if(newDeadline < block.timestamp + MIN_BID_DEADLINE) revert Unit__DeadlineMustBeADayOrMore();

    //     s_offers[msg.sender][nft][tokenId].deadline = newDeadline;

    //     emit OfferAmountUpdated(msg.sender, nft, tokenId, oldDeadline, newDeadline);
    // }

    function withdrawOffers(address nft, uint256 tokenId) external {
        Offer memory offer = s_offers[msg.sender][nft][tokenId];

        if(offer.amount <= 0) revert Unit__OfferDoesNotExist();
        if(offer.deadline > block.timestamp) revert Unit__DeadlineNotReached(block.timestamp, offer.deadline);

        delete s_offers[msg.sender][nft][tokenId];

        (bool success, ) = payable(msg.sender).call{value: offer.amount}("");

        if(!success) revert Unit__EthTransferFailed(msg.sender, offer.amount);

        emit OfferWithdrawn(offer_owner, nft, tokenId)
    }

    function withdrawEarnings() external {
        uint256 earnings = s_earnings[msg.sender]

        if(earnings <= 0) revert Unit__ZeroEarnings();

        delete s_earnings[msg.sender];

        (bool success, ) = payable(msg.sender).call{value: earnings}("");

        if(!success) revert Unit__EthTransferFailed(msg.sender, earnings);

        emit EarningsWithdrawn(msg.sender, earnings);
    }

    function withdrawFees(uint256 amount) external onlyOwner {
        if(s_fees < amount) revert Unit__InsufficientFees(s_fees, amount);

        unchecked {
            s_fees -= amount;
        }

        (bool success, ) = payable(msg.sender).call{value: amount}("");

        if(!success) revert Unit__EthTransferFailed(msg.sender, amount);

        emit FeesWithdrawn(msg.sender, amount);
    }

    /** 
     * @title Helper Functions
     */

    function _extractFee(uint256 amount) private pure returns(uint256 earnings, uint256 fee) {
        earnings = (amount * 997) / 1000;
        fee = (amount * 3) / 10;
    }
}

/**
 *
 * --- Data Types ---
 *
 * - Enums -
 *
 * - PaymentAction
 * #params
 *      ADD
 *      UPDATE
 *      DELETE
 *
 *
 *
 * - Structs -
 *
 * - PaymentOption
 * #params
 *      token address
 *      price
 *
 * - Listing
 * #params
 *      seller address
 *      nft address
 *      token id
 *      mapping of approved PaymentOptions(Note: ETH => WETH => PaymentOption)
 *      mapping of offer_owners
 *
 * - Offer
 * #params
 *      amount
 *      deadline
 *
 *
 *
 * --- Events ---
 *
 * - ItemListed
 * #params
 *      owner address
 *      nft address
 *      token id
 *      array of approved PaymentOptions(Note: ETH => WETH => PaymentOption)
 *
 * - ItemUnlisted
 *      owner
 *      nft address
 *      token id
 *
 * - ItemOffer
 * #params
 *      offer_owner address
 *      nft address
 *      token id
 *      token address
 *      offer value
 *      deadline
 *
 * - ItemBought
 * #params
 *      buyer address
 *      nft address
 *      token id
 *      token address
 *      price
 *
 * - ItemPriceUpdated
 * #params
 *      nft address
 *      token id
 *      token address
 *      old price
 *      new price
 *
 * - itemSellerUpdated
 * #params
 *      nft address
 *      token id
 *      old seller
 *      new seller
 *
 * - OfferAmountUpdated
 * #params
 *      offer owner
 *      nft address
 *      token id
 *      token address
 *      old amount
 *      new amount
 *
 * - OfferDeadlineUpdated
 * #params
 *      offer owner
 *      nft address
 *      token id
 *      token address
 *      old deadline
 *      new deadline
 *
 * - OfferRemoved
 * #params
 *      offer owner
 *      nft address
 *      token id
 *      token address
 * 
 * - OfferAccepted
 * #params 
 *      offer owner 
 *      nft address 
 *      token id
 *      token address 
 *      price
 *
 * - EarningsWithdrawn
 * #params
 *      owner
 *      token address
 *      amount
 *
 *
 *
 * --- State ---
 * - s_listings
 *      -> mapping(nftAddress => tokenId => Listing)
 * - s_earnings
 *      -> mapping (ownerAddress => mapping(tokenAddress => amount))
 * - MIN_BID_DEADLINE = 24 hours
 *
 *
 *
 * --- Functions ---
 *
 * - listItem✅
 * #params
 *      nft address
 *      token id
 *      array of approved PaymentOptions
 * #program_flow
 *      ensure item is owned by msg.sender
 *      ensure price is not zero
 *      ensure Unit is approved to transfer the nft
 *      ensure item is not listed
 *      ensure nft address and token address are not zero addresses
 *      store listing
 *      emit event
 *
 * - updateItemSeller✅
 * #params
 *      new seller address
 *      nft address
 *      token id
 * #program_flow
 *      ensure item is listed
 *      ensure new seller address is not zero
 *      ensure new seller is current owner
 *      update seller
 *      emit event
 *
 * - unlistItem✅
 * #params
 *      nft address
 *      token id
 * #program_flow
 *      ensure msg.sender is current seller
 *      remove item
 *      emit event
 * 
 * - buyItem✅
 * #params
 *      nft address
 *      token id 
 *      amount(msg.value)
 * #program_flow
 *      ensure item is listed
 *      ensure amount is >= item price
 *      delete list record
 *      transfer item to msg.sender
 *      record earnings as 99.7% of amount
 *      record fees as 0.3% of amount
 *      emit event
 *
 * - buyItemWithToken
 * #params
 *      nft address
 *      token id
 *      token address
 *      amount
 * #program_flow
 *      ensure item is listed
 *      ensure Unit is approved to spend tokens
 *      ensure msg.sender has amount
 *      swap token for eth using Uniswap
 *      ensure token value in eth is >= item price
 *      delete list record
 *      transfer item to msg.sender
 *      transfer token value in eth to Unit
 *      record earnings as 99.7% of token value in eth
 *      record fees as 0.3% of token value in eth
 *      emit event
 *
 * - withdrawEarnings✅
 * #params
 *      token address
 * #program_flow
 *      ensure token address is not zero
 *      ensure msg.sender has earnings(amount > 0)
 *      delete record
 *      transfer earnings to msg.sender
 *      emit event
 *
 * - placeOffer✅
 * #params
 *      nft address
 *      token id
 *      token address
 *      amount
 *      deadline
 * #program_flow
 *      approve Unit to spend tokens
 *      ensure item is listed
 *      ensure offer does not exist
 *      ensure token address is approved for payment by item seller
 *      ensure Unit is approved to spend tokens
 *      ensure deadline is not less than MIN_BID_DEADLINE
 *      if no deadline is specified, use MIN_BID_DEADLINE
 *      store in offers mapping of item
 *      emit event
 *
 * - acceptOffer✅
 * #params
 *      nft address
 *      token id
 *      offer owner address
 *      token address
 * #program_flow
 *      ensure msg.sender is listing seller
 *      ensure item is listed
 *      ensure offer exists
 *      ensure deadline has not been reached
 *      delete listed item
 *      transfer nft to offer owner
 *      transfer earnings to Unit
 *      record earnings for listing seller
 *      emit event
 *
 * - updateOfferAmount✅
 * #params
 *      nft address
 *      token id
 *      token address
 *      amount
 * #program_flow
 *      ensure item is listed
 *      ensure offer exists
 *      ensure msg.sender owns offer
 *      ensure amount is not zero
 *      update amount
 *      emit event
 *
 * - updateOfferDeadline✅
 * #params
 *      nft address
 *      token id
 *      token address
 *      new deadline
 * #program_flow
 *      ensure item is listed
 *      ensure offer exists
 *      ensure msg.sender owns offer
 *      ensure new deadline is not less than MIN_BID_DEADLINE
 *      update deadline
 *      emit event
 *
 * - removeOffer✅
 * #params
 *      nft address
 *      token id
 *      token address
 * #program_flow
 *      ensure item is listed
 *      ensure offer exists
 *      ensure msg.sender owns offer
 *      delete offer
 *      emit event
 * 
 * - getListing✅
 * 
 * - getEarnings✅
 * 
 * - getFees✅
 * 
 * - getOffer✅
 *
 */
