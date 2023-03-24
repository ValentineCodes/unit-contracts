import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { DAI, ListLogic, MyNFT, Unit } from "../../typechain";

import { ZERO_ADDRESS } from "../../helpers/constants";
import { DataTypes } from "../../typechain/contracts/Unit";

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
      ): Promise<BigNumber> => {
        await listItem(myNFT.address, 0, ONE_ETH, 3600);
        const blockTimestamp = await getBlockTimestamp();
        const listingDeadline = BigNumber.from(blockTimestamp + 3600);

        await dai.transfer(user_1.address, amount);
        await dai.connect(user_1).approve(unit.address, amount);
        await unit
          .connect(user_1)
          .createOffer(nft, tokenId, token, amount, deadline);

        return listingDeadline;
      };

      const getBlockTimestamp = async (): Promise<number> => {
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
          // await listItem(myNFT.address, 0, ONE_ETH, 3600);

          const offerAmount: BigNumber = ethers.utils.parseEther("1000");
          const listingDeadline: BigNumber = await createOffer(
            myNFT.address,
            0,
            dai.address,
            offerAmount,
            6000
          );

          const offer: DataTypes.OfferStructOutput = await unit.getOffer(
            user_1.address,
            myNFT.address,
            0
          );

          expect(offer.amount).to.eq(offerAmount);
          expect(offer.token).to.eq(dai.address);
          expect(offer.deadline).to.eq(listingDeadline);
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
          await unit.enableAuction(myNFT.address, 0, newPrice);
          await unit.disableAuction(myNFT.address, 0, newPrice);

          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.price).to.eq(newPrice);
          expect(listing.auction).to.eq(false);
        });

        it("emits an event", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await unit.enableAuction(myNFT.address, 0, newPrice);
          await expect(unit.disableAuction(myNFT.address, 0, newPrice))
            .to.emit(unit, "ItemAuctionDisabled")
            .withArgs(myNFT.address, 0, newPrice);
        });
      });

      const offerAmount = ethers.utils.parseEther("0.8");
      describe("createOffer", () => {
        it("reverts if item is not listed", async () => {
          await expect(
            unit.createOffer(myNFT.address, 0, dai.address, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if token is zero address", async () => {
          await expect(
            unit.createOffer(myNFT.address, 0, ZERO_ADDRESS, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__ZeroAddress");
        });

        it("reverts if amount is zero", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.createOffer(myNFT.address, 0, dai.address, 0, 0)
          ).to.revertedWithCustomError(unit, "Unit__InsufficientAmount");
        });

        it("reverts if caller has pending offer", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 0);
          await expect(
            unit
              .connect(user_1)
              .createOffer(myNFT.address, 0, dai.address, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__PendingOffer");
        });

        it("reverts if Unit is not approved to spend tokens", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.createOffer(myNFT.address, 0, dai.address, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__NotApprovedToSpendToken");
        });

        it("stores offer", async () => {
          const listingDeadline: BigNumber = await createOffer(
            myNFT.address,
            0,
            dai.address,
            offerAmount,
            0
          );

          const offer: DataTypes.OfferStructOutput = await unit.getOffer(
            user_1.address,
            myNFT.address,
            0
          );

          expect(offer.token).to.eq(dai.address);
          expect(offer.amount).to.eq(offerAmount);
          expect(offer.deadline).to.eq(listingDeadline);
        });

        it("increases listing deadline by an hour", async () => {
          const listingDeadline: BigNumber = await createOffer(
            myNFT.address,
            0,
            dai.address,
            offerAmount,
            0
          );

          const listing = await unit.getListing(myNFT.address, 0);
          expect(listing.deadline).to.eq(listingDeadline.add(3600));
        });

        it("emits an event", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          const blockTimestamp = await getBlockTimestamp();
          const listingDeadline: BigNumber = BigNumber.from(
            blockTimestamp + 3600
          );

          await dai.approve(unit.address, offerAmount);

          await expect(
            unit.createOffer(myNFT.address, 0, dai.address, offerAmount, 0)
          )
            .to.emit(unit, "OfferCreated")
            .withArgs(
              mocksDeployer.address,
              myNFT.address,
              0,
              dai.address,
              offerAmount,
              listingDeadline
            );
        });
      });

      describe("acceptOffer", () => {
        it("reverts if caller is not item owner", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 0);
          await expect(
            unit.connect(user_1).acceptOffer(user_1.address, myNFT.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.acceptOffer(user_1.address, myNFT.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if offer does not exist", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.acceptOffer(user_1.address, myNFT.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__OfferDoesNotExist");
        });

        it("reverts if offer has expired", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);
          const blockTimestamp: number = await getBlockTimestamp();
          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 1200,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit.acceptOffer(user_1.address, myNFT.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__OfferExpired");
        });

        it("deletes listing, transfers nft to offer owner, transfers offer to Unit, records earnings and fees", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);

          const prevUnitDaiBal: BigNumber = await dai.balanceOf(unit.address);
          const prevUnitFees: BigNumber = await unit.getFees(dai.address);
          const prevSellerEarnings: BigNumber = await unit.getEarnings(
            mocksDeployer.address,
            dai.address
          );

          await unit.acceptOffer(user_1.address, myNFT.address, 0);

          const listing: DataTypes.ListingStructOutput = await unit.getListing(
            myNFT.address,
            0
          );
          const currentUnitDaiBal: BigNumber = await dai.balanceOf(
            unit.address
          );
          const currentUnitFees: BigNumber = await unit.getFees(dai.address);
          const currentSellerEarnings: BigNumber = await unit.getEarnings(
            mocksDeployer.address,
            dai.address
          );

          expect(listing.price).to.eq(0);
          expect(await myNFT.ownerOf(0)).to.eq(user_1.address);
          expect(currentUnitDaiBal).to.eq(prevUnitDaiBal.add(offerAmount));
          expect(currentUnitFees).to.eq(prevUnitFees.add(offerAmount.div(100)));
          expect(currentSellerEarnings).to.eq(
            prevSellerEarnings.add(offerAmount.mul(99).div(100))
          );
        });

        it("emits an event", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);

          await expect(unit.acceptOffer(user_1.address, myNFT.address, 0))
            .to.emit(unit, "OfferAccepted")
            .withArgs(
              user_1.address,
              myNFT.address,
              0,
              dai.address,
              offerAmount
            );
        });
      });

      describe("extendOfferDeadline", async () => {
        const extraTime = 1200;

        it("reverts if item is not listed", async () => {
          await expect(
            unit
              .connect(user_1)
              .extendOfferDeadline(myNFT.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if offer does not exist", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit
              .connect(user_1)
              .extendOfferDeadline(myNFT.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__OfferDoesNotExist");
        });

        it("reverts if new deadline is now or before", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);
          const blockTimestamp: number = await getBlockTimestamp();
          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 7200,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit
              .connect(user_1)
              .extendOfferDeadline(myNFT.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__InvalidDeadline");
        });

        it("updates deadline", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);
          const oldDeadline: BigNumber = (
            await unit.getOffer(user_1.address, myNFT.address, 0)
          ).deadline;

          await unit
            .connect(user_1)
            .extendOfferDeadline(myNFT.address, 0, extraTime);
          const newDeadline: BigNumber = (
            await unit.getOffer(user_1.address, myNFT.address, 0)
          ).deadline;

          expect(newDeadline).to.eq(oldDeadline.add(extraTime));
        });

        it("emits an event", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);
          const oldDeadline: BigNumber = (
            await unit.getOffer(user_1.address, myNFT.address, 0)
          ).deadline;

          await expect(
            unit
              .connect(user_1)
              .extendOfferDeadline(myNFT.address, 0, extraTime)
          )
            .to.emit(unit, "OfferDeadlineExtended")
            .withArgs(
              user_1.address,
              myNFT.address,
              0,
              oldDeadline,
              oldDeadline.add(extraTime)
            );
        });
      });

      describe("removeOffer", () => {
        it("reverts if item is not listed", async () => {
          await expect(
            unit.connect(user_1).removeOffer(myNFT.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if offer does not exist", async () => {
          await listItem(myNFT.address, 0, ONE_ETH, 3600);
          await expect(
            unit.connect(user_1).removeOffer(myNFT.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__OfferDoesNotExist");
        });

        it("deletes offer", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);
          await unit.connect(user_1).removeOffer(myNFT.address, 0);

          const offer: DataTypes.OfferStructOutput = await unit.getOffer(
            user_1.address,
            myNFT.address,
            0
          );

          expect(offer.amount).to.eq(0);
        });

        it("emits an event", async () => {
          await createOffer(myNFT.address, 0, dai.address, offerAmount, 1200);

          await expect(unit.connect(user_1).removeOffer(myNFT.address, 0))
            .to.emit(unit, "OfferRemoved")
            .withArgs(myNFT.address, 0, user_1.address);
        });
      });
    });
