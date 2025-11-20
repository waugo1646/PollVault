import { useState, useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { Vote, ListChecks, Loader2, History, AlertCircle } from "lucide-react";
import { PollCard } from "@/components/PollCard";
import { CreatePollDialog } from "@/components/CreatePollDialog";
import { Poll } from "@/types/poll";
import { useToast } from "@/hooks/use-toast";
import { POLL_VAULT_ADDRESS } from "@/config/contracts";
import { POLL_VAULT_ABI } from "@/config/abi";
import { initializeFHE, encryptVote } from "@/lib/fhe";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sepolia } from 'wagmi/chains';

const Index = () => {
  const { address, isConnected, chain } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Map<string, 'yes' | 'no'>>(new Map());
  const [voting, setVoting] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // Get total number of polls from contract
  const { data: nextPollId, isError: nextPollIdError, error: nextPollIdErrorMsg } = useReadContract({
    address: POLL_VAULT_ADDRESS as `0x${string}`,
    abi: POLL_VAULT_ABI,
    functionName: "nextPollId",
  });

  // Check if user is on the correct network
  useEffect(() => {
    if (isConnected && chain) {
      const isWrongNetwork = chain.id !== sepolia.id;
      setWrongNetwork(isWrongNetwork);

      if (isWrongNetwork) {
        console.log("Wrong network detected. Current:", chain.id, "Expected:", sepolia.id);
      }
    } else {
      setWrongNetwork(false);
    }
  }, [isConnected, chain]);

  // Debug logging
  useEffect(() => {
    console.log("Contract address:", POLL_VAULT_ADDRESS);
    console.log("nextPollId:", nextPollId);
    console.log("nextPollId error:", nextPollIdError, nextPollIdErrorMsg);
    console.log("Current chain:", chain?.id, "Expected:", sepolia.id);
  }, [nextPollId, nextPollIdError, nextPollIdErrorMsg, chain]);

  // Fetch all polls from the blockchain
  useEffect(() => {
    const fetchPolls = async () => {
      console.log("fetchPolls called - nextPollId:", nextPollId, "publicClient:", !!publicClient);

      if (!nextPollId || !publicClient) {
        console.log("Skipping fetch - missing nextPollId or publicClient");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const totalPolls = Number(nextPollId);
        console.log("Fetching total polls:", totalPolls);
        const pollsData: Poll[] = [];

        // Fetch each poll
        for (let i = 0; i < totalPolls; i++) {
          try {
            console.log(`Fetching poll ${i}...`);
            // Fetch poll data from contract
            const pollData = await publicClient.readContract({
              address: POLL_VAULT_ADDRESS as `0x${string}`,
              abi: POLL_VAULT_ABI,
              functionName: "polls",
              args: [BigInt(i)],
            }) as any;

            console.log(`Poll ${i} data:`, pollData);

            // Calculate if poll is still active
            const now = Math.floor(Date.now() / 1000);
            const deadline = Number(pollData[3] || 0); // deadline is 4th element
            const isActive = deadline > now;

            // Check if user has voted
            let hasVoted = false;
            if (address) {
              try {
                hasVoted = await publicClient.readContract({
                  address: POLL_VAULT_ADDRESS as `0x${string}`,
                  abi: POLL_VAULT_ABI,
                  functionName: "hasVoted",
                  args: [BigInt(i), address],
                }) as boolean;
              } catch (e) {
                console.error(`Error checking vote status for poll ${i}:`, e);
              }
            }

            const poll: Poll = {
              id: i.toString(),
              creator: pollData[2] || "0x0000000000000000000000000000000000000000", // creator
              question: pollData[0] || `Poll #${i}`, // title
              description: pollData[1] || "", // description
              yesVotes: pollData[8] ? Number(pollData[6] || 0) : 0, // revealed ? revealedYes : 0
              noVotes: pollData[8] ? Number(pollData[7] || 0) : 0, // revealed ? revealedNo : 0
              voters: new Set(),
              createdAt: new Date(deadline * 1000 - 30 * 24 * 60 * 60 * 1000), // Estimate creation time
              status: isActive ? 'active' : 'ended',
              revealed: pollData[8] || false, // revealed
              deadline: BigInt(deadline),
            };

            pollsData.push(poll);

            // Track user votes
            if (hasVoted) {
              setUserVotes(prev => new Map(prev.set(i.toString(), 'yes'))); // We don't know the actual vote choice
            }
          } catch (error) {
            console.error(`Error fetching poll ${i}:`, error);
          }
        }

        setPolls(pollsData.reverse()); // Show newest first
      } catch (error) {
        console.error("Error fetching polls:", error);
        toast({
          title: "Error",
          description: "Failed to load polls from blockchain",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [nextPollId, address, toast, publicClient]);

  const handleCreatePoll = (question: string, description?: string) => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet to create a poll",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Creating Poll",
      description: "Please confirm the transaction in your wallet",
    });

    // TODO: Implement actual contract interaction
    // This would involve calling the createCipherPoll function
  };

  const handleVote = async (pollId: string, choice: 'yes' | 'no') => {
    if (!address || !walletClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return;
    }

    // Check if on the correct network
    if (chain?.id !== sepolia.id) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet to vote",
        variant: "destructive",
      });
      return;
    }

    if (voting) {
      return; // Prevent duplicate votes
    }

    try {
      setVoting(true);

      // Double-check from contract if user has already voted
      if (publicClient) {
        const hasVoted = await publicClient.readContract({
          address: POLL_VAULT_ADDRESS as `0x${string}`,
          abi: POLL_VAULT_ABI,
          functionName: "hasVoted",
          args: [BigInt(pollId), address],
        }) as boolean;

        if (hasVoted) {
          toast({
            title: "Already Voted",
            description: "You have already voted on this poll",
            variant: "destructive",
          });
          setUserVotes(new Map(userVotes.set(pollId, 'yes')));
          return;
        }
      }

      toast({
        title: "Initializing FHE",
        description: "Setting up encryption...",
      });

      // Initialize FHE SDK
      await initializeFHE();

      toast({
        title: "Encrypting Vote",
        description: "Encrypting your vote privately...",
      });

      // Encrypt the vote (true for YES, false for NO)
      const voteChoice = choice === 'yes';
      const { voteHandle, proof } = await encryptVote(voteChoice, address);

      console.log("Encrypted vote handle:", voteHandle);
      console.log("Proof:", proof);

      toast({
        title: "Submitting Vote",
        description: "Please confirm the transaction in your wallet",
      });

      // Call the contract to cast vote
      const hash = await walletClient.writeContract({
        address: POLL_VAULT_ADDRESS as `0x${string}`,
        abi: POLL_VAULT_ABI,
        functionName: "castCipherVote",
        args: [BigInt(pollId), voteHandle, proof],
      });

      console.log("Transaction submitted:", hash);

      toast({
        title: "Transaction Submitted",
        description: "Waiting for blockchain confirmation...",
      });

      // Wait for transaction confirmation
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log("Transaction confirmed:", receipt);

        if (receipt.status === 'success') {
          // Verify vote was recorded on-chain
          const hasVotedNow = await publicClient.readContract({
            address: POLL_VAULT_ADDRESS as `0x${string}`,
            abi: POLL_VAULT_ABI,
            functionName: "hasVoted",
            args: [BigInt(pollId), address],
          }) as boolean;

          if (!hasVotedNow) {
            throw new Error("Vote was not recorded on-chain. Please try again.");
          }

          toast({
            title: "Vote Cast Successfully",
            description: (
              <div className="flex flex-col gap-2">
                <p>Your {choice.toUpperCase()} vote has been recorded privately</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View on Etherscan →
                </a>
              </div>
            ),
          });

          // Update local state only after verifying on-chain
          setUserVotes(new Map(userVotes.set(pollId, choice)));
        } else {
          throw new Error("Transaction failed on blockchain");
        }
      }
    } catch (error: any) {
      console.error("Voting error:", error);
      toast({
        title: "Voting Failed",
        description: error.message || "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Vote className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PollVault</h1>
                <p className="text-sm text-muted-foreground">FHE-Powered Private Voting</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {address && (
                <Link to="/history">
                  <Button variant="outline" size="sm" className="gap-2">
                    <History className="w-4 h-4" />
                    Vote History
                  </Button>
                </Link>
              )}
              <CreatePollDialog onCreatePoll={handleCreatePoll} userAddress={address} />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Wrong Network Alert */}
        {wrongNetwork && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-destructive">
                Wrong network detected. Please switch to Sepolia testnet to use this app.
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (switchChain) {
                    switchChain({ chainId: sepolia.id });
                  }
                }}
              >
                Switch to Sepolia
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Contract Info Banner */}
        {POLL_VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000" && (
          <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Contract:</span>{" "}
              <a
                href={`https://sepolia.etherscan.io/address/${POLL_VAULT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-mono text-xs"
              >
                {POLL_VAULT_ADDRESS}
              </a>
            </p>
          </div>
        )}

        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <ListChecks className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Polls</p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : polls.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <Vote className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Active Polls</p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : polls.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary"></div>
              <div>
                <p className="text-sm text-muted-foreground">Your Votes</p>
                <p className="text-2xl font-bold text-foreground">{userVotes.size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Polls List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {loading ? "Loading polls..." : "Active Polls"}
          </h2>

          {loading ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading polls from blockchain...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No polls found. Create one to get started!</p>
            </div>
          ) : (
            polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={handleVote}
                hasVoted={userVotes.has(poll.id)}
                userAddress={address}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Built with FHE • Powered by Zama fhEVM on Sepolia
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
