import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // const verifier = await deploy("HonkVerifier", {
  //   from: deployer,
  //   log: true,
  //   autoMine: true,
  // });

  // console.log("Verifier deployed to:", verifier.address);

  // const poseidon3 = await deploy("PoseidonT3", {
  //   from: deployer,
  //   log: true,
  //   autoMine: true,
  // });

  // console.log("poseidon3 deployed to:", poseidon3.address);

  // const poseidon3AddressMainnet = "0xaE8413714De50a2F0c139C3310c9d31136a5b050";
  // const poseidon3AddressBase = "0xB288971E6CD60516DBCEF413165B2A7944e04fC3";

  // const leanIMT = await deploy("LeanIMT", {
  //   from: deployer,
  //   log: true,
  //   autoMine: true,
  //   libraries: {
  //     // LeanIMT: leanIMT.address,
  //     PoseidonT3: poseidon3AddressBase,
  //   },
  // });

  // console.log("leanIMT deployed to:", leanIMT.address);

  ////////////////////
  /// base//////
  ////////////////////

  const verifierBase = "0xA33847e9F139c75721df1e613Dac5a578d244439";
  const leanIMTAddressBase = "0x8914Ef87823d7B1cBbB2FB6c0E81ec232f258224";

  await deploy("VotingFactory", {
    from: deployer,
    args: [verifierBase],
    log: true,
    autoMine: true,
    libraries: {
      LeanIMT: leanIMTAddressBase,
    },
  });

  await deploy("Voting", {
    from: deployer,
    // Contract constructor arguments
    args: [verifierBase, "Should we build a new bridge?", 0, ["Yes", "No"]],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
    libraries: {
      LeanIMT: leanIMTAddressBase,
      // PoseidonT3: poseidon3.address,
      // PoseidonT2: poseidon2.address,
    },
  });
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["Voting"];
