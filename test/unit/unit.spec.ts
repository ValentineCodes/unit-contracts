import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { DAI, MyNFT, Unit } from "../../typechain";

import { ZERO_ADDRESS, ETH_ADDRESS } from "../../utils/constants";
import { formatDate, formatCurrency } from "../../utils/helperFunctions";
import { DataTypes } from "../../typechain/contracts/Unit";

// !developmentChains.includes(network.name)
network.name !== "hardhat"
  ? describe.skip
  : describe(`Unit: NFT Marketplace`, async () => {
      const ONE_ETH = ethers.utils.parseEther("1");
      // Contracts
      let unit: Unit;
      let ogre: MyNFT;
      let dai: DAI;

      // Testers / Signers
      let Valentine: SignerWithAddress;
      let Ugochukwu: SignerWithAddress;
      let Orga: SignerWithAddress;

      beforeEach(async () => {
        const signers: SignerWithAddress[] = await ethers.getSigners();

        // Testers / Signers
        Valentine = signers[0];
        Ugochukwu = signers[1];
        Orga = signers[2];

        // Deploy contracts
        await deployments.fixture(["mocks", "unit"]);

        // contracts
        unit = await ethers.getContract("Unit", Ugochukwu);
        ogre = await ethers.getContract("MyNFT", Ugochukwu);
        dai = await ethers.getContract("DAI", Ugochukwu);
      });

      /** Helper functions */

      // List item - ETH price only
      const listItem = async (
        nft: string,
        tokenId: number,
        amount: BigNumber,
        deadline: number
      ) => {
        // Approve Unit to spend token
        await ogre.approve(unit.address, tokenId);
        await unit.listItem(nft, tokenId, amount, deadline);
      };

      // List item - Token price only
      const listItemWithToken = async (
        nft: string,
        tokenId: number,
        token: string,
        amount: BigNumber,
        auction: boolean,
        deadline: number
      ) => {
        // Approve Unit to spend token
        await ogre.approve(unit.address, tokenId);
        await unit.listItemWithToken(
          nft,
          tokenId,
          token,
          amount,
          auction,
          deadline
        );
      };

      // Program flow to create an offer
      const createOffer = async (
        nft: string,
        tokenId: number,
        token: string,
        amount: BigNumber,
        deadline: number
      ): Promise<BigNumber> => {
        await listItem(ogre.address, 0, ONE_ETH, 3600);

        const blockTimestamp = await getBlockTimestamp();
        const listingDeadline = BigNumber.from(blockTimestamp + 3600);

        await dai.transfer(Orga.address, amount);
        await dai.connect(Orga).approve(unit.address, amount);

        await unit
          .connect(Orga)
          .createOffer(nft, tokenId, token, amount, deadline);

        return listingDeadline;
      };

      // Program flow to Buy items listed with token price
      const buyItemWithToken = async () => {
        await listItemWithToken(
          ogre.address,
          0,
          dai.address,
          ONE_ETH,
          false,
          3600
        );

        await dai.transfer(Orga.address, ONE_ETH);
        await dai.connect(Orga).approve(unit.address, ONE_ETH);
        await unit
          .connect(Orga)
          .buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH);
      };

      const getBlockTimestamp = async (): Promise<number> => {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        return block.timestamp;
      };

      /**
       * @test
       */
      describe("💬listItem", () => {
        it("lists item", async () => {
          console.log("Approving Unit to spend OGRE🐸...");
          await ogre.approve(unit.address, 0);
          console.log("Approved✅");
          console.log("-------------------------------");

          const item = {
            nft: ogre.address,
            tokenId: 0,
            price: ONE_ETH,
            deadline: 3600,
          };
          console.log("Listing item...");
          console.log("Params: ", {
            ...item,
            price: formatCurrency(item.price, "ETH🔷"),
            deadline: item.deadline + " seconds",
          });
          await unit.listItem(
            item.nft,
            item.tokenId,
            item.price,
            item.deadline
          );

          const blockTimestamp: number = await getBlockTimestamp();

          const listing: DataTypes.ListingStructOutput = await unit.getListing(
            ogre.address,
            0
          );
          console.log("------------------------------------");
          console.log("Item listed✅");
          console.log({
            seller: listing.seller,
            nft: listing.nft,
            tokenId: 0,
            token: listing.token,
            price: formatCurrency(listing.price, "ETH🔷"),
            auction: listing.auction,
            deadline: formatDate(listing.deadline.toNumber()),
          });

          expect(listing.seller).to.eq(Ugochukwu.address);
          expect(listing.nft).to.eq(ogre.address);
          expect(listing.tokenId).to.eq(0);
          expect(listing.token).to.eq(ETH_ADDRESS);
          expect(listing.price).to.eq(ONE_ETH);
          expect(listing.auction).to.eq(false);
          expect(listing.deadline.toString()).to.eq(
            (blockTimestamp + 3600).toString()
          );
        });
        it("emits an event", async () => {
          await ogre.approve(unit.address, 0);
          await expect(unit.listItem(ogre.address, 0, ONE_ETH, 3600))
            .to.emit(unit, "ItemListed")
            .withArgs(
              Ugochukwu.address,
              ogre.address,
              0,
              ETH_ADDRESS,
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
        it("reverts if item is already listed", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.listItem(ogre.address, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__ItemListed");
        });
        it("reverts if nft address is ZERO ADDRESS", async () => {
          await expect(
            unit.listItem(ZERO_ADDRESS, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__ZeroAddress");
        });
        it("reverts if caller is not nft owner", async () => {
          await expect(
            unit.connect(Orga).listItem(ogre.address, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__NotOwner");
        });
        it("reverts if Unit is not approved to spend NFT", async () => {
          await expect(
            unit.connect(Ugochukwu).listItem(ogre.address, 0, ONE_ETH, 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__NotApprovedToSpendNFT");
        });
        it("reverts if price is zero", async () => {
          await ogre.approve(unit.address, 0);
          await expect(
            unit.listItem(ogre.address, 0, ethers.utils.parseEther("0"), 3600)
          ).to.be.revertedWithCustomError(unit, "Unit__InsufficientAmount");
        });
      });

      /**
       * @test
       */
      describe("💬listItemWithToken", () => {
        it("lists item", async () => {
          console.log("Approving Unit to spend OGRE🐸...");
          await ogre.approve(unit.address, 0);
          console.log("Approved✅");
          console.log("---------------------------------");
          const item = {
            nft: ogre.address,
            tokenId: 0,
            token: dai.address,
            price: ONE_ETH,
            auction: true,
            deadline: 3600,
          };
          console.log("Listing item...");
          console.log("Params: ", {
            ...item,
            token: item.token,
            price: formatCurrency(item.price, "DAI🔶"),
            deadline: item.deadline + " seconds",
          });
          await unit.listItemWithToken(
            item.nft,
            item.tokenId,
            item.token,
            item.price,
            item.auction,
            item.deadline
          );
          console.log("------------------------------------");
          console.log("Item listed✅");

          const blockTimestamp: number = await getBlockTimestamp();

          const listing = await unit.getListing(ogre.address, 0);
          console.log({
            seller: listing.seller,
            nft: listing.nft,
            tokenId: 0,
            token: listing.token,
            price: formatCurrency(listing.price, "DAI🔶"),
            auction: listing.auction,
            deadline: formatDate(listing.deadline.toNumber()),
          });

          expect(listing.seller).to.eq(Ugochukwu.address);
          expect(listing.nft).to.eq(ogre.address);
          expect(listing.tokenId).to.eq(0);
          expect(listing.token).to.eq(dai.address);
          expect(listing.price).to.eq(ONE_ETH);
          expect(listing.auction).to.eq(true);
          expect(listing.deadline.toString()).to.eq(
            (blockTimestamp + 3600).toString()
          );
        });
        it("emits an event", async () => {
          await ogre.approve(unit.address, 0);
          await expect(
            unit.listItemWithToken(
              ogre.address,
              0,
              dai.address,
              ONE_ETH,
              true,
              3600
            )
          )
            .to.emit(unit, "ItemListed")
            .withArgs(
              Ugochukwu.address,
              ogre.address,
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
        it("reverts if token is zero address", async () => {
          await expect(
            unit.listItemWithToken(
              ogre.address,
              0,
              ZERO_ADDRESS,
              ONE_ETH,
              true,
              3600
            )
          ).to.be.revertedWithCustomError(unit, "Unit__ZeroAddress");
        });
      });

      /**
       * @test
       */
      describe("💬unlistItem", () => {
        beforeEach(async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
        });

        it("removes item", async () => {
          await unit.unlistItem(ogre.address, 0);
          const listing = await unit.getListing(ogre.address, 0);

          expect(listing.price.toString()).to.eq("0");
        });
        it("emits an event", async () => {
          await expect(unit.unlistItem(ogre.address, 0))
            .to.emit(unit, "ItemUnlisted")
            .withArgs(Ugochukwu.address, ogre.address, 0);
        });

        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(Orga).unlistItem(ogre.address, 0)
          ).to.be.revertedWithCustomError(unit, "Unit__NotOwner");
        });
      });

      /**
       * @test
       */
      describe("💬updateItemSeller", () => {
        it("updates seller", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          console.log("Prev seller: ", Ugochukwu.address);

          console.log("Transfering OGRE to", Orga.address);
          await ogre.transferFrom(Ugochukwu.address, Orga.address, 0);

          console.log("Approving Unit to spend Ogre🐸...");
          await ogre.connect(Orga).approve(unit.address, 0);

          console.log("Updating seller...");
          await unit.updateItemSeller(ogre.address, 0, Orga.address);

          const listing = await unit.getListing(ogre.address, 0);
          console.log("New seller: ", listing.seller);

          expect(listing.seller).to.eq(Orga.address);
        });

        it("emits an event", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await ogre.transferFrom(Ugochukwu.address, Orga.address, 0);
          await ogre.connect(Orga).approve(unit.address, 0);
          await expect(unit.updateItemSeller(ogre.address, 0, Orga.address))
            .to.emit(unit, "ItemSellerUpdated")
            .withArgs(ogre.address, 0, Ugochukwu.address, Orga.address);
        });
        it("reverts if new seller is not item owner", async () => {
          await expect(
            unit.updateItemSeller(ogre.address, 0, Orga.address)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.updateItemSeller(ogre.address, 0, Ugochukwu.address)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if new seller is old seller", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.updateItemSeller(ogre.address, 0, Ugochukwu.address)
          ).to.revertedWithCustomError(unit, "Unit__NoUpdateRequired");
        });
      });

      /**
       * @test
       */
      describe("💬updateItemPrice", () => {
        const newPrice = ethers.utils.parseEther("1.5");

        it("updates price", async () => {
          console.log(
            "Prev price: ",
            ethers.utils.formatEther(ONE_ETH),
            "ETH🔷"
          );
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          console.log(
            "Updating price to ",
            ethers.utils.formatEther(newPrice),
            "ETH🔷"
          );
          await unit.updateItemPrice(ogre.address, 0, newPrice);

          const listing = await unit.getListing(ogre.address, 0);
          console.log(
            "New price: ",
            ethers.utils.formatEther(newPrice),
            "ETH🔷"
          );

          expect(listing.price).to.eq(newPrice);
        });

        it("emits an event", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(unit.updateItemPrice(ogre.address, 0, newPrice))
            .to.emit(unit, "ItemPriceUpdated")
            .withArgs(ogre.address, 0, ETH_ADDRESS, ONE_ETH, newPrice);
        });
        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(Orga).updateItemPrice(ogre.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.updateItemPrice(ogre.address, 0, newPrice)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if price is zero", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.updateItemPrice(ogre.address, 0, 0)
          ).to.revertedWithCustomError(unit, "Unit__InsufficientAmount");
        });

        it("reverts if new price is old price", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.updateItemPrice(ogre.address, 0, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__NoUpdateRequired");
        });
      });

      /**
       * @test
       */
      describe("💬extendItemDeadline", () => {
        const extraTime = 1200;
        it("extends deadline", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          const listingA = await unit.getListing(ogre.address, 0);
          console.log(
            "Prev deadline: ",
            formatDate(listingA.deadline.toNumber())
          );

          const newDeadline = listingA.deadline.add(extraTime).toString();
          console.log("Extending deadline by ", extraTime, "seconds");

          await unit.extendItemDeadline(ogre.address, 0, extraTime);

          const listingB = await unit.getListing(ogre.address, 0);
          console.log(
            "New deadline: ",
            formatDate(listingB.deadline.toNumber())
          );

          expect(listingB.deadline.toString()).to.eq(newDeadline);
        });
        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(Orga).extendItemDeadline(ogre.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.extendItemDeadline(ogre.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if new deadline is now or before", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          const blockTimestamp: number = await getBlockTimestamp();

          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 7200,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit.extendItemDeadline(ogre.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__InvalidDeadline");
        });
      });

      /**
       * @test
       */
      describe("💬enableAuction", async () => {
        const startingPrice: BigNumber = ethers.utils.parseEther("1.5");

        it("sets item price as starting price if specified and enables auction", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );
          await unit.enableAuction(ogre.address, 0, startingPrice);

          const listing = await unit.getListing(ogre.address, 0);
          expect(listing.price).to.eq(startingPrice);
          expect(listing.auction).to.eq(true);
        });

        it("only enables auction on items listed with token price", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          await expect(
            unit.enableAuction(ogre.address, 0, startingPrice)
          ).to.revertedWithCustomError(unit, "Unit__ItemPriceInEth");
        });

        it("emits an event", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );
          await expect(unit.enableAuction(ogre.address, 0, startingPrice))
            .to.emit(unit, "ItemAuctionEnabled")
            .withArgs(ogre.address, 0, startingPrice);
        });

        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(Orga).enableAuction(ogre.address, 0, startingPrice)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.enableAuction(ogre.address, 0, startingPrice)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });
      });

      /**
       * @test
       */
      describe("💬disableAuction", () => {
        const fixedPrice: BigNumber = ethers.utils.parseEther("2.5");

        it("sets item price as fixed price if specified and disables auction", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            true,
            3600
          );
          await unit.disableAuction(ogre.address, 0, fixedPrice);

          const listing = await unit.getListing(ogre.address, 0);
          expect(listing.price).to.eq(fixedPrice);
          expect(listing.auction).to.eq(false);
        });

        it("emits an event", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            true,
            3600
          );
          await expect(unit.disableAuction(ogre.address, 0, fixedPrice))
            .to.emit(unit, "ItemAuctionDisabled")
            .withArgs(ogre.address, 0, fixedPrice);
        });
        it("reverts if caller is not item owner", async () => {
          await expect(
            unit.connect(Orga).disableAuction(ogre.address, 0, fixedPrice)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.disableAuction(ogre.address, 0, fixedPrice)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });
      });

      /**
       * @test
       */
      const offerAmount = ethers.utils.parseEther("0.8");
      describe("💬createOffer", () => {
        it("creates offer", async () => {
          console.log("Item listed✅");
          console.log("Approving Unit to spend tokens...");
          console.log("Creating offer with Dai token...");
          const listingDeadline: BigNumber = await createOffer(
            ogre.address,
            0,
            dai.address,
            offerAmount,
            0
          );
          console.log("Offer created✅");

          const offer: DataTypes.OfferStructOutput = await unit.getOffer(
            Orga.address,
            ogre.address,
            0
          );

          console.log("Offer: ", {
            token: offer.token,
            amount: formatCurrency(offer.amount, "DAI🔶"),
            deadline: formatDate(offer.deadline.toNumber()),
          });

          expect(offer.token).to.eq(dai.address);
          expect(offer.amount).to.eq(offerAmount);
          expect(offer.deadline).to.eq(listingDeadline);
        });

        it("increases listing deadline by an hour", async () => {
          const listingDeadline: BigNumber = await createOffer(
            ogre.address,
            0,
            dai.address,
            offerAmount,
            0
          );
          console.log(
            "Prev deadline: ",
            formatDate(listingDeadline.toNumber())
          );

          const listing = await unit.getListing(ogre.address, 0);

          console.log(
            "New deadline: ",
            formatDate(listingDeadline.add(3600).toNumber())
          );
          expect(listing.deadline).to.eq(listingDeadline.add(3600));
        });

        it("emits an event", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          const blockTimestamp = await getBlockTimestamp();
          const listingDeadline: BigNumber = BigNumber.from(
            blockTimestamp + 3600
          );

          await dai.transfer(Orga.address, offerAmount);
          await dai.connect(Orga).approve(unit.address, offerAmount);

          await expect(
            unit
              .connect(Orga)
              .createOffer(ogre.address, 0, dai.address, offerAmount, 0)
          )
            .to.emit(unit, "OfferCreated")
            .withArgs(
              Orga.address,
              ogre.address,
              0,
              dai.address,
              offerAmount,
              listingDeadline
            );
        });
        it("reverts if item is not listed", async () => {
          await expect(
            unit.createOffer(ogre.address, 0, dai.address, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if token is zero address", async () => {
          await expect(
            unit.createOffer(ogre.address, 0, ZERO_ADDRESS, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__ZeroAddress");
        });

        it("reverts if amount is zero", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.createOffer(ogre.address, 0, dai.address, 0, 0)
          ).to.revertedWithCustomError(unit, "Unit__InsufficientAmount");
        });

        it("reverts if caller has pending offer", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 0);
          await expect(
            unit
              .connect(Orga)
              .createOffer(ogre.address, 0, dai.address, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__PendingOffer");
        });

        it("reverts if caller is item owner", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          await dai.approve(unit.address, offerAmount);
          await expect(
            unit.createOffer(ogre.address, 0, dai.address, offerAmount, 0)
          ).to.revertedWithCustomError(
            unit,
            "Unit__CannotCreateOfferOnOwnItem"
          );
        });

        it("reverts if Unit is not approved to spend tokens", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          await dai.transfer(Orga.address, offerAmount);

          await expect(
            unit
              .connect(Orga)
              .createOffer(ogre.address, 0, dai.address, offerAmount, 0)
          ).to.revertedWithCustomError(unit, "Unit__NotApprovedToSpendToken");
        });
      });

      /**
       * @test
       */
      describe("💬acceptOffer", () => {
        it("deletes listing, transfers nft to offer owner, transfers offer to Unit, records earnings and fees", async () => {
          console.log("Offer created✅");
          console.log("Offer: ", {
            owner: Orga.address,
            amount: formatCurrency(offerAmount, "DAI🔶"),
          });
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);

          const prevUnitDaiBal: BigNumber = await dai.balanceOf(unit.address);
          const prevUnitFees: BigNumber = await unit.getFees(dai.address);
          const prevSellerEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            dai.address
          );
          const prevOgreOwner = await ogre.ownerOf(0);

          console.log("-----------------------------------------");
          console.log(
            "Prev Unit Fees: ",
            formatCurrency(prevUnitFees, "DAI🔶")
          );
          console.log(
            "Prev Seller Earnings: ",
            formatCurrency(prevSellerEarnings, "DAI🔶")
          );
          console.log("Prev Ogre Owner: ", prevOgreOwner);
          console.log("-----------------------------------------");
          await unit.acceptOffer(Orga.address, ogre.address, 0);
          console.log("Offer accepted✅");

          const listing: DataTypes.ListingStructOutput = await unit.getListing(
            ogre.address,
            0
          );
          const currentUnitDaiBal: BigNumber = await dai.balanceOf(
            unit.address
          );
          const currentUnitFees: BigNumber = await unit.getFees(dai.address);
          const currentSellerEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            dai.address
          );
          const currentOgreOwner = await ogre.ownerOf(0);

          console.log(
            "Current Unit Fees(1%): ",
            formatCurrency(currentUnitFees, "DAI🔶")
          );
          console.log(
            "Current Seller Earnings: ",
            formatCurrency(currentSellerEarnings, "DAI🔶")
          );
          console.log("Current Ogre Owner: ", currentOgreOwner);

          expect(listing.price).to.eq(0);
          expect(currentOgreOwner).to.eq(Orga.address);
          expect(currentUnitDaiBal).to.eq(prevUnitDaiBal.add(offerAmount));
          expect(currentUnitFees).to.eq(prevUnitFees.add(offerAmount.div(100)));
          expect(currentSellerEarnings).to.eq(
            prevSellerEarnings.add(offerAmount.mul(99).div(100))
          );
        });

        it("emits an event", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);

          await expect(unit.acceptOffer(Orga.address, ogre.address, 0))
            .to.emit(unit, "OfferAccepted")
            .withArgs(Orga.address, ogre.address, 0, dai.address, offerAmount);
        });
        it("reverts if caller is not item owner", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 0);
          await expect(
            unit.connect(Orga).acceptOffer(Orga.address, ogre.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__NotOwner");
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.acceptOffer(Orga.address, ogre.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if offer does not exist", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.acceptOffer(Orga.address, ogre.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__OfferDoesNotExist");
        });

        it("reverts if offer has expired", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);
          const blockTimestamp: number = await getBlockTimestamp();
          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 1200,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit.acceptOffer(Orga.address, ogre.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__OfferExpired");
        });
      });

      /**
       * @test
       */
      describe("💬extendOfferDeadline", async () => {
        const extraTime = 1200;

        it("extends deadline", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);
          const oldDeadline: BigNumber = (
            await unit.getOffer(Orga.address, ogre.address, 0)
          ).deadline;

          console.log("Prev deadline: ", formatDate(oldDeadline.toNumber()));

          console.log("Extending deadline by ", extraTime, "seconds");
          await unit
            .connect(Orga)
            .extendOfferDeadline(ogre.address, 0, extraTime);

          const newDeadline: BigNumber = (
            await unit.getOffer(Orga.address, ogre.address, 0)
          ).deadline;

          console.log("New deadline: ", formatDate(newDeadline.toNumber()));

          expect(newDeadline).to.eq(oldDeadline.add(extraTime));
        });

        it("emits an event", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);
          const oldDeadline: BigNumber = (
            await unit.getOffer(Orga.address, ogre.address, 0)
          ).deadline;

          await expect(
            unit.connect(Orga).extendOfferDeadline(ogre.address, 0, extraTime)
          )
            .to.emit(unit, "OfferDeadlineExtended")
            .withArgs(
              Orga.address,
              ogre.address,
              0,
              oldDeadline,
              oldDeadline.add(extraTime)
            );
        });
        it("reverts if item is not listed", async () => {
          await expect(
            unit.connect(Orga).extendOfferDeadline(ogre.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if offer does not exist", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.connect(Orga).extendOfferDeadline(ogre.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__OfferDoesNotExist");
        });

        it("reverts if new deadline is now or before", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);
          const blockTimestamp: number = await getBlockTimestamp();
          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 7200,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit.connect(Orga).extendOfferDeadline(ogre.address, 0, extraTime)
          ).to.revertedWithCustomError(unit, "Unit__InvalidDeadline");
        });
      });

      /**
       * @test
       */
      describe("💬removeOffer", () => {
        it("deletes offer", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);
          await unit.connect(Orga).removeOffer(ogre.address, 0);

          const offer: DataTypes.OfferStructOutput = await unit.getOffer(
            Orga.address,
            ogre.address,
            0
          );

          expect(offer.amount).to.eq(0);
        });

        it("emits an event", async () => {
          await createOffer(ogre.address, 0, dai.address, offerAmount, 1200);

          await expect(unit.connect(Orga).removeOffer(ogre.address, 0))
            .to.emit(unit, "OfferRemoved")
            .withArgs(ogre.address, 0, Orga.address);
        });
        it("reverts if item is not listed", async () => {
          await expect(
            unit.connect(Orga).removeOffer(ogre.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if offer does not exist", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.connect(Orga).removeOffer(ogre.address, 0)
          ).to.revertedWithCustomError(unit, "Unit__OfferDoesNotExist");
        });
      });

      /**
       * @test
       */
      describe("💬buyItem", () => {
        it("deletes listing, transfers nft to caller, records earnings and fees", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          console.log("Item listed✅");
          console.log("Item: ", {
            owner: Ugochukwu.address,
            amount: formatCurrency(ONE_ETH, "ETH🔷"),
          });
          console.log("-------------------------------------");

          const prevUnitFees: BigNumber = await unit.getFees(ETH_ADDRESS);
          const prevSellerEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            ETH_ADDRESS
          );

          console.log("Prev Ogre owner🐸: ", await ogre.ownerOf(0));
          console.log(
            "Prev Unit Fees: ",
            formatCurrency(prevUnitFees, "ETH🔷")
          );
          console.log(
            "Prev Seller Earnings: ",
            formatCurrency(prevSellerEarnings, "ETH🔷")
          );
          console.log("----------------------------------------");

          console.log("Buying item...");
          console.log("Buyer:", Orga.address);

          await unit.connect(Orga).buyItem(ogre.address, 0, {
            value: ONE_ETH,
          });

          console.log("-----------------------------------------");
          console.log("Item bought✅");

          const listing = await unit.getListing(ogre.address, 0);
          const currentUnitFees: BigNumber = await unit.getFees(ETH_ADDRESS);
          const currentSellerEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            ETH_ADDRESS
          );

          console.log("Current Ogre owner🐸: ", await ogre.ownerOf(0));
          console.log(
            "Current Unit Fees(1%): ",
            formatCurrency(currentUnitFees, "ETH🔷")
          );
          console.log(
            "Current Seller Earnings: ",
            formatCurrency(currentSellerEarnings, "ETH🔷")
          );

          expect(listing.price).to.eq(0);
          expect(await ogre.ownerOf(0)).to.eq(Orga.address);

          const expectedEarnings: BigNumber = ONE_ETH.mul(99).div(100); // with 1% fee off

          expect(currentSellerEarnings).to.eq(
            prevSellerEarnings.add(expectedEarnings)
          );
          expect(currentUnitFees).to.eq(prevUnitFees.add(ONE_ETH.div(100))); // 1% fee
        });

        it("emits an event", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.connect(Orga).buyItem(ogre.address, 0, {
              value: ONE_ETH,
            })
          )
            .to.emit(unit, "ItemBought")
            .withArgs(Orga.address, ogre.address, 0, ETH_ADDRESS, ONE_ETH);
        });

        it("reverts if item is not listed", async () => {
          await expect(
            unit.buyItem(ogre.address, 0, { value: ONE_ETH })
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if item is in auction", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            true,
            3600
          );
          await expect(
            unit.buyItem(ogre.address, 0, { value: ONE_ETH })
          ).to.revertedWithCustomError(unit, "Unit__ItemInAuction");
        });

        it("reverts if item price currency is not ETH🔷", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );
          await expect(
            unit.buyItem(ogre.address, 0, { value: ONE_ETH })
          ).to.revertedWithCustomError(unit, "Unit__ItemPriceInToken");
        });

        it("reverts if amount is not item price", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.buyItem(ogre.address, 0, {
              value: ethers.utils.parseEther("0.8"),
            })
          ).to.revertedWithCustomError(unit, "Unit__InvalidAmount");
        });

        it("reverts if listing has expired", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          const blockTimestamp: number = await getBlockTimestamp();
          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 3600,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit.buyItem(ogre.address, 0, {
              value: ONE_ETH,
            })
          ).to.revertedWithCustomError(unit, "Unit__ListingExpired");
        });

        it("reverts if buyer is seller", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.buyItem(ogre.address, 0, {
              value: ONE_ETH,
            })
          ).to.revertedWithCustomError(unit, "Unit__CannotBuyOwnNFT");
        });
      });

      /**
       * @test
       */
      describe("💬buyItemWithToken", () => {
        it("deletes listing, transfers nft to caller, transfers token to Unit, records earnings and fees", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );
          console.log("Item listed✅");
          console.log("Item: ", {
            owner: Ugochukwu.address,
            amount: formatCurrency(ONE_ETH, "DAI🔶"),
          });
          console.log("-------------------------------------");

          const prevUnitDaiBal: BigNumber = await dai.balanceOf(unit.address);
          const prevUnitFees: BigNumber = await unit.getFees(ETH_ADDRESS);
          const prevSellerEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            ETH_ADDRESS
          );

          console.log("Prev Ogre owner🐸: ", await ogre.ownerOf(0));
          console.log(
            "Prev Unit Fees: ",
            formatCurrency(prevUnitFees, "DAI🔶")
          );
          console.log(
            "Prev Seller Earnings: ",
            formatCurrency(prevSellerEarnings, "DAI🔶")
          );
          console.log("----------------------------------------");

          await dai.transfer(Orga.address, ONE_ETH);

          await dai.connect(Orga).approve(unit.address, ONE_ETH);

          console.log("Buying item...");
          console.log("Buyer:", Orga.address);

          await unit
            .connect(Orga)
            .buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH);

          console.log("-----------------------------------------");
          console.log("Item bought✅");

          const listing: DataTypes.ListingStructOutput = await unit.getListing(
            ogre.address,
            0
          );
          const currentUnitDaiBal: BigNumber = await dai.balanceOf(
            unit.address
          );
          const currentUnitFees: BigNumber = await unit.getFees(dai.address);
          const currentSellerEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            dai.address
          );

          console.log("Current Ogre owner🐸: ", await ogre.ownerOf(0));
          console.log(
            "Current Unit Fees(1%): ",
            formatCurrency(currentUnitFees, "DAI🔶")
          );
          console.log(
            "Current Seller Earnings: ",
            formatCurrency(currentSellerEarnings, "DAI🔶")
          );

          expect(listing.price).to.eq(0);
          expect(await ogre.ownerOf(0)).to.eq(Orga.address);
          expect(currentUnitDaiBal).to.eq(prevUnitDaiBal.add(ONE_ETH));

          const expectedEarnings: BigNumber = ONE_ETH.mul(99).div(100); // with 1% fee off

          expect(currentSellerEarnings).to.eq(
            prevSellerEarnings.add(expectedEarnings)
          );
          expect(currentUnitFees).to.eq(prevUnitFees.add(ONE_ETH.div(100))); // 1% fee
        });

        it("emits an event", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );

          await dai.transfer(Orga.address, ONE_ETH);

          await dai.connect(Orga).approve(unit.address, ONE_ETH);

          await expect(
            unit
              .connect(Orga)
              .buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH)
          )
            .to.emit(unit, "ItemBought")
            .withArgs(Orga.address, ogre.address, 0, dai.address, ONE_ETH);
        });
        it("reverts if item is not listed", async () => {
          await expect(
            unit.buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__ItemNotListed");
        });

        it("reverts if amount is not item price", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );
          await expect(
            unit.buyItemWithToken(
              ogre.address,
              0,
              dai.address,
              ethers.utils.parseEther("0.8")
            )
          ).to.revertedWithCustomError(unit, "Unit__InvalidAmount");
        });

        it("reverts if item is in auction", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            true,
            3600
          );
          await expect(
            unit.buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__ItemInAuction");
        });

        it("reverts if item price currency is not a token", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await expect(
            unit.buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__ItemPriceInEth");
        });

        it("reverts if listing has expired", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );

          const blockTimestamp: number = await getBlockTimestamp();
          await network.provider.send("evm_increaseTime", [
            blockTimestamp + 3600,
          ]);
          await network.provider.send("evm_mine");

          await expect(
            unit.buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__ListingExpired");
        });

        it("reverts if buyer is seller", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );
          await expect(
            unit.buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__CannotBuyOwnNFT");
        });

        it("reverts if Unit is not approved to spend tokens", async () => {
          await listItemWithToken(
            ogre.address,
            0,
            dai.address,
            ONE_ETH,
            false,
            3600
          );

          await expect(
            unit
              .connect(Orga)
              .buyItemWithToken(ogre.address, 0, dai.address, ONE_ETH)
          ).to.revertedWithCustomError(unit, "Unit__NotApprovedToSpendToken");
        });
      });

      /**
       * @test
       */
      describe("💬withdrawEarnings", () => {
        it("if earnings is ETH, deletes ETH earnings records and transfers ETH to caller", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          console.log("Ogre🐸 bought with ", formatCurrency(ONE_ETH, "ETH🔷"));
          await unit.connect(Orga).buyItem(ogre.address, 0, {
            value: ONE_ETH,
          });

          const earnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            ETH_ADDRESS
          );
          console.log("Earnings: ", formatCurrency(earnings, "ETH🔷"));

          const prevSellerBal: BigNumber = await Ugochukwu.getBalance();
          console.log("Prev Bal: ", formatCurrency(prevSellerBal, "ETH🔷"));
          console.log("--------------------------------------");

          await unit.withdrawEarnings(ETH_ADDRESS);
          console.log("Earnings withdrawn✅");

          const currentEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            ETH_ADDRESS
          );

          const currentSellerBal: BigNumber = await Ugochukwu.getBalance();
          console.log(
            "Current Bal: ",
            formatCurrency(currentSellerBal, "ETH🔷")
          );

          expect(currentEarnings).to.eq(0);
          expect(currentSellerBal).to.greaterThan(prevSellerBal);
        });

        it("if earnings is token, deletes token earnings records and transfers token to caller", async () => {
          console.log("Ogre🐸 bought with ", formatCurrency(ONE_ETH, "DAI🔶"));
          await buyItemWithToken();

          const earnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            dai.address
          );
          console.log("Earnings: ", formatCurrency(earnings, "DAI🔶"));

          const prevSellerBal: BigNumber = await dai.balanceOf(
            Ugochukwu.address
          );

          console.log("Prev Bal: ", formatCurrency(prevSellerBal, "DAI🔶"));
          console.log("------------------------------------------");

          await unit.withdrawEarnings(dai.address);
          console.log("Earnings withdrawn✅");

          const currentEarnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            dai.address
          );
          const currentSellerBal: BigNumber = await dai.balanceOf(
            Ugochukwu.address
          );

          console.log(
            "Current Bal: ",
            formatCurrency(currentSellerBal, "DAI🔶")
          );

          expect(currentEarnings).to.eq(0);
          expect(currentSellerBal).to.greaterThan(prevSellerBal);
        });

        it("emits an event", async () => {
          await buyItemWithToken();
          const earnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            dai.address
          );

          await expect(unit.withdrawEarnings(dai.address))
            .to.emit(unit, "EarningsWithdrawn")
            .withArgs(Ugochukwu.address, dai.address, earnings);
        });
        it("reverts if caller has no earnings", async () => {
          await expect(
            unit.withdrawEarnings(ETH_ADDRESS)
          ).to.revertedWithCustomError(unit, "Unit__ZeroEarnings");
        });
      });

      /**
       * @test
       */
      describe("💬withdrawFees", () => {
        it("if fee is ETH, deletes ETH earnings records and transfers ETH to caller", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);

          await unit.connect(Orga).buyItem(ogre.address, 0, {
            value: ONE_ETH,
          });

          const fees: BigNumber = await unit.getFees(ETH_ADDRESS);
          console.log("Fees: ", formatCurrency(fees, "ETH🔷"));

          const prevSellerBal: BigNumber = await Valentine.getBalance();
          console.log("Prev Bal: ", formatCurrency(prevSellerBal, "ETH🔷"));
          console.log("------------------------------------------");

          await unit.connect(Valentine).withdrawFees(ETH_ADDRESS);
          console.log("Fees withdrawn✅");

          const currentFees: BigNumber = await unit.getFees(ETH_ADDRESS);

          const currentSellerBal: BigNumber = await Valentine.getBalance();
          console.log(
            "Current Bal: ",
            formatCurrency(currentSellerBal, "ETH🔷")
          );

          expect(currentFees).to.eq(0);
          expect(currentSellerBal).to.greaterThan(prevSellerBal);
        });

        it("if fee is token, deletes token earnings records and transfers token to caller", async () => {
          await buyItemWithToken();

          const fees: BigNumber = await unit.getFees(dai.address);
          console.log("Fees: ", formatCurrency(fees, "DAI🔶"));

          const prevSellerBal: BigNumber = await dai.balanceOf(
            Valentine.address
          );

          console.log("Prev Bal: ", formatCurrency(prevSellerBal, "DAI🔶"));
          console.log("----------------------------------------");

          await unit.connect(Valentine).withdrawFees(dai.address);
          console.log("Fees withdrawn✅");

          const currentFees: BigNumber = await unit.getFees(dai.address);
          const currentSellerBal: BigNumber = await dai.balanceOf(
            Valentine.address
          );

          console.log(
            "Current Bal: ",
            formatCurrency(currentSellerBal, "DAI🔶")
          );

          expect(currentFees).to.eq(0);
          expect(currentSellerBal).to.greaterThan(prevSellerBal);
        });

        it("emits an event", async () => {
          await buyItemWithToken();
          const fees: BigNumber = await unit.getFees(dai.address);

          await expect(unit.connect(Valentine).withdrawFees(dai.address))
            .to.emit(unit, "FeesWithdrawn")
            .withArgs(Valentine.address, dai.address, fees);
        });
        it("reverts if caller is not Unit owner", async () => {
          await expect(unit.withdrawFees(ETH_ADDRESS)).to.reverted;
        });
        it("reverts if caller has no fee earnings", async () => {
          await expect(
            unit.connect(Valentine).withdrawFees(ETH_ADDRESS)
          ).to.revertedWithCustomError(unit, "Unit__ZeroEarnings");
        });
      });

      /**
       * @test
       */
      describe("💬getListing", () => {
        it("retrieves item listing", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          const listing = await unit.getListing(ogre.address, 0);

          expect(listing.seller).to.eq(Ugochukwu.address);
        });
      });

      /**
       * @test
       */
      describe("💬getEarnings", () => {
        it("retrieves earnings", async () => {
          await listItem(ogre.address, 0, ONE_ETH, 3600);
          await unit.connect(Orga).buyItem(ogre.address, 0, { value: ONE_ETH });

          const earnings: BigNumber = await unit.getEarnings(
            Ugochukwu.address,
            ETH_ADDRESS
          );
          const expectedEarnings: BigNumber = ONE_ETH.mul(99).div(100); // with 1% fee off

          expect(earnings).to.eq(expectedEarnings);
        });
      });

      /**
       * @test
       */
      describe("💬getOffer", () => {
        it("retrieves user offer", async () => {
          // await listItem(ogre.address, 0, ONE_ETH, 3600);

          const offerAmount: BigNumber = ethers.utils.parseEther("1000");
          const listingDeadline: BigNumber = await createOffer(
            ogre.address,
            0,
            dai.address,
            offerAmount,
            6000
          );

          const offer: DataTypes.OfferStructOutput = await unit.getOffer(
            Orga.address,
            ogre.address,
            0
          );

          expect(offer.amount).to.eq(offerAmount);
          expect(offer.token).to.eq(dai.address);
          expect(offer.deadline).to.eq(listingDeadline);
        });
      });
    });
