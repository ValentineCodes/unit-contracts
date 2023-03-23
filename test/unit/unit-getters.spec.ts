import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {  expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { DAI, MyNFT, Unit } from "../../typechain";

import { ZERO_ADDRESS } from "../../helpers/constants";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Unit: Getters", async () => {
      // Contracts
      let unit: Unit;
      let myNFT: MyNFT;
      let dai: DAI;

      // Signers
      let unitDeployer: SignerWithAddress;
      let mocksDeployer: SignerWithAddress;
      let user_1: SignerWithAddress;

      beforeEach(async () => {
        const signers = await ethers.getSigners();
        unitDeployer = signers[0];
        mocksDeployer = signers[1];
        user_1 = signers[2];

        await deployments.fixture(["mocks", "unit"]);

        unit = await ethers.getContract("Unit", mocksDeployer);
        myNFT = await ethers.getContract("MyNFT", mocksDeployer);
        dai = await ethers.getContract("DAI", mocksDeployer);
      });

      const listItem = async (
        nft: string,
        tokenId: number,
        amount: BigNumber,
        deadline: number
      ) => {
        try {
          await myNFT.approve(unit.address, tokenId);
          await unit.listItem(nft, tokenId, amount, deadline);
        } catch (error) {
          console.log("Failed to list item");
          console.error(error);
        }
      };

      const buyItem = async (
        nft: string,
        tokenId: number,
        amount: BigNumber
      ) => {
        try {
          unit = unit.connect(user_1);
          await unit.buyItem(nft, tokenId, { value: amount });
        } catch (error) {
          console.log("Failed to buy item");
          console.error(error);
        }
      };

      const createOffer = async (
        nft: string,
        tokenId: number,
        token: string,
        amount: BigNumber,
        deadline: number
      ) => {
        try {
          await dai.approve(unit.address, amount);
          await unit.createOffer(nft, tokenId, token, amount, deadline);
        } catch (error) {
          console.log("Failed to create offer");
          console.error(error);
        }
      };

      describe("getListing()", () => {
        it("retrieves item listing", async () => {
          await listItem(myNFT.address, 0, ethers.utils.parseEther("1"), 3600);
          const listing = await unit.getListing(myNFT.address, 0);

          expect(listing.seller).to.eq(mocksDeployer.address);
        });
      });
      describe("getEarnings()", () => {
        it("retrieves earnings", async () => {
          await listItem(myNFT.address, 0, ethers.utils.parseEther("1"), 3600);
          await buyItem(myNFT.address, 0, ethers.utils.parseEther("1"));

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
      describe("getOffer()", () => {
        it("retrieves user offer", async () => {
          await listItem(myNFT.address, 0, ethers.utils.parseEther("1"), 3600);

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
    });
