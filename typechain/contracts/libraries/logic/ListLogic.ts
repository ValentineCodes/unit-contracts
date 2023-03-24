/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  Signer,
  utils,
} from "ethers";
import type { EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export interface ListLogicInterface extends utils.Interface {
  functions: {};

  events: {
    "ItemAuctionDisabled(address,uint256,uint256)": EventFragment;
    "ItemAuctionEnabled(address,uint256,uint256)": EventFragment;
    "ItemDeadlineExtended(address,address,uint256,uint256,uint256)": EventFragment;
    "ItemListed(address,address,uint256,address,uint256,bool,uint256)": EventFragment;
    "ItemPriceUpdated(address,uint256,address,uint256,uint256)": EventFragment;
    "ItemSellerUpdated(address,uint256,address,address)": EventFragment;
    "ItemUnlisted(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ItemAuctionDisabled"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ItemAuctionEnabled"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ItemDeadlineExtended"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ItemListed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ItemPriceUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ItemSellerUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ItemUnlisted"): EventFragment;
}

export interface ItemAuctionDisabledEventObject {
  nft: string;
  tokenId: BigNumber;
  fixedPrice: BigNumber;
}
export type ItemAuctionDisabledEvent = TypedEvent<
  [string, BigNumber, BigNumber],
  ItemAuctionDisabledEventObject
>;

export type ItemAuctionDisabledEventFilter =
  TypedEventFilter<ItemAuctionDisabledEvent>;

export interface ItemAuctionEnabledEventObject {
  nft: string;
  tokenId: BigNumber;
  startingPrice: BigNumber;
}
export type ItemAuctionEnabledEvent = TypedEvent<
  [string, BigNumber, BigNumber],
  ItemAuctionEnabledEventObject
>;

export type ItemAuctionEnabledEventFilter =
  TypedEventFilter<ItemAuctionEnabledEvent>;

export interface ItemDeadlineExtendedEventObject {
  offerOwner: string;
  nft: string;
  tokenId: BigNumber;
  oldDeadline: BigNumber;
  newDeadline: BigNumber;
}
export type ItemDeadlineExtendedEvent = TypedEvent<
  [string, string, BigNumber, BigNumber, BigNumber],
  ItemDeadlineExtendedEventObject
>;

export type ItemDeadlineExtendedEventFilter =
  TypedEventFilter<ItemDeadlineExtendedEvent>;

export interface ItemListedEventObject {
  owner: string;
  nft: string;
  tokenId: BigNumber;
  token: string;
  price: BigNumber;
  auction: boolean;
  deadline: BigNumber;
}
export type ItemListedEvent = TypedEvent<
  [string, string, BigNumber, string, BigNumber, boolean, BigNumber],
  ItemListedEventObject
>;

export type ItemListedEventFilter = TypedEventFilter<ItemListedEvent>;

export interface ItemPriceUpdatedEventObject {
  nft: string;
  tokenId: BigNumber;
  token: string;
  oldPrice: BigNumber;
  newPrice: BigNumber;
}
export type ItemPriceUpdatedEvent = TypedEvent<
  [string, BigNumber, string, BigNumber, BigNumber],
  ItemPriceUpdatedEventObject
>;

export type ItemPriceUpdatedEventFilter =
  TypedEventFilter<ItemPriceUpdatedEvent>;

export interface ItemSellerUpdatedEventObject {
  nft: string;
  tokenId: BigNumber;
  oldSeller: string;
  newSeller: string;
}
export type ItemSellerUpdatedEvent = TypedEvent<
  [string, BigNumber, string, string],
  ItemSellerUpdatedEventObject
>;

export type ItemSellerUpdatedEventFilter =
  TypedEventFilter<ItemSellerUpdatedEvent>;

export interface ItemUnlistedEventObject {
  owner: string;
  nft: string;
  tokenId: BigNumber;
}
export type ItemUnlistedEvent = TypedEvent<
  [string, string, BigNumber],
  ItemUnlistedEventObject
>;

export type ItemUnlistedEventFilter = TypedEventFilter<ItemUnlistedEvent>;

export interface ListLogic extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ListLogicInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {};

  callStatic: {};

  filters: {
    "ItemAuctionDisabled(address,uint256,uint256)"(
      nft?: null,
      tokenId?: null,
      fixedPrice?: null
    ): ItemAuctionDisabledEventFilter;
    ItemAuctionDisabled(
      nft?: null,
      tokenId?: null,
      fixedPrice?: null
    ): ItemAuctionDisabledEventFilter;

    "ItemAuctionEnabled(address,uint256,uint256)"(
      nft?: null,
      tokenId?: null,
      startingPrice?: null
    ): ItemAuctionEnabledEventFilter;
    ItemAuctionEnabled(
      nft?: null,
      tokenId?: null,
      startingPrice?: null
    ): ItemAuctionEnabledEventFilter;

    "ItemDeadlineExtended(address,address,uint256,uint256,uint256)"(
      offerOwner?: PromiseOrValue<string> | null,
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      oldDeadline?: null,
      newDeadline?: null
    ): ItemDeadlineExtendedEventFilter;
    ItemDeadlineExtended(
      offerOwner?: PromiseOrValue<string> | null,
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      oldDeadline?: null,
      newDeadline?: null
    ): ItemDeadlineExtendedEventFilter;

    "ItemListed(address,address,uint256,address,uint256,bool,uint256)"(
      owner?: PromiseOrValue<string> | null,
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      token?: null,
      price?: null,
      auction?: null,
      deadline?: null
    ): ItemListedEventFilter;
    ItemListed(
      owner?: PromiseOrValue<string> | null,
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      token?: null,
      price?: null,
      auction?: null,
      deadline?: null
    ): ItemListedEventFilter;

    "ItemPriceUpdated(address,uint256,address,uint256,uint256)"(
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      token?: null,
      oldPrice?: null,
      newPrice?: PromiseOrValue<BigNumberish> | null
    ): ItemPriceUpdatedEventFilter;
    ItemPriceUpdated(
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      token?: null,
      oldPrice?: null,
      newPrice?: PromiseOrValue<BigNumberish> | null
    ): ItemPriceUpdatedEventFilter;

    "ItemSellerUpdated(address,uint256,address,address)"(
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      oldSeller?: null,
      newSeller?: PromiseOrValue<string> | null
    ): ItemSellerUpdatedEventFilter;
    ItemSellerUpdated(
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      oldSeller?: null,
      newSeller?: PromiseOrValue<string> | null
    ): ItemSellerUpdatedEventFilter;

    "ItemUnlisted(address,address,uint256)"(
      owner?: PromiseOrValue<string> | null,
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null
    ): ItemUnlistedEventFilter;
    ItemUnlisted(
      owner?: PromiseOrValue<string> | null,
      nft?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null
    ): ItemUnlistedEventFilter;
  };

  estimateGas: {};

  populateTransaction: {};
}
