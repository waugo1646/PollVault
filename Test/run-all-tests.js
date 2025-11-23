/**
 * Test Runner: Execute All Tests
 *
 * This script runs all unit tests in sequence and provides
 * a comprehensive test report.
 */

const { testContractDeployment } = require('./test-contract-deployment');
const { testPollData } = require('./test-poll-data');
const { testVotingStatus } = require('./test-voting-status');
const { testFrontendIntegration } = require('./test-frontend-integration');

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + '  PollVault - Comprehensive Test Suite'.padEnd(58) + '║');
  console.log('║' + '  FHE-Powered Private Voting Platform'.padEnd(58) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\n');

  const tests = [
    { name: 'Contract Deployment', fn: testContractDeployment },
    { name: 'Poll Data Integrity', fn: testPollData },
    { name: 'Voting Status', fn: testVotingStatus },
    { name: 'Frontend Integration', fn: testFrontendIntegration },
  ];

  const results = {
    passed: [],
    failed: [],
    total: tests.length,
    startTime: Date.now(),
  };

  for (const test of tests) {
    try {
      console.log(`\n🧪 Running: ${test.name}`);
      const success = await test.fn();

      if (success) {
        results.passed.push(test.name);
        console.log(`✅ ${test.name} - PASSED\n`);
      } else {
        results.failed.push(test.name);
        console.log(`❌ ${test.name} - FAILED\n`);
      }
    } catch (error) {
      results.failed.push(test.name);
      console.error(`❌ ${test.name} - ERROR: ${error.message}\n`);
    }

    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  results.endTime = Date.now();
  results.duration = ((results.endTime - results.startTime) / 1000).toFixed(2);

  // Print final report
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + '  TEST REPORT'.padEnd(58) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('╠' + '═'.repeat(58) + '╣');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + `  Total Tests: ${results.total}`.padEnd(58) + '║');
  console.log('║' + `  ✅ Passed: ${results.passed.length}`.padEnd(58) + '║');
  console.log('║' + `  ❌ Failed: ${results.failed.length}`.padEnd(58) + '║');
  console.log('║' + `  ⏱️  Duration: ${results.duration}s`.padEnd(59) + '║');
  console.log('║' + ' '.repeat(58) + '║');

  if (results.passed.length > 0) {
    console.log('╠' + '═'.repeat(58) + '╣');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + '  Passed Tests:'.padEnd(58) + '║');
    results.passed.forEach(name => {
      console.log('║' + `    ✓ ${name}`.padEnd(58) + '║');
    });
    console.log('║' + ' '.repeat(58) + '║');
  }

  if (results.failed.length > 0) {
    console.log('╠' + '═'.repeat(58) + '╣');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + '  Failed Tests:'.padEnd(58) + '║');
    results.failed.forEach(name => {
      console.log('║' + `    ✗ ${name}`.padEnd(58) + '║');
    });
    console.log('║' + ' '.repeat(58) + '║');
  }

  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\n');

  if (results.failed.length === 0) {
    console.log('🎉 All tests passed successfully! 🎉\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above. ⚠️\n');
  }

  return results.failed.length === 0;
}

// Run all tests if called directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      console.log(`\nExit code: ${success ? 0 : 1}\n`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
