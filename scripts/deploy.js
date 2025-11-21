const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CipherPollVault contract...");

  const CipherPollVault = await hre.ethers.getContractFactory("CipherPollVault");
  const cipherPollVault = await CipherPollVault.deploy();

  await cipherPollVault.waitForDeployment();

  const contractAddress = await cipherPollVault.getAddress();

  console.log("✅ CipherPollVault deployed to:", contractAddress);
  console.log("\n📝 Update frontend/src/constants/contracts.ts with this address:");
  console.log(`export const POLL_VAULT_ADDRESS = "${contractAddress}" as \`0x\${string}\`;`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
