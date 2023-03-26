// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {DataTypes} from "../libraries/types/DataTypes.sol";

interface IUnit {
    /// @notice Emitted when an item is listed
    /// @param owner Address of item seller
    /// @param nft Address of listed NFT
    /// @param tokenId Token id of listed item
    /// @param token Address of currency for pricing. NOTE: ZERO ADDRESS for ETH price listing
    /// @param price Price of NFT
    /// @param auction If auction is enabled or not
    /// @param deadline When listing expires
    event ItemListed(
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 price,
        bool auction,
        uint256 deadline
    );

    /// @notice Emitted when item is unlisted
    /// @dev Can only be emitted by item owner
    /// @param owner Address of item seller
    /// @param nft Unlisted NFT
    /// @param tokenId Token id of unlisted NFT
    event ItemUnlisted(
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId
    );

    /// @notice Emitted when item deadline is extended
    /// @dev Can only be emitted by item owner
    /// @param owner Address of item seller
    /// @param nft Address of listed NFT
    /// @param tokenId Token id of listed NFT
    /// @param oldDeadline Previous deadline. NOTE: If deadline is 0, deadline was infinite
    /// @param newDeadline New deadline
    event ItemDeadlineExtended(
        address indexed owner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    /// @notice Emitted when item price is updated
    /// @dev Can only be emitted by item owner
    /// @param nft Address of listed NFT
    /// @param tokenId Token id of listed NFT
    /// @param token Address of price currency. NOTE: If token is ZERO ADDRESS, price in ETH
    /// @param oldPrice Old price
    /// @param newPrice New price
    event ItemPriceUpdated(
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 oldPrice,
        uint256 indexed newPrice
    );

    /// @notice Emitted when item seller is updated
    /// @dev Can only be emitted by item owner
    /// @param nft Address of listed NFT
    /// @param tokenId Token id of listed NFT
    /// @param oldSeller Old seller address
    /// @param newSeller New seller address. Must be item owner
    event ItemSellerUpdated(
        address indexed nft,
        uint256 indexed tokenId,
        address oldSeller,
        address indexed newSeller
    );

    /// @notice Emitted when an item is enabled for auction
    /// @dev Can only be emitted by item owner
    /// @param nft Address of listed NFT
    /// @param tokenId Token id of listed item
    /// @param startingPrice Starting price of the auction. If 0, use current price
    event ItemAuctionEnabled(
        address nft,
        uint256 tokenId,
        uint256 startingPrice
    );

    /// @notice Emitted when auction is disabled on an item
    /// @param nft Address of listed NFT
    /// @param tokenId Token id of listed item
    /// @param fixedPrice Fixed price of the item. If 0, use current price
    event ItemAuctionDisabled(address nft, uint256 tokenId, uint256 fixedPrice);

    /// @notice Emitted when an item is bought
    /// @param buyer Address of item buyer
    /// @param nft Address of bought NFT
    /// @param tokenId Token id of bought NFT
    /// @param token Address of item price currency. NOTE: If token is ZERO ADDRESS, price in ETH
    /// @param price Amount paid for the item
    event ItemBought(
        address indexed buyer,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 price
    );

    /// @notice Emitted when an offer is created
    /// @dev Offers can only be created with ERC20 tokens
    /// @param offerOwner Address of the owner of the offer
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    /// @param token Address of token offered
    /// @param amount Amount of token offered
    /// @param deadline When offer expires. if deadline is 0, deadline is set to current item deadline
    event OfferCreated(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 amount,
        uint256 deadline
    );

    /// @notice Emitted when offer amount is updated
    /// @dev Can only be emitted by offer owner
    /// @param offerOwner Address of offer owner
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    /// @param token Address of currency used to make an offer
    /// @param oldAmount Previous offer amount
    /// @param newAmount New offer amount
    event OfferAmountUpdated(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 oldAmount,
        uint256 newAmount
    );

    /// @notice Emitted when offer amount is updated
    /// @dev Can only be emitted by offer owner
    /// @param offerOwner Address of offer owner
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    /// @param oldDeadline Previous offer deadline
    /// @param newDeadline New offer deadline
    event OfferDeadlineExtended(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    /// @notice Emitted when offer amount is updated
    /// @dev Can only be emitted by item owner
    /// @param offerOwner Address of offer owner
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    /// @param token Address of currency used to make an offer
    /// @param amount Amount offered
    event OfferAccepted(
        address indexed offerOwner,
        address indexed nft,
        uint256 indexed tokenId,
        address token,
        uint256 amount
    );

    /// @notice Emitted when offer amount is updated
    /// @dev Can only be emitted by offer owner
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    /// @param offerOwner Address of offer owner
    event OfferRemoved(address nft, uint256 tokenId, address offerOwner);

    /// @notice Emitted when earnings are withdrawn
    /// @param owner Address of earnings owner
    /// @param token Address of earnings currency. If token is ZERO ADDRESS, earnings in ETH
    /// @param amount Amount of earnings
    event EarningsWithdrawn(
        address indexed owner,
        address indexed token,
        uint256 indexed amount
    );

    /// @notice Emitted when fees are withdrawn
    /// @param feeOwner Address of fees owner
    /// @param token Address of fees currency. If token is ZERO ADDRESS, fees in ETH
    /// @param amount Amount of fees
    event FeesWithdrawn(
        address indexed feeOwner,
        address indexed token,
        uint256 indexed amount
    );

    /// @notice Lists item with ETH price
    /// @dev Unit must be approved to spend NFT
    /// @param nft Address of NFT to be listed
    /// @param tokenId Token id of NFT to be listed
    /// @param price ETH price of listing
    /// @param deadline How many seconds till listing expires. if deadline is 0, deadline is infinite
    function listItem(
        address nft,
        uint256 tokenId,
        uint256 price,
        uint256 deadline
    ) external;

    /// @notice Lists item with token price
    /// @dev Unit must be approved to spend NFT
    /// @param nft Address of NFT to be listed
    /// @param tokenId Token id of NFT to be listed
    /// @param token Address of price token
    /// @param price Token price of listing
    /// @param auction Toggle between fixed and auction listing
    /// @param deadline How many seconds till listing expires. if deadline is 0, deadline is infinite
    function listItemWithToken(
        address nft,
        uint256 tokenId,
        address token,
        uint256 price,
        bool auction,
        uint256 deadline
    ) external;

    /// @notice Unlists item
    /// @dev Can only be called by item owner
    /// @param nft Address of NFt to be unlisted
    /// @param tokenId Token id of NFT to be unlisted
    function unlistItem(address nft, uint256 tokenId) external;

    /// @notice Updates item seller
    /// @dev Can only be called by item owner.
    /// @param nft Address of NFt to be updated
    /// @param tokenId Token id of NFT to be updated
    /// @param newSeller Address of new seller. New seller must be item owner
    function updateItemSeller(
        address nft,
        uint256 tokenId,
        address newSeller
    ) external;

    /// @notice Updates item price
    /// @dev Can only be called by item owner.
    /// @param nft Address of NFt to be updated
    /// @param tokenId Token id of NFT to be updated
    /// @param newPrice New item price
    function updateItemPrice(
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external;

    /// @notice Extends item deadline
    /// @dev Can only be called by item owner.
    /// @param nft Address of NFt to be updated
    /// @param tokenId Token id of NFT to be updated
    /// @param extraTime Extra time(in seconds) added to current deadline
    function extendItemDeadline(
        address nft,
        uint256 tokenId,
        uint256 extraTime
    ) external;

    /// @notice Enables auction on an item
    /// @dev Can only be called by item owner.
    /// @param nft Address of NFt to be updated
    /// @param tokenId Token id of NFT to be updated
    /// @param newPrice Starting price of auction. If 0, use current price
    function enableAuction(
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external;

    /// @notice Disables auction on an item
    /// @dev Can only be called by item owner.
    /// @param nft Address of NFT to be updated
    /// @param tokenId Token id of NFT to be updated
    /// @param newPrice Fixed price of item. If 0, use current price
    function disableAuction(
        address nft,
        uint256 tokenId,
        uint256 newPrice
    ) external;

    /// @notice Buys an item with ETH price
    /// @param nft Address of NFT to be bought
    /// @param tokenId Token id of NFT to be bought
    function buyItem(address nft, uint256 tokenId) external payable;

    /// @notice Buys an item with token price
    /// @dev Unit must be approved to spend tokens
    /// @param nft Address of NFT to be bought
    /// @param tokenId Token id of NFT to be bought
    /// @param token Address of item price currency
    /// @param amount Item price
    function buyItemWithToken(
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount
    ) external;

    /// @notice Makes an offer on an item
    /// @dev Offers can only be created with tokens only
    /// @dev Unit must be approved to spend tokens
    /// @param nft Address of NFT to make an offer on
    /// @param tokenId Token id of NFT to make an offer on
    /// @param token Address of token offered
    /// @param amount Amount of tokens offered
    /// @param deadline How long(in seconds) till offer expires. if deadline is 0, deadline is set to current item deadline
    function createOffer(
        address nft,
        uint256 tokenId,
        address token,
        uint256 amount,
        uint256 deadline
    ) external;

    /// @notice Accepts an offer on an item
    /// @dev Can only be called by item owner
    /// @param offerOwner Address of offer owner
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    function acceptOffer(
        address offerOwner,
        address nft,
        uint256 tokenId
    ) external;

    /// @notice Extends offer deadline
    /// @dev Can only be called by offer owner
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    /// @param extraTime How much time(in seconds) to add to current deadline
    function extendOfferDeadline(
        address nft,
        uint256 tokenId,
        uint256 extraTime
    ) external;

    /// @notice Rmoves offer
    /// @dev Can only be called by offer owner
    /// @param nft Address of NFT offer was made on
    /// @param tokenId Token id of NFT offer was made on
    function removeOffer(address nft, uint256 tokenId) external;

    /// @notice Withdraws seller earnings
    /// @param token Address of earnings currency. If token is ZERO ADDRESS, earnings in ETH
    function withdrawEarnings(address token) external;

    /// @notice Withdraws Unit accumulated fees
    /// @param token Address of fees currency. If token is ZERO ADDRESS, fees in ETH
    function withdrawFees(address token) external;

    /// @notice Retrieves listing
    /// @param nft Address of listed NFT
    /// @param tokenId Token id of listed NFT
    /// @return Returns listing details
    function getListing(
        address nft,
        uint256 tokenId
    ) external view returns (DataTypes.Listing memory);

    /// @notice Retrieves earnings
    /// @param seller Address of seller
    /// @param token Address of earnings currency. if ZERO ADDRESS, earnings in ETH
    /// @return Earnings
    function getEarnings(
        address seller,
        address token
    ) external view returns (uint256);

    /// @notice Retrieves earnings
    /// @param token Address of fees currency. if ZERO ADDRESS, earnings in ETH
    /// @return Fees
    function getFees(address token) external view returns (uint256);

    /// @notice Retrieves offer
    /// @param offerOwner Address of offer owner
    /// @param nft Address of NFT
    /// @param tokenId Token id of NFT
    /// @return offer Offer
    function getOffer(
        address offerOwner,
        address nft,
        uint256 tokenId
    ) external view returns (DataTypes.Offer memory offer);
}
