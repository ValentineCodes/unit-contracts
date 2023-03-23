import {network, getNamedAccounts, deployments} from "hardhat"
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains } from "../helper-hardhat-config";

const deployMocks: DeployFunction = async () => {
    const {deploy, log} = deployments;
    const {tokenHolder} = await getNamedAccounts()

    if(developmentChains.includes(network.name)) {
        log("Deploying Mocks...")
        
        await deploy("DAI", {
            from: tokenHolder,
            log: true,
        })

        await deploy("MyNFT", {
            from: tokenHolder,
            log: true,
        })

        log("Mocks Deployed!✅\n")
    }


}

export default deployMocks;
deployMocks.tags = ["all", "mocks"]
