/**
 * CipherPollVault Contract ABI
 * Generated from compiled artifacts
 */

export const POLL_VAULT_ABI = [
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
  },
  {
    inputs: [
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint64", name: "durationSeconds", type: "uint64" }
    ],
    name: "createCipherPoll",
    outputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "externalEbool", name: "encChoice", type: "bytes32" },
      { internalType: "bytes", name: "inputProof", type: "bytes" }
    ],
    name: "castCipherVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "requestCipherReveal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "bytes", name: "clearValues", type: "bytes" },
      { internalType: "bytes", name: "proof", type: "bytes" }
    ],
    name: "submitCipherReveal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "uint64", name: "deadline", type: "uint64" }
    ],
    name: "PollCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "voter", type: "address" }
    ],
    name: "VoteCast",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: false, internalType: "uint128", name: "yesVotes", type: "uint128" },
      { indexed: false, internalType: "uint128", name: "noVotes", type: "uint128" }
    ],
    name: "CountsRevealed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "yesHandle", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "noHandle", type: "bytes32" }
    ],
    name: "RevealPrepared",
    type: "event"
  }
] as const;
