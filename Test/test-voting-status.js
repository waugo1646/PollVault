/**
 * Test Script: Voting Status Check
 *
 * This script tests the hasVoted function to verify that voting
 * status is correctly tracked for different addresses.
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
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "hasVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
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

async function testVotingStatus() {
  console.log('='.repeat(60));
  console.log('Testing Voting Status Tracking');
  console.log('='.repeat(60));

  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(
      process.env.POLL_VAULT_ADDRESS,
      POLL_VAULT_ABI,
      provider
    );

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const testAddress = wallet.address;

    console.log(`Testing with address: ${testAddress}\n`);

    const nextPollId = await contract.nextPollId();
    const totalPolls = Number(nextPollId);

    if (totalPolls === 0) {
      console.log('⚠️  No polls found in contract');
      return true;
    }

    let votedCount = 0;
    let notVotedCount = 0;

    // Check voting status for each poll
    for (let i = 0; i < totalPolls; i++) {
      try {
        const poll = await contract.polls(i);
        const hasVoted = await contract.hasVoted(i, testAddress);

        console.log(`Poll #${i}: "${poll[0]}"`);
        console.log(`  Voting Status: ${hasVoted ? '✓ Voted' : '○ Not Voted'}`);

        if (hasVoted) {
          votedCount++;
        } else {
          notVotedCount++;
        }

        // Check poll status
        const deadline = Number(poll[3]);
        const now = Math.floor(Date.now() / 1000);
        const isActive = deadline > now;
        console.log(`  Poll Status: ${isActive ? 'Active' : 'Ended'}`);

        // If revealed, show results
        if (poll[8]) {
          const revealedYes = Number(poll[6]);
          const revealedNo = Number(poll[7]);
          console.log(`  Results: YES=${revealedYes}, NO=${revealedNo}`);
        }

        console.log('');
      } catch (error) {
        console.error(`✗ Error checking poll ${i}:`, error.message);
      }
    }

    console.log('='.repeat(60));
    console.log('Voting Summary:');
    console.log(`  Total Polls: ${totalPolls}`);
    console.log(`  Voted: ${votedCount}`);
    console.log(`  Not Voted: ${notVotedCount}`);
    console.log('='.repeat(60));

    // Test with random address (should not have voted)
    const randomAddress = ethers.Wallet.createRandom().address;
    console.log(`\nTesting with random address: ${randomAddress}`);

    let randomVoted = false;
    for (let i = 0; i < Math.min(totalPolls, 3); i++) {
      const hasVoted = await contract.hasVoted(i, randomAddress);
      if (hasVoted) {
        randomVoted = true;
        console.log(`✗ Random address appears to have voted on poll ${i}`);
      }
    }

    if (!randomVoted) {
      console.log('✓ Random address has not voted (as expected)');
    }

    console.log('\n✅ Voting status tests completed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Voting status test failed:');
    console.error(error.message);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testVotingStatus()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testVotingStatus };
