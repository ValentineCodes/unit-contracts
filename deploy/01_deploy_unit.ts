import {network, getNamedAccounts, deployments} from "hardhat"
import { DeployFunction, DeployResult } from "hardhat-deploy/types";
import { verify } from "../helper-functions";
import { developmentChains } from "../helper-hardhat-config";

const deployMocks: DeployFunction = async () => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts()

    log("Deploying Libraries...")
    const ListLogic = await deploy("ListLogic", {
        from: deployer
    })

    const BuyLogic = await deploy("BuyLogic", {
        from: deployer
    })

    const OfferLogic = await deploy("OfferLogic", {
        from: deployer
    })

    const WithdrawLogic = await deploy("WithdrawLogic", {
        from: deployer
    })
    log("Libraries Deployed!✅\n")


    log("Deploying Unit...")

    const unit: DeployResult =  await deploy("Unit", {
        from: deployer,
        log: true,
        libraries: {
            ListLogic: ListLogic.address,
            BuyLogic: BuyLogic.address,
            OfferLogic: OfferLogic.address,
            WithdrawLogic: WithdrawLogic.address
        }
    })

    log("Unit Deployed!✅")

    if(!developmentChains.includes(network.name)) {
        await verify(unit.address, [])
    }
}

export default deployMocks;
deployMocks.tags = ["all", "unit"]
