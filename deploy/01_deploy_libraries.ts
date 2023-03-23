import { getNamedAccounts, deployments} from "hardhat"
import { DeployFunction } from "hardhat-deploy/types";

const deployMocks: DeployFunction = async () => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts()

    log("Deploying Libraries...")
    await deploy("ListLogic", {
        from: deployer
    })

    await deploy("BuyLogic", {
        from: deployer
    })

    await deploy("OfferLogic", {
        from: deployer
    })

    await deploy("WithdrawLogic", {
        from: deployer
    })
    log("Libraries Deployed!✅\n")
}

export default deployMocks;
deployMocks.tags = ["all", "unit"]
