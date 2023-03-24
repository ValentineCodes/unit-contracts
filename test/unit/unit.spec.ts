import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { DAI, ListLogic, MyNFT, Unit } from "../../typechain";

import { ZERO_ADDRESS } from "../../helpers/constants";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Unit", async () => {
      const ONE_ETH = ethers.utils.parseEther("1");
      // Contracts
      let unit: Unit;
      let myNFT: MyNFT;
      let dai: DAI;
      let listLogic: ListLogic;

      // Signers
      let mocksDeployer: SignerWithAddress;
      let user_1: SignerWithAddress;

      beforeEach(async () => {
        const signers = await ethers.getSigners();
        mocksDeployer = signers[1];
        user_1 = signers[2];

        await deployments.fixture(["mocks", "unit"]);

        // contracts
        unit = await ethers.getContract("Unit", mocksDeployer);
        myNFT = await ethers.getContract("MyNFT", mocksDeployer);
        dai = await ethers.getContract("DAI", mocksDeployer);

        // libraries
        listLogic = await ethers.getContract("ListLogic");
      });

      const listItem = async (
        nft: string,
        tokenId: number,
        amount: BigNumber,
        deadline: number
      ) => {
        await myNFT.approve(unit.address, tokenId);
        await unit.listItem(nft, tokenId, amount, deadline);
      };

      const createOffer = async (
        nft: string,
        tokenId: number,
        token: string,
        amount: BigNumber,
        deadline: number
      ) => {
        await dai.approve(unit.address, amount);
        await unit.createOffer(nft, tokenId, token, amount, deadline);
      };

      const getBlockTimestamp = async () => {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        return block.timestamp;
      };

      describe("getListing", () => {
        it("retrieves item listing", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          const listing = await unit.getListing(myNFT.address, 0);

          expect(listing.seller).to.eq(mocksDeployer.address);
        });
      });
      describe("getEarnings", () => {
        it("retrieves earnings", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await unit
            .connect(user_1)
            .buyItem(myNFT.address, 0, { value: ONE_ETH });

          const earnings: BigNumber = await unit.getEarnings(
            mocksDeployer.address,
            ZERO_ADDRESS
          );
          const expectedEarnings: BigNumber = ethers.utils
            .parseEther("1")
            .mul(99)
            .div(100); // with 1% fee off

          expect(earnings).to.eq(expectedEarnings);
        });
      });
      describe("getOffer", () => {
        it("retrieves user offer", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);

          const offerAmount = ethers.utils.parseEther("1000");
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 6000);

          const offer = await unit.getOffer(
            mocksDeployer.address,
            myNFT.address,
            0
          );

          expect(offer.amount).to.eq(offerAmount);
          expect(offer.token).to.eq(dai.address);
        });
      });
      describe("listItem", () => {
        it("reverts if item is already listed", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.listItem(myNFT.address, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__ItemListed");
        });
        it("reverts if nft address is ZERO ADDRESS", async () => {
          await expect(
            unit.listItem(ZERO_ADDRESS, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__ZeroAddress");
        });
        it("reverts if caller is not nft owner", async () => {
          await expect(
            unit.connect(user_1).listItem(myNFT.address, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__NotOwner");
        });
        it("reverts if Unit is not approved to spend NFT", async () => {
          await expect(
            unit
              .connect(mocksDeployer)
              .listItem(myNFT.address, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__NotApprovedToSpendNFT");
        });
        it("reverts if price is zero", async () => {
          await myNFT.approve(unit.address, 0);
          await expect(
            unit.listItem(myNFT.address, 0, ethers.utils.parseEther("0"), 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__InsufficientAmount");
        });
        it("stores item", async () => {
          await myNFT.approve(unit.address, 0);
          await unit.listItem(myNFT.address, 0, ONE_ETH, 3600);

          const blockTimestamp: number = await getBlockTimestamp();

          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.seller).to.eq(mocksDeployer.address);
          expect(listing.nft).to.eq(myNFT.address);
          expect(listing.tokenId).to.eq(0);
          expect(listing.token).to.eq(ZERO_ADDRESS);
          expect(listing.price).to.eq(ONE_ETH);
          expect(listing.auction).to.eq(false);
          expect(listing.deadline.toString()).to.eq(
            (blockTimestamp + 3600).toString()
          );
        });
        it("emits an event", async () => {
          await myNFT.approve(unit.address, 0);
          await expect(unit.listItem(myNFT.address, 0, ONE_ETH, 3600))
            .to.emit(unit, "ItemListed")
            .withArgs(
              mocksDeployer.address,
              myNFT.address,
              0,
              ZERO_ADDRESS,
              ONE_ETH,
              false,
              async (deadline: BigNumber) => {
                const blockTimestamp: number = await getBlockTimestamp();

                return (
                  (blockTimestamp + 3600).toString() === deadline.toString()
                );
              }
            );
        });
      });
      describe("listItemWithToken", () => {
        it("reverts if token is zero address", async () => {
          await expect(
            unit.listItemWithToken(
              myNFT.address,
              0,
              ZERO_ADDRESS,
              ONE_ETH,
              true,
              3600
            )
          ).to.be.revertedWithCustomError(unit, "Unit__ZeroAddress");
        });
        it("stores item", async () => {
          await myNFT.approve(unit.address, 0);
          await unit.listItemWithToken(
            myNFT.address,
            0,
            dai.address,
            ONE_ETH,
            true,
            3600
          );

          const blockTimestamp: number = await getBlockTimestamp();

          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.seller).to.eq(mocksDeployer.address);
          expect(listing.nft).to.eq(myNFT.address);
          expect(listing.tokenId).to.eq(0);
          expect(listing.token).to.eq(dai.address);
          expect(listing.price).to.eq(ONE_ETH);
          expect(listing.auction).to.eq(true);
          expect(listing.deadline.toString()).to.eq(
            (blockTimestamp + 3600).toString()
          );
        });
        it("emits an event", async () => {
          await myNFT.approve(unit.address, 0);
          await expect(
            unit.listItemWithToken(
              myNFT.address,
              0,
              dai.address,
              ONE_ETH,
              true,
              3600
            )
          )
            .to.emit(unit, "ItemListed")
            .withArgs(
              mocksDeployer.address,
              myNFT.address,
              0,
              dai.address,
              ONE_ETH,
              true,
              async (deadline: BigNumber) => {
                const blockTimestamp: number = await getBlockTimestamp();

                return (
                  deadline.toString() === (blockTimestamp + 3600).toString()
                );
              }
            );
        });
      });
      describe("unlistItem", () => {
        beforeEach(async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
        });

        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(user_1).unlistItem(myNFT.address, 0)
          ).to.be.revertedWithCustomError(unit, "Unit__NotOwner");
        });
        it("removes item", async () => {
          await unit.unlistItem(myNFT.address, 0);
          const listing = await unit.getListing(myNFT.address, 0);

          expect(listing.price.toString()).to.eq("0");
        });
        it("emits an event", async () => {
          await expect(unit.unlistItem(myNFT.address, 0))
            .to.emit(unit, "ItemUnlisted")
            .withArgs(mocksDeployer.address, myNFT.address, 0);
        });
      });
      describe("updateItemSeller", () => {
        it("reverts if new seller is not item owner", async () => {
          await expect(
            unit.updateItemSeller(myNFT.address, 0, user_1.address)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.updateItemSeller(myNFT.address, 0, mocksDeployer.address)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if new seller is old seller", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.updateItemSeller(myNFT.address, 0, mocksDeployer.address)
          ).to.revertedWithCustomError(unit, "Unit__NoUpdateRequired");
        });

        it("updates seller", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await myNFT.transferFrom(mocksDeployer.address, user_1.address, 0);
          await unit.updateItemSeller(myNFT.address, 0, user_1.address);

          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.seller).to.eq(user_1.address);
        });

        it("emits an event", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await myNFT.transferFrom(mocksDeployer.address, user_1.address, 0);
          await expect(unit.updateItemSeller(myNFT.address, 0, user_1.address))
            .to.emit(unit, "ItemSellerUpdated")
            .withArgs(myNFT.address, 0, mocksDeployer.address, user_1.address);
        });
      });

      describe("updateItemPrice", () => {
        const newPrice = ethers.utils.parseEther("1.5");
        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(user_1).updateItemPrice(myNFT.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.updateItemPrice(myNFT.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if price is zero", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.updateItemPrice(myNFT.address, 0, 0)
          ).to.revertedWithCustomError(unit, "Unit__InsufficientAmount");
        });

        it("reverts if new price is old price", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.updateItemPrice(myNFT.address, 0, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__NoUpdateRequired");
        });

        it("updates price", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await unit.updateItemPrice(myNFT.address, 0, newPrice);
          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.price).to.eq(newPrice);
        });

        it("emits an event", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(unit.updateItemPrice(myNFT.address, 0, newPrice))
            .to.emit(unit, "ItemPriceUpdated")
            .withArgs(myNFT.address, 0, ZERO_ADDRESS, ONE_ETH, newPrice);
        });
      });

      describe("extendItemDeadline", () => {
        const extraTime = 1200;
        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(user_1).extendItemDeadline(myNFT.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.extendItemDeadline(myNFT.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if new deadline is now or before", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);

          const blockTimestamp: number = await getBlockTimestamp();

          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 7200,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit.extendItemDeadline(myNFT.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__InvalidDeadline");
        });
      });

      describe("enableAuction", async () => {
        const newPrice: BigNumber = ethers.utils.parseEther("2.5");
        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(user_1).enableAuction(myNFT.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.enableAuction(myNFT.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("sets newPrice as starting price if specified and enables auction", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await unit.enableAuction(myNFT.address, 0, newPrice);

          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.price).to.eq(newPrice);
          expect(listing.auction).to.eq(true);
        });

        it("emits an event", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(unit.enableAuction(myNFT.address, 0, newPrice))
            .to.emit(unit, "ItemAuctionEnabled")
            .withArgs(myNFT.address, 0, newPrice);
        });
      });

      describe("disableAuction", () => {
        const newPrice: BigNumber = ethers.utils.parseEther("2.5");
        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(user_1).disableAuction(myNFT.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.disableAuction(myNFT.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("sets newPrice as fixed price if specified and disables auction", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await unit.disableAuction(myNFT.address, 0, newPrice);

          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.price).to.eq(newPrice);
          expect(listing.auction).to.eq(false);
        });

        it("emits an event", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(unit.disableAuction(myNFT.address, 0, newPrice))
            .to.emit(unit, "ItemAuctionDisabled")
            .withArgs(myNFT.address, 0, newPrice);
        });
      });

      describe("createOffer", () => {
        it("");
      });
    });
