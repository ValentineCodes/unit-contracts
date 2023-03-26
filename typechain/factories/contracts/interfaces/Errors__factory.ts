/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  Errors,
  ErrorsInterface,
} from "../../../contracts/interfaces/Errors";

const _abi = [
  {
    inputs: [],
    name: "Unit__CannotBuyOwnNFT",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumDeadline",
        type: "uint256",
      },
    ],
    name: "Unit__DeadlineLessThanMinimum",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Unit__EthTransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__InsufficientAmount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "feeBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
    ],
    name: "Unit__InsufficientFees",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__InvalidDeadline",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "requestedToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "actualToken",
        type: "address",
      },
    ],
    name: "Unit__InvalidItemToken",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__ItemDeadlineExceeded",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Unit__ItemInAuction",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Unit__ItemListed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Unit__ItemNotListed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Unit__ItemPriceInEth",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "Unit__ItemPriceInToken",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__ListingExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__NoUpdateRequired",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__NotApprovedToSpendNFT",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "Unit__NotApprovedToSpendToken",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__NotOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "offerOwner",
        type: "address",
      },
    ],
    name: "Unit__OfferDoesNotExist",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Unit__OfferExpired",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "offerOwner",
        type: "address",
      },
      {
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Unit__PendingOffer",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Unit__TokenTransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__ZeroAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__ZeroEarnings",
    type: "error",
  },
];

export class Errors__factory {
  static readonly abi = _abi;
  static createInterface(): ErrorsInterface {
    return new utils.Interface(_abi) as ErrorsInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Errors {
    return new Contract(address, _abi, signerOrProvider) as Errors;
  }
}