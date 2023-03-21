// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

error Unit__ItemListed(address nft, uint256 tokenId);
error Unit__ItemNotListed(address nft, uint256 tokenId);
error Unit__NotOwner();
error Unit__ZeroAddress();
error Unit__NotApprovedToSpendNFT();
error Unit__AmountMustBeGreaterThanZero();
error Unit__BidAlreadyExists(address nft, uint256 tokenId, address bidder);
error Unit__BidDoesNotExist(address nft, uint256 tokenId, address bidder);
error Unit__DeadlineMustBeADayOrMore();
error Unit__DeadlineNotReached(uint256 currentTime, uint256 deadline);
error Unit__ZeroEarnings();
error Unit__NftTransferFailed(address to, address nft, uint256 tokenId);
error Unit__TokenTransferFailed(address to, address token, uint256 amount);
error Unit__EthTransferFailed(address to, uint256 amount);
error Unit__NotListingOwner(address nft, uint256 tokenId);
error Unit__InsufficientFees(uint256 feeBalance, uint256 requestedAmount);

contract Unit {

    struct PaymentOption {
        address token;
        uint256 price;
    }

    struct Bid {
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

    event ItemBid (
        address indexed bidder,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 deadline
    );

    event BidAmountUpdated (
        address indexed bidder,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldAmount,
        uint256 newAmount
    );

    event BidDeadlineUpdated (
        address indexed bidder,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    event BidAccepted (
        address indexed bidder,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 price
    );

    event BidWithdrawn (
        address indexed bidder,
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
    mapping(address => address => uint256 => Bid) private s_bids; // bidder => nft => token id => Bid
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

    function _extractFee(uint256 amount) private pure returns(uint256 earnings, uint256 fee) {
        earnings = (amount * 997) / 1000;
        fee = (amount * 3) / 10;
    }

    function listItem(address nft, uint256 tokenId, uint256 price) external isNotListed(nft, tokenId) isOwner(nft, tokenId, msg.sender) {
        if(nft == address(0)) revert Unit__ZeroAddress();
        if(price == 0) revert Unit__AmountMustBeGreaterThanZero();
        
        IERC721 _nft = IERC721(nft);

        if(_nft.ownerOf(tokenId) != msg.sender) revert Unit__NotOwner();
        if(_nft.getApproved(tokenId) != address(this)) revert Unit__NotApprovedToSpendNFT();

        s_listings[nft][tokenId] = Listing(msg.sender, nft, tokenId, price);

        emit ItemListed(msg.sender, nft, tokenId, price);     
    }

    function updateSeller(address nft, uint256 tokenId, address newSeller) external isOwner(nft, tokenId, newSeller) {
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
        if(newPrice <= 0) revert Unit__AmountMustBeGreaterThanZero();

        s_listings[nft][tokenId].price = newPrice;

        emit ItemPriceUpdated(nft, tokenId, oldPrice, newPrice);
    }

    function unlistItem(address nft, uint256 tokenId) externat isOwner(nft, tokenId, msg.sender) {
        delete s_listings[nft][tokenId];
        emit ItemUnlisted(msg.sender, nft, tokenId);
    }

    function placeBid(address nft, uint256 tokenId, uint256 deadline) external payable {
        if(nft == address(0)) revert Unit__ZeroAddress();

        Listing memory listing = s_listings[nft][tokenId];
    
        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(s_bids[msg.sender][nft][tokenId].amount > 0) revert Unit__BidAlreadyExists(nft, tokenId, msg.sender);
        if(msg.value <= 0) revert Unit__AmountMustBeGreaterThanZero();
        if(deadline != 0 && deadline < block.timestamp + MIN_BID_DEADLINE) revert Unit__DeadlineMustBeADayOrMore();
        
        s_bids[msg.sender][nft][tokenId] = Bid({
            amount: msg.value,
            deadline: deadline == 0 ? MIN_BID_DEADLINE : deadline 
        })

        emit ItemBid(msg.sender, nft, tokenId, amount, deadline);
    }

    function acceptBid(address nft, uint256 tokenId, address bidder) external {
        if(nft == address(0) || bidder == address(0)) revert Unit__ZeroAddress();

        Listing memory listing = s_listings[nft][tokenId];
        Bid memory bid = s_bids[bidder][nft][tokenId];
        
        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(listing.seller != msg.sender) revert Unit__NotListingOwner(nft, tokenId);
        if(bid.amount <= 0) revert Unit__BidDoesNotExist(nft, tokenId, bidder);
        if(bid.deadline <= block.timestamp) revert Unit__BidExpired();

        delete s_listings[nft][tokenId];
        delete s_bids[bidder][nft][tokenId];
        
        if(IERC721(nft).safeTransferFrom(listing.seller, bidder, tokenId) == false) revert Unit__NftTransferFailed(bidder, nft, tokenId);
    
        (uint256 earnings, uint256 fee) = _extractFee(bid.amount);
        s_earnings[listing.seller] += earnings;
        s_fees += fee;

        emit BidAccepted(bidder, nft, tokenId, bid.amount);

    }

    function updateBidAmount(address nft, uint256 tokenId, uint256 newAmount) external {
        if(nft == address(0)) revert Unit__ZeroAddress();

        Listing memory listing = s_listings[nft][tokenId];
        uint256 oldAmount = s_bids[msg.sender][nft][tokenId].amount;

        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(oldAmount <= 0) revert Unit__BidDoesNotExist(nft, tokenId, msg.sender);
        if(newAmount <= 0) revert Unit__AmountMustBeGreaterThanZero();

        s_bids[msg.sender][nft][tokenId].amount = newAmount;

        emit BidAmountUpdated(msg.sender, nft, tokenId, oldAmount, newAmount);
    }

    function updateBidDeadline(address nft, uint256 tokenId, uint256 newDeadline) external {
        if(nft == address(0)) revert Unit__ZeroAddress();

        Listing memory listing = s_listings[nft][tokenId];
        uint256 oldDeadline = s_bids[msg.sender][nft][tokenId].deadline;

        if(listing.seller == address(0)) revert Unit__ItemNotListed(nft, tokenId);
        if(oldDeadline <= 0) revert Unit__BidDoesNotExist(nft, tokenId, msg.sender);
        if(newDeadline < block.timestamp + MIN_BID_DEADLINE) revert Unit__DeadlineMustBeADayOrMore();

        s_bids[msg.sender][nft][tokenId].deadline = newDeadline;

        emit BidAmountUpdated(msg.sender, nft, tokenId, oldDeadline, newDeadline);
    }

    function withdrawBids(address nft, uint256 tokenId) external {
        if(nft == address(0)) revert Unit__ZeroAddress();

        Bid memory bid = s_bids[msg.sender][nft][tokenId];

        if(bid.amount <= 0) revert Unit__BidDoesNotExist();
        if(bid.deadline > block.timestamp) revert Unit__DeadlineNotReached(block.timestamp, bid.deadline);

        delete s_bids[msg.sender][nft][tokenId];

        (bool success, ) = payable(msg.sender).call{value: bid.amount}("");

        if(!success) revert Unit__EthTransferFailed(msg.sender, bid.amount);

        emit BidWithdrawn(bidder, nft, tokenId)
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
 *      mapping of bidders
 *
 * - Bid
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
 * - ItemBid
 * #params
 *      bidder address
 *      nft address
 *      token id
 *      token address
 *      bid value
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
 * - BidAmountUpdated
 * #params
 *      bid owner
 *      nft address
 *      token id
 *      token address
 *      old amount
 *      new amount
 *
 * - BidDeadlineUpdated
 * #params
 *      bid owner
 *      nft address
 *      token id
 *      token address
 *      old deadline
 *      new deadline
 *
 * - BidRemoved
 * #params
 *      bid owner
 *      nft address
 *      token id
 *      token address
 * 
 * - BidAccepted
 * #params 
 *      bid owner 
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
 * #requirements
 *      ensure item is owned by msg.sender
 *      ensure price is not zero
 *      ensure Unit is approved to transfer the nft
 *      ensure item is not listed
 *      ensure nft address and token address are not zero addresses
 *      store listing
 *      emit event
 *
 * - updateSeller✅
 * #params
 *      new seller address
 *      nft address
 *      token id
 * #requirements
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
 * #requirements
 *      ensure msg.sender is current seller
 *      remove item
 *      emit event
 * 
 * - buyItem
 * #params
 *      nft address
 *      token id 
 *      amount(msg.value)
 * #requirements
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
 * #requirements
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
 * #requirements
 *      ensure token address is not zero
 *      ensure msg.sender has earnings(amount > 0)
 *      delete record
 *      transfer earnings to msg.sender
 *      emit event
 *
 * - placeBid✅
 * #params
 *      nft address
 *      token id
 *      token address
 *      amount
 *      deadline
 * #requirements
 *      approve Unit to spend tokens
 *      ensure item is listed
 *      ensure bid does not exist
 *      ensure token address is approved for payment by item seller
 *      ensure Unit is approved to spend tokens
 *      ensure deadline is not less than MIN_BID_DEADLINE
 *      if no deadline is specified, use MIN_BID_DEADLINE
 *      store in bids mapping of item
 *      emit event
 *
 * - acceptBid✅
 * #params
 *      nft address
 *      token id
 *      bid owner address
 *      token address
 * #requirements
 *      ensure msg.sender is listing seller
 *      ensure item is listed
 *      ensure bid exists
 *      ensure deadline has not been reached
 *      delete listed item
 *      transfer nft to bid owner
 *      transfer earnings to Unit
 *      record earnings for listing seller
 *      emit event
 *
 * - updateBidAmount✅
 * #params
 *      nft address
 *      token id
 *      token address
 *      amount
 * #requirements
 *      ensure item is listed
 *      ensure bid exists
 *      ensure msg.sender owns bid
 *      ensure amount is not zero
 *      update amount
 *      emit event
 *
 * - updateBidDeadline✅
 * #params
 *      nft address
 *      token id
 *      token address
 *      new deadline
 * #requirements
 *      ensure item is listed
 *      ensure bid exists
 *      ensure msg.sender owns bid
 *      ensure new deadline is not less than MIN_BID_DEADLINE
 *      update deadline
 *      emit event
 *
 * - removeBid✅
 * #params
 *      nft address
 *      token id
 *      token address
 * #requirements
 *      ensure item is listed
 *      ensure bid exists
 *      ensure msg.sender owns bid
 *      delete bid
 *      emit event
 *
 */
