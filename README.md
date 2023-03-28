# 🌛Unit - NFT Marketplace🌜

[Unit](https://sepolia.etherscan.io/address/0x8D211af7002b66D3859565cfca77405c49bD672b) is a Decentralized NFT Marketplace. It allows NFT owners to list their NFTs for a fixed price or put them up for auction. A seller can also toggle between fixed price listing and auction at any time.

## How it works

NFTs can be listed for sale at fixed prices with ETH or ERC20 tokens. Auctioned items are listed with tokens. To avoid keeping offers in the contract, Offers are only allowed with tokens due to the approve pattern which isn't yet possible with ETH and can only be accepted by the item seller within the specified deadline.
Items listed at fixed prices can be bought before the specified deadline. After an item is bought or an offer is accepted, Unit keeps track of the earnings and fees which can be withdrawn at any time.

# Local Development

#### Install dependencies:

```shell
yarn
```

#### Run unit tests:

```shell
yarn test
```

#### Deploy to several networks

`Note: Signer, RPC URL and ETHERSCAN API KEY must be provided as environment variables`

```shell
yarn deploy:sepolia
```

```shell
yarn deploy:mainnet
```
