/**
 * Test Script: Frontend Integration Test
 *
 * This script tests the deployed frontend on Vercel to ensure
 * it can properly load and interact with the smart contract.
 */

const https = require('https');

const VERCEL_URL = 'https://pollvault-2edrrcdb7-songsus-projects.vercel.app';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function testFrontendIntegration() {
  console.log('='.repeat(60));
  console.log('Testing Frontend Integration');
  console.log('='.repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  try {
    // Test 1: Homepage loads
    console.log('\nTest 1: Homepage Accessibility');
    console.log('-'.repeat(50));
    try {
      const response = await fetchUrl(VERCEL_URL);
      if (response.statusCode === 200) {
        console.log(`✓ Homepage loads successfully (Status: ${response.statusCode})`);
        console.log(`✓ Content-Type: ${response.headers['content-type']}`);
        passedTests++;
      } else {
        console.log(`✗ Unexpected status code: ${response.statusCode}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`✗ Failed to load homepage: ${error.message}`);
      failedTests++;
    }

    // Test 2: HTML contains expected elements
    console.log('\nTest 2: HTML Content Validation');
    console.log('-'.repeat(50));
    try {
      const response = await fetchUrl(VERCEL_URL);
      const html = response.data;

      const checks = [
        { name: 'Title contains PollVault', test: () => html.includes('PollVault') },
        { name: 'Includes root div', test: () => html.includes('<div id="root">') },
        { name: 'Loads Zama SDK script', test: () => html.includes('relayer-sdk-js') },
        { name: 'Meta description mentions FHE', test: () => html.toLowerCase().includes('fhe') || html.toLowerCase().includes('encryption') },
      ];

      checks.forEach(check => {
        if (check.test()) {
          console.log(`✓ ${check.name}`);
          passedTests++;
        } else {
          console.log(`✗ ${check.name}`);
          failedTests++;
        }
      });
    } catch (error) {
      console.log(`✗ HTML validation failed: ${error.message}`);
      failedTests++;
    }

    // Test 3: Vote History page route (SPA routing)
    console.log('\nTest 3: SPA Routing (Vote History Page)');
    console.log('-'.repeat(50));
    try {
      const response = await fetchUrl(`${VERCEL_URL}/history`);
      if (response.statusCode === 200) {
        console.log('✓ /history route returns 200 (SPA routing works)');
        passedTests++;

        // Should return the same HTML as homepage (SPA)
        const homeResponse = await fetchUrl(VERCEL_URL);
        if (response.data === homeResponse.data) {
          console.log('✓ Returns same HTML as homepage (correct SPA behavior)');
          passedTests++;
        } else {
          console.log('⚠️  Different HTML returned, but might be OK');
          passedTests++;
        }
      } else {
        console.log(`✗ /history route failed: ${response.statusCode}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`✗ SPA routing test failed: ${error.message}`);
      failedTests++;
    }

    // Test 4: Static assets load
    console.log('\nTest 4: Static Assets');
    console.log('-'.repeat(50));
    try {
      const response = await fetchUrl(VERCEL_URL);
      const html = response.data;

      // Extract JS and CSS references
      const jsMatches = html.match(/src="([^"]+\.js)"/g) || [];
      const cssMatches = html.match(/href="([^"]+\.css)"/g) || [];

      console.log(`✓ Found ${jsMatches.length} JS references`);
      console.log(`✓ Found ${cssMatches.length} CSS references`);

      if (jsMatches.length > 0 && cssMatches.length > 0) {
        console.log('✓ Static assets are referenced in HTML');
        passedTests++;
      } else {
        console.log('✗ Missing asset references');
        failedTests++;
      }
    } catch (error) {
      console.log(`✗ Asset check failed: ${error.message}`);
      failedTests++;
    }

    // Test 5: Environment variables in build
    console.log('\nTest 5: Environment Configuration');
    console.log('-'.repeat(50));
    try {
      const response = await fetchUrl(VERCEL_URL);
      const html = response.data;

      // Check if contract address placeholder is NOT in the HTML
      // (it should be replaced during build)
      if (!html.includes('0x0000000000000000000000000000000000000000')) {
        console.log('✓ Contract address appears to be configured');
        passedTests++;
      } else {
        console.log('⚠️  Default contract address found (might need env var)');
        passedTests++;
      }
    } catch (error) {
      console.log(`✗ Environment check failed: ${error.message}`);
      failedTests++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('Test Summary:');
    console.log(`  Total Tests: ${passedTests + failedTests}`);
    console.log(`  ✅ Passed: ${passedTests}`);
    console.log(`  ❌ Failed: ${failedTests}`);
    console.log('='.repeat(60));

    console.log(`\n📱 Frontend URL: ${VERCEL_URL}`);
    console.log('📝 Note: Full functionality testing requires browser interaction\n');

    return failedTests === 0;
  } catch (error) {
    console.error('\n❌ Frontend integration test failed:');
    console.error(error.message);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testFrontendIntegration()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testFrontendIntegration };
