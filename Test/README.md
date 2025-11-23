# PollVault Test Suite

Comprehensive test suite for the PollVault FHE-powered private voting platform.

## Test Files

### 1. `test-contract-deployment.js`
Tests the smart contract deployment on Sepolia testnet.

**What it tests:**
- Contract exists at the specified address
- Contract has valid bytecode
- Can read `nextPollId` from contract
- Can read poll data from contract

**Run individually:**
```bash
cd /Users/songsu/Desktop/zama/finance-demo-11/PollVault
node Test/test-contract-deployment.js
```

---

### 2. `test-poll-data.js`
Tests the integrity and consistency of poll data.

**What it tests:**
- Poll titles are not empty
- Poll descriptions are not empty
- Creator addresses are valid
- Deadlines are properly formatted
- Encrypted vote counts exist
- Revealed status is consistent with vote counts

**Run individually:**
```bash
node Test/test-poll-data.js
```

---

### 3. `test-voting-status.js`
Tests the voting status tracking functionality.

**What it tests:**
- `hasVoted` function works correctly
- Voting status is tracked per address
- Random addresses show as not voted
- Displays voting summary for configured address

**Run individually:**
```bash
node Test/test-voting-status.js
```

---

### 4. `test-frontend-integration.js`
Tests the deployed Vercel frontend.

**What it tests:**
- Homepage loads successfully
- HTML contains expected elements (PollVault, FHE SDK)
- SPA routing works (`/history` route)
- Static assets are referenced
- Environment variables are configured

**Run individually:**
```bash
node Test/test-frontend-integration.js
```

---

## Running All Tests

To run the complete test suite:

```bash
cd /Users/songsu/Desktop/zama/finance-demo-11/PollVault
node Test/run-all-tests.js
```

This will:
1. Run all tests in sequence
2. Display individual test results
3. Generate a comprehensive test report
4. Exit with code 0 if all tests pass, 1 if any fail

## Prerequisites

Before running tests, ensure:

1. **Environment Variables** are configured in `.env`:
   ```env
   PRIVATE_KEY=your_private_key
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   POLL_VAULT_ADDRESS=0x65ABC254D48923022c70F5eFdae54434b77C99eE
   ```

2. **Dependencies** are installed:
   ```bash
   npm install ethers dotenv
   ```

3. **Contract is deployed** on Sepolia testnet

4. **Frontend is deployed** on Vercel

## Expected Output

### Successful Test Run

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  PollVault - Comprehensive Test Suite                   ║
║  FHE-Powered Private Voting Platform                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

🧪 Running: Contract Deployment
============================================================
Testing Contract Deployment
============================================================
✓ Connected to Sepolia RPC
Contract Address: 0x65ABC254D48923022c70F5eFdae54434b77C99eE
✓ Contract code exists at address
✓ Contract instance created
✓ nextPollId: 3
✓ Successfully read poll 0:
  Title: Community Treasury Allocation
  ...

✅ Contract Deployment - PASSED

...

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  TEST REPORT                                            ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Total Tests: 4                                         ║
║  ✅ Passed: 4                                           ║
║  ❌ Failed: 0                                           ║
║  ⏱️  Duration: 8.45s                                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

🎉 All tests passed successfully! 🎉
```

## Test Coverage

The test suite covers:

- ✅ Smart contract deployment verification
- ✅ Contract state reading (polls, voting status)
- ✅ Data integrity and validation
- ✅ Address-based voting tracking
- ✅ Frontend deployment and routing
- ✅ Static asset loading
- ✅ Environment configuration

## Troubleshooting

### "No contract deployed at this address"
- Verify `POLL_VAULT_ADDRESS` in `.env` is correct
- Check contract is deployed on Sepolia
- Verify RPC endpoint is accessible

### "Connection refused"
- Check `SEPOLIA_RPC_URL` is correct
- Verify internet connection
- Try alternative RPC endpoint

### "Frontend tests failing"
- Verify Vercel URL is correct in test file
- Check frontend is deployed and accessible
- Wait a few minutes after deployment for DNS propagation

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run PollVault Tests
  run: |
    cd PollVault
    node Test/run-all-tests.js
```

## Notes

- Tests use **read-only** operations and won't modify blockchain state
- Frontend tests use **HTTP requests** and don't require a browser
- All tests can run **without user interaction**
- Tests are **idempotent** and can be run multiple times

## Contact & Support

For issues or questions about the test suite, refer to the main project documentation or create an issue in the repository.
