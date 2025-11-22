const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// 30 days in seconds
const THIRTY_DAYS = 30 * 24 * 60 * 60; // 2592000 seconds

// Sample polls to create
const polls = [
  {
    title: "Community Treasury Allocation",
    description: "Should we allocate 20% of the treasury funds to community grants for open-source development?"
  },
  {
    title: "Protocol Upgrade Proposal",
    description: "Do you support upgrading the protocol to v2.0 with enhanced privacy features?"
  },
  {
    title: "Governance Structure Change",
    description: "Should we implement quadratic voting for future governance decisions?"
  }
];

async function main() {
  console.log("🚀 Creating 30-day polls on CipherPollVault...");

  // Get contract address from environment
  const contractAddress = process.env.POLL_VAULT_ADDRESS;
  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    console.error("❌ Error: POLL_VAULT_ADDRESS not set in .env file");
    console.log("📝 Please deploy the contract first and update .env with the deployed address");
    process.exit(1);
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📍 Creating polls from:", wallet.address);
  console.log("📍 Contract address:", contractAddress);

  // Load contract ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PollVault.sol/CipherPollVault.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Create contract instance
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log(`\n⏳ Creating ${polls.length} polls with 30-day duration (${THIRTY_DAYS} seconds)...\n`);

  for (let i = 0; i < polls.length; i++) {
    const poll = polls[i];
    console.log(`📝 Poll ${i + 1}/${polls.length}: "${poll.title}"`);

    try {
      const tx = await contract.createCipherPoll(
        poll.title,
        poll.description,
        THIRTY_DAYS
      );

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Poll created successfully! Gas used: ${receipt.gasUsed.toString()}\n`);
    } catch (error) {
      console.error(`   ❌ Failed to create poll: ${error.message}\n`);
    }
  }

  console.log("✅ All polls created!");
  console.log("\n📊 Summary:");
  console.log(`   - Duration: 30 days (${THIRTY_DAYS} seconds)`);
  console.log(`   - Total polls: ${polls.length}`);
  console.log(`   - Contract: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
  });
