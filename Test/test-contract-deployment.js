/**
 * Test Script: Contract Deployment Verification
 *
 * This script verifies that the PollVault contract is correctly deployed
 * and accessible on Sepolia testnet.
 */

const { ethers } = require('ethers');
require('dotenv').config();

const POLL_VAULT_ABI = [
  {
    inputs: [],
    name: "nextPollId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "polls",
    outputs: [
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint64", name: "deadline", type: "uint64" },
      { internalType: "euint128", name: "yesCount", type: "bytes32" },
      { internalType: "euint128", name: "noCount", type: "bytes32" },
      { internalType: "uint128", name: "revealedYes", type: "uint128" },
      { internalType: "uint128", name: "revealedNo", type: "uint128" },
      { internalType: "bool", name: "revealed", type: "bool" },
      { internalType: "bool", name: "publiclyDecryptable", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

async function testContractDeployment() {
  console.log('='.repeat(60));
  console.log('Testing Contract Deployment');
  console.log('='.repeat(60));

  try {
    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    console.log('✓ Connected to Sepolia RPC');

    const contractAddress = process.env.POLL_VAULT_ADDRESS;
    console.log(`Contract Address: ${contractAddress}`);

    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('No contract deployed at this address');
    }
    console.log('✓ Contract code exists at address');

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, POLL_VAULT_ABI, provider);
    console.log('✓ Contract instance created');

    // Test reading nextPollId
    const nextPollId = await contract.nextPollId();
    console.log(`✓ nextPollId: ${nextPollId.toString()}`);

    // Test reading first poll if exists
    if (nextPollId > 0) {
      const poll0 = await contract.polls(0);
      console.log('✓ Successfully read poll 0:');
      console.log(`  Title: ${poll0[0]}`);
      console.log(`  Description: ${poll0[1]}`);
      console.log(`  Creator: ${poll0[2]}`);
      console.log(`  Deadline: ${new Date(Number(poll0[3]) * 1000).toISOString()}`);
      console.log(`  Revealed: ${poll0[8]}`);
    }

    console.log('\n✅ All deployment tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Deployment test failed:');
    console.error(error.message);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testContractDeployment()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testContractDeployment };
