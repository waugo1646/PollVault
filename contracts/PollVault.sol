// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Cipher Poll Vault
 * @notice Binary voting system with encrypted tallies
 * @dev Implements yes/no voting using FHE v0.9.0
 */
contract CipherPollVault is ZamaEthereumConfig {
    struct Poll {
        string title;
        string description;
        address creator;
        uint64 deadline;
        euint128 yesCount;
        euint128 noCount;
        uint128 revealedYes;
        uint128 revealedNo;
        bool revealed;
        bool publiclyDecryptable;
    }

    uint256 public nextPollId;
    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event PollCreated(uint256 indexed id, address indexed creator, string title, uint64 deadline);
    event VoteCast(uint256 indexed id, address indexed voter);
    event RevealPrepared(uint256 indexed id, bytes32 yesHandle, bytes32 noHandle);
    event CountsRevealed(uint256 indexed id, uint128 yesVotes, uint128 noVotes);

    error VotingEnded();
    error TooEarly();
    error InvalidDuration();
    error EmptyTitle();
    error AlreadyRevealed();
    error AlreadyVoted();
    error NotPubliclyDecryptable();
    error InvalidCleartext();

    modifier onlyBefore(uint256 id) {
        if (block.timestamp >= polls[id].deadline) revert VotingEnded();
        _;
    }

    modifier onlyAfter(uint256 id) {
        if (block.timestamp < polls[id].deadline) revert TooEarly();
        _;
    }

    /**
     * @notice Create a new poll
     * @param title Poll title/question
     * @param description Poll description
     * @param durationSeconds Poll duration in seconds
     * @return id Poll ID
     */
    function createCipherPoll(string calldata title, string calldata description, uint64 durationSeconds) external returns (uint256 id) {
        if (durationSeconds == 0) revert InvalidDuration();
        if (bytes(title).length == 0) revert EmptyTitle();

        id = nextPollId++;
        Poll storage p = polls[id];
        p.title = title;
        p.description = description;
        p.creator = msg.sender;
        p.deadline = uint64(block.timestamp) + durationSeconds;
        p.yesCount = FHE.asEuint128(0);
        p.noCount = FHE.asEuint128(0);

        FHE.allowThis(p.yesCount);
        FHE.allowThis(p.noCount);

        emit PollCreated(id, msg.sender, title, p.deadline);
    }

    /**
     * @notice Cast an encrypted vote
     * @param id Poll ID
     * @param encChoice Encrypted boolean choice (true = yes, false = no)
     * @param inputProof Zero-knowledge proof
     */
    function castCipherVote(uint256 id, externalEbool encChoice, bytes calldata inputProof) external onlyBefore(id) {
        Poll storage p = polls[id];
        if (p.revealed || p.publiclyDecryptable) revert AlreadyRevealed();
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();

        hasVoted[id][msg.sender] = true;
        ebool choice = FHE.fromExternal(encChoice, inputProof);

        euint128 one = FHE.asEuint128(1);
        euint128 zero = FHE.asEuint128(0);

        p.yesCount = FHE.add(p.yesCount, FHE.select(choice, one, zero));
        p.noCount = FHE.add(p.noCount, FHE.select(choice, zero, one));

        emit VoteCast(id, msg.sender);
    }

    /**
     * @notice Request reveal after deadline (enables public decryption handles)
     * @param id Poll ID
     */
    function requestCipherReveal(uint256 id) external onlyAfter(id) {
        Poll storage p = polls[id];
        if (p.revealed || p.publiclyDecryptable) revert AlreadyRevealed();

        p.yesCount = FHE.makePubliclyDecryptable(p.yesCount);
        p.noCount = FHE.makePubliclyDecryptable(p.noCount);
        p.publiclyDecryptable = true;

        emit RevealPrepared(id, FHE.toBytes32(p.yesCount), FHE.toBytes32(p.noCount));
    }

    /**
     * @notice Submit decrypted tallies after requesting reveal
     * @param id Poll ID
     * @param clearValues abi.encode(uint128 yes, uint128 no)
     * @param proof KMS signatures proof
     */
    function submitCipherReveal(
        uint256 id,
        bytes calldata clearValues,
        bytes calldata proof
    ) external {
        Poll storage p = polls[id];
        if (!p.publiclyDecryptable) revert NotPubliclyDecryptable();
        if (p.revealed) revert AlreadyRevealed();

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(p.yesCount);
        handles[1] = FHE.toBytes32(p.noCount);

        FHE.checkSignatures(handles, clearValues, proof);

        uint128[] memory decoded = abi.decode(clearValues, (uint128[]));
        if (decoded.length != 2) revert InvalidCleartext();

        p.revealedYes = decoded[0];
        p.revealedNo = decoded[1];
        p.revealed = true;

        emit CountsRevealed(id, decoded[0], decoded[1]);
    }

    /**
     * @notice Get poll details
     */
    function getCipherPollDetails(uint256 id) external view returns (
        string memory title,
        string memory description,
        address creator,
        uint64 deadline,
        bool revealed,
        bool publiclyDecryptable
    ) {
        Poll storage p = polls[id];
        return (p.title, p.description, p.creator, p.deadline, p.revealed, p.publiclyDecryptable);
    }

    function getCipherPollResults(uint256 id) external view returns (uint128 yesVotes, uint128 noVotes, bool revealed) {
        Poll storage p = polls[id];
        return (p.revealedYes, p.revealedNo, p.revealed);
    }

    /**
     * @notice Check if encrypted counts are publicly decryptable
     */
    function isCountsPubliclyDecryptable(uint256 id) external view returns (bool yesDecryptable, bool noDecryptable) {
        Poll storage p = polls[id];
        return (FHE.isPubliclyDecryptable(p.yesCount), FHE.isPubliclyDecryptable(p.noCount));
    }
}
