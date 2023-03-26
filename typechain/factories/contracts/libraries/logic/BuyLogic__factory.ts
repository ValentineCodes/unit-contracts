/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  BuyLogic,
  BuyLogicInterface,
} from "../../../../contracts/libraries/logic/BuyLogic";

const _abi = [
  {
    inputs: [],
    name: "Unit__CannotBuyOwnNFT",
    type: "error",
  },
  {
    inputs: [],
    name: "Unit__InvalidAmount",
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
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "nft",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "ItemBought",
    type: "event",
  },
];

const _bytecode =
  "0x61151f610053600b82828239805160001a607314610046577f4e487b7100000000000000000000000000000000000000000000000000000000600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600436106100405760003560e01c8063d2941bea14610045578063f55beefc1461006e575b600080fd5b81801561005157600080fd5b5061006c60048036038101906100679190611128565b610097565b005b81801561007a57600080fd5b5061009560048036038101906100909190611086565b61070c565b005b60008660008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008481526020019081526020016000206040518060e00160405290816000820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600282015481526020016003820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600482015481526020016005820160009054906101000a900460ff161515151581526020016006820154815250509050600081608001511161027b5783836040517f18def1c400000000000000000000000000000000000000000000000000000000815260040161027292919061127b565b60405180910390fd5b8060a00151156102c45783836040517f199ead720000000000000000000000000000000000000000000000000000000081526004016102bb92919061127b565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16816060015173ffffffffffffffffffffffffffffffffffffffff161461034157838382606001516040517f87abf058000000000000000000000000000000000000000000000000000000008152600401610338939291906112a4565b60405180910390fd5b8181608001511461037e576040517f091e98b900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008160c0015111801561039657508060c001514210155b156103cd576040517fdeb2284300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff16816000015173ffffffffffffffffffffffffffffffffffffffff161415610437576040517f4232223400000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8660008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000848152602001908152602001600020600080820160006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690556001820160006101000a81549073ffffffffffffffffffffffffffffffffffffffff021916905560028201600090556003820160006101000a81549073ffffffffffffffffffffffffffffffffffffffff021916905560048201600090556005820160006101000a81549060ff0219169055600682016000905550508373ffffffffffffffffffffffffffffffffffffffff166342842e0e826000015133866040518463ffffffff1660e01b815260040161056b93929190611244565b600060405180830381600087803b15801561058557600080fd5b505af1158015610599573d6000803e3d6000fd5b505050506000806105a984610fa1565b9150915081886000856000015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008073ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461063c91906112db565b92505081905550808760008073ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461069191906112db565b92505081905550848673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f93c830507acd24c092e291f65f36eccf9df2be394d8b7a1802669761ff1ed9956000886040516106f992919061127b565b60405180910390a4505050505050505050565b60008760008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008581526020019081526020016000206040518060e00160405290816000820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600282015481526020016003820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600482015481526020016005820160009054906101000a900460ff16151515158152602001600682015481525050905060008160800151116108f05784846040517f18def1c40000000000000000000000000000000000000000000000000000000081526004016108e792919061127b565b60405180910390fd5b8181608001511461092d576040517f091e98b900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8060a00151156109765784846040517f199ead7200000000000000000000000000000000000000000000000000000000815260040161096d92919061127b565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16816060015173ffffffffffffffffffffffffffffffffffffffff1614156109ee5784846040517f194829df0000000000000000000000000000000000000000000000000000000081526004016109e592919061127b565b60405180910390fd5b8273ffffffffffffffffffffffffffffffffffffffff16816060015173ffffffffffffffffffffffffffffffffffffffff1614610a68578281606001516040517fc51a67aa000000000000000000000000000000000000000000000000000000008152600401610a5f92919061121b565b60405180910390fd5b60008160c00151118015610a8057508060c001514210155b15610ab7576040517fdeb2284300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff16816000015173ffffffffffffffffffffffffffffffffffffffff161415610b21576040517f4232223400000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b818373ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b8152600401610b5d92919061121b565b60206040518083038186803b158015610b7557600080fd5b505afa158015610b89573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610bad91906111b5565b1015610bf057826040517ff702e2c8000000000000000000000000000000000000000000000000000000008152600401610be79190611200565b60405180910390fd5b8760008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000858152602001908152602001600020600080820160006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690556001820160006101000a81549073ffffffffffffffffffffffffffffffffffffffff021916905560028201600090556003820160006101000a81549073ffffffffffffffffffffffffffffffffffffffff021916905560048201600090556005820160006101000a81549060ff0219169055600682016000905550508473ffffffffffffffffffffffffffffffffffffffff166342842e0e826000015133876040518463ffffffff1660e01b8152600401610d2493929190611244565b600060405180830381600087803b158015610d3e57600080fd5b505af1158015610d52573d6000803e3d6000fd5b50505050600015158373ffffffffffffffffffffffffffffffffffffffff166323b872dd3330866040518463ffffffff1660e01b8152600401610d9793929190611244565b602060405180830381600087803b158015610db157600080fd5b505af1158015610dc5573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610de99190611059565b15151415610e32573083836040517f19a87e01000000000000000000000000000000000000000000000000000000008152600401610e2993929190611244565b60405180910390fd5b600080610e3e84610fa1565b9150915081896000856000015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610ed191906112db565b92505081905550808860008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610f2691906112db565b92505081905550858773ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f93c830507acd24c092e291f65f36eccf9df2be394d8b7a1802669761ff1ed9958888604051610f8d92919061127b565b60405180910390a450505050505050505050565b600080606483610fb19190611331565b90508083610fbf9190611362565b9150915091565b600081359050610fd58161145f565b92915050565b600081519050610fea81611476565b92915050565b600081359050610fff8161148d565b92915050565b600081359050611014816114a4565b92915050565b600081359050611029816114bb565b92915050565b60008135905061103e816114d2565b92915050565b600081519050611053816114d2565b92915050565b60006020828403121561106f5761106e61145a565b5b600061107d84828501610fdb565b91505092915050565b600080600080600080600060e0888a0312156110a5576110a461145a565b5b60006110b38a828b01611005565b97505060206110c48a828b01610ff0565b96505060406110d58a828b0161101a565b95505060606110e68a828b01610fc6565b94505060806110f78a828b0161102f565b93505060a06111088a828b01610fc6565b92505060c06111198a828b0161102f565b91505092959891949750929550565b60008060008060008060c087890312156111455761114461145a565b5b600061115389828a01611005565b965050602061116489828a01610ff0565b955050604061117589828a0161101a565b945050606061118689828a01610fc6565b935050608061119789828a0161102f565b92505060a06111a889828a0161102f565b9150509295509295509295565b6000602082840312156111cb576111ca61145a565b5b60006111d984828501611044565b91505092915050565b6111eb81611396565b82525050565b6111fa816113f2565b82525050565b600060208201905061121560008301846111e2565b92915050565b600060408201905061123060008301856111e2565b61123d60208301846111e2565b9392505050565b600060608201905061125960008301866111e2565b61126660208301856111e2565b61127360408301846111f1565b949350505050565b600060408201905061129060008301856111e2565b61129d60208301846111f1565b9392505050565b60006060820190506112b960008301866111e2565b6112c660208301856111f1565b6112d360408301846111e2565b949350505050565b60006112e6826113f2565b91506112f1836113f2565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115611326576113256113fc565b5b828201905092915050565b600061133c826113f2565b9150611347836113f2565b9250826113575761135661142b565b5b828204905092915050565b600061136d826113f2565b9150611378836113f2565b92508282101561138b5761138a6113fc565b5b828203905092915050565b60006113a1826113d2565b9050919050565b60008115159050919050565b6000819050919050565b6000819050919050565b6000819050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600080fd5b61146881611396565b811461147357600080fd5b50565b61147f816113a8565b811461148a57600080fd5b50565b611496816113b4565b81146114a157600080fd5b50565b6114ad816113be565b81146114b857600080fd5b50565b6114c4816113c8565b81146114cf57600080fd5b50565b6114db816113f2565b81146114e657600080fd5b5056fea26469706673582212202974f5b562f2cc23ef2ad2621369566f74577a19164a046c1ad242903fc28dbc64736f6c63430008060033";

type BuyLogicConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: BuyLogicConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class BuyLogic__factory extends ContractFactory {
  constructor(...args: BuyLogicConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<BuyLogic> {
    return super.deploy(overrides || {}) as Promise<BuyLogic>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): BuyLogic {
    return super.attach(address) as BuyLogic;
  }
  override connect(signer: Signer): BuyLogic__factory {
    return super.connect(signer) as BuyLogic__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BuyLogicInterface {
    return new utils.Interface(_abi) as BuyLogicInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BuyLogic {
    return new Contract(address, _abi, signerOrProvider) as BuyLogic;
  }
}
