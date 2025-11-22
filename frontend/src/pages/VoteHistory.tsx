import { useState, useEffect } from "react";
import { useAccount, useReadContract, usePublicClient, useSwitchChain } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, TrendingUp, Vote, History, ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import { POLL_VAULT_ADDRESS } from "@/config/contracts";
import { POLL_VAULT_ABI } from "@/config/abi";
import { Link } from "react-router-dom";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

interface VotedPoll {
  id: number;
  title: string;
  description: string;
  creator: string;
  deadline: bigint;
  revealedYes: number;
  revealedNo: number;
  revealed: boolean;
  status: 'active' | 'ended';
}

export default function VoteHistory() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const [votedPolls, setVotedPolls] = useState<VotedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [stats, setStats] = useState({
    totalVoted: 0,
    activeVoted: 0,
    endedVoted: 0,
  });

  // Get total number of polls
  const { data: nextPollId } = useReadContract({
    address: POLL_VAULT_ADDRESS as `0x${string}`,
    abi: POLL_VAULT_ABI,
    functionName: "nextPollId",
  });

  // Check if user is on the correct network
  useEffect(() => {
    if (isConnected && chain) {
      setWrongNetwork(chain.id !== sepolia.id);
    } else {
      setWrongNetwork(false);
    }
  }, [isConnected, chain]);

  // Fetch user's vote history from contract
  useEffect(() => {
    const fetchVoteHistory = async () => {
      if (!isConnected || !address || !nextPollId || !publicClient) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const totalPolls = Number(nextPollId);
        const polls: VotedPoll[] = [];
        let activeCount = 0;
        let endedCount = 0;

        // Check each poll to see if user has voted
        for (let i = 0; i < totalPolls; i++) {
          try {
            // Check if user has voted in this poll
            const hasVoted = await publicClient.readContract({
              address: POLL_VAULT_ADDRESS as `0x${string}`,
              abi: POLL_VAULT_ABI,
              functionName: "hasVoted",
              args: [BigInt(i), address],
            }) as boolean;

            if (hasVoted) {
              // Fetch poll details
              const pollData = await publicClient.readContract({
                address: POLL_VAULT_ADDRESS as `0x${string}`,
                abi: POLL_VAULT_ABI,
                functionName: "polls",
                args: [BigInt(i)],
              }) as any;

              const now = Math.floor(Date.now() / 1000);
              const deadline = Number(pollData[3] || 0);
              const isActive = deadline > now;

              const poll: VotedPoll = {
                id: i,
                title: pollData[0] || `Poll #${i}`,
                description: pollData[1] || "",
                creator: pollData[2] || "0x0000000000000000000000000000000000000000",
                deadline: BigInt(deadline),
                revealedYes: pollData[8] ? Number(pollData[6] || 0) : 0,
                revealedNo: pollData[8] ? Number(pollData[7] || 0) : 0,
                revealed: pollData[8] || false,
                status: isActive ? 'active' : 'ended',
              };

              polls.push(poll);

              if (isActive) {
                activeCount++;
              } else {
                endedCount++;
              }
            }
          } catch (error) {
            console.error(`Error fetching poll ${i}:`, error);
          }
        }

        setVotedPolls(polls.reverse()); // Show newest first
        setStats({
          totalVoted: polls.length,
          activeVoted: activeCount,
          endedVoted: endedCount,
        });
      } catch (error) {
        console.error("Error fetching vote history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoteHistory();
  }, [isConnected, address, nextPollId, publicClient]);

  const getPollStatus = (deadline: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    return Number(deadline) > now ? "active" : "ended";
  };

  const getTimeRemaining = (deadline: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(deadline) - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Vote className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">PollVault</h1>
              </Link>
              <ConnectButton />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertDescription>
              Please connect your wallet to view your vote history.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Vote className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PollVault</h1>
                <p className="text-sm text-muted-foreground">Vote History</p>
              </div>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Polls
        </Link>

        {/* Wrong Network Alert */}
        {wrongNetwork && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-destructive">
                Wrong network detected. Please switch to Sepolia testnet.
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVoted}</div>
              <p className="text-xs text-muted-foreground">
                You voted in {stats.totalVoted} {stats.totalVoted === 1 ? "poll" : "polls"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.activeVoted}</div>
              <p className="text-xs text-muted-foreground">
                Still voting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ended Polls</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.endedVoted}</div>
              <p className="text-xs text-muted-foreground">
                Voting closed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vote Records */}
        <Card>
          <CardHeader>
            <CardTitle>Your Voting Activity</CardTitle>
            <CardDescription>
              Polls you've participated in and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : votedPolls.length === 0 ? (
              <div className="text-center py-12">
                <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No voting history yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start participating in polls to build your voting record
                </p>
                <Link to="/">
                  <Button className="mt-4">Browse Polls</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {votedPolls.map((poll) => {
                  const timeInfo = getTimeRemaining(poll.deadline);
                  const totalVotes = poll.revealedYes + poll.revealedNo;
                  const yesPercentage = totalVotes > 0 ? (poll.revealedYes / totalVotes) * 100 : 0;
                  const noPercentage = totalVotes > 0 ? (poll.revealedNo / totalVotes) * 100 : 0;

                  return (
                    <div
                      key={poll.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        poll.status === "active"
                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : "bg-gradient-to-br from-gray-500 to-slate-500"
                      }`}>
                        {poll.status === "active" ? (
                          <TrendingUp className="w-6 h-6 text-white" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {poll.title}
                          </h3>
                          <Badge variant={poll.status === "active" ? "default" : "secondary"}>
                            {poll.status === "active" ? "Active" : "Ended"}
                          </Badge>
                          {poll.revealed && (
                            <Badge variant="outline" className="bg-primary/10 border-primary/50">
                              Results Available
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {poll.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeInfo}
                          </span>
                        </div>

                        {/* Results Display */}
                        {poll.revealed && totalVotes > 0 && (
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-600 font-medium">YES: {poll.revealedYes} ({yesPercentage.toFixed(1)}%)</span>
                              <span className="text-red-600 font-medium">NO: {poll.revealedNo} ({noPercentage.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                              <div
                                className="bg-green-500"
                                style={{ width: `${yesPercentage}%` }}
                              ></div>
                              <div
                                className="bg-red-500"
                                style={{ width: `${noPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {poll.revealed && totalVotes === 0 && (
                          <p className="text-xs text-muted-foreground mt-2">No votes to reveal</p>
                        )}

                        {!poll.revealed && poll.status === "ended" && (
                          <p className="text-xs text-muted-foreground mt-2">Waiting for results to be revealed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
