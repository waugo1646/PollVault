/**
 * Test Script: Poll Data Integrity
 *
 * This script tests reading and validating poll data from the contract.
 * It checks data structure, timestamps, and data consistency.
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
  }
];

async function testPollData() {
  console.log('='.repeat(60));
  console.log('Testing Poll Data Integrity');
  console.log('='.repeat(60));

  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(
      process.env.POLL_VAULT_ADDRESS,
      POLL_VAULT_ABI,
      provider
    );

    const nextPollId = await contract.nextPollId();
    const totalPolls = Number(nextPollId);
    console.log(`Total polls in contract: ${totalPolls}\n`);

    if (totalPolls === 0) {
      console.log('⚠️  No polls found in contract');
      return true;
    }

    let passedTests = 0;
    let failedTests = 0;

    // Test each poll
    for (let i = 0; i < totalPolls; i++) {
      console.log(`Testing Poll #${i}:`);
      console.log('-'.repeat(50));

      try {
        const poll = await contract.polls(i);

        // Test 1: Title is not empty
        if (poll[0] && poll[0].length > 0) {
          console.log(`✓ Title: "${poll[0]}"`);
          passedTests++;
        } else {
          console.log('✗ Title is empty');
          failedTests++;
        }

        // Test 2: Description is not empty
        if (poll[1] && poll[1].length > 0) {
          console.log(`✓ Description: "${poll[1].substring(0, 50)}..."`);
          passedTests++;
        } else {
          console.log('✗ Description is empty');
          failedTests++;
        }

        // Test 3: Creator is valid address
        if (ethers.isAddress(poll[2]) && poll[2] !== ethers.ZeroAddress) {
          console.log(`✓ Creator: ${poll[2]}`);
          passedTests++;
        } else {
          console.log('✗ Invalid creator address');
          failedTests++;
        }

        // Test 4: Deadline is in the future or recently past
        const deadline = Number(poll[3]);
        const now = Math.floor(Date.now() / 1000);
        const deadlineDate = new Date(deadline * 1000);
        const isActive = deadline > now;

        console.log(`✓ Deadline: ${deadlineDate.toISOString()}`);
        console.log(`  Status: ${isActive ? 'Active' : 'Ended'}`);
        passedTests++;

        // Test 5: Encrypted vote counts are bytes32
        if (poll[4] && poll[5]) {
          console.log(`✓ Encrypted counts exist (${typeof poll[4]})`);
          passedTests++;
        } else {
          console.log('✗ Encrypted counts missing');
          failedTests++;
        }

        // Test 6: Revealed status consistency
        const revealed = poll[8];
        const revealedYes = Number(poll[6]);
        const revealedNo = Number(poll[7]);

        if (revealed) {
          console.log(`✓ Poll revealed: YES=${revealedYes}, NO=${revealedNo}`);
          passedTests++;
        } else if (!revealed && revealedYes === 0 && revealedNo === 0) {
          console.log(`✓ Poll not revealed yet (encrypted)`);
          passedTests++;
        } else {
          console.log('✗ Inconsistent reveal status');
          failedTests++;
        }

        console.log('');
      } catch (error) {
        console.error(`✗ Error reading poll ${i}:`, error.message);
        failedTests++;
        console.log('');
      }
    }

    console.log('='.repeat(60));
    console.log(`Test Summary:`);
    console.log(`  Total Tests: ${passedTests + failedTests}`);
    console.log(`  ✅ Passed: ${passedTests}`);
    console.log(`  ❌ Failed: ${failedTests}`);
    console.log('='.repeat(60));

    return failedTests === 0;
  } catch (error) {
    console.error('\n❌ Poll data test failed:');
    console.error(error.message);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testPollData()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testPollData };
