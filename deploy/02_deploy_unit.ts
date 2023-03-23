import {network, getNamedAccounts, deployments, ethers} from "hardhat"
import { DeployFunction, DeployResult } from "hardhat-deploy/types";
import { verify } from "../helper-functions";
import { developmentChains } from "../helper-hardhat-config";

const deployMocks: DeployFunction = async () => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts()

    // Libraries
    const listLogic = await ethers.getContract("ListLogic")
    const buyLogic = await ethers.getContract("BuyLogic")
    const offerLogic = await ethers.getContract("OfferLogic")
    const withdrawLogic = await ethers.getContract("WithdrawLogic")


    log("Deploying Unit...")

    const unit: DeployResult =  await deploy("Unit", {
        from: deployer,
        log: true,
        libraries: {
            ListLogic: listLogic.address,
            BuyLogic: buyLogic.address,
            OfferLogic: offerLogic.address,
            WithdrawLogic: withdrawLogic.address
        }
    })

    log("Unit Deployed!✅")

    if(!developmentChains.includes(network.name)) {
        await verify(unit.address, [])
    }
}

export default deployMocks;
deployMocks.tags = ["all", "unit"]
