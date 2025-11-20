import { Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Poll } from "@/types/poll";
import { formatDistanceToNow } from "date-fns";

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, choice: 'yes' | 'no') => void;
  hasVoted: boolean;
  userAddress?: string;
}

export const PollCard = ({ poll, onVote, hasVoted, userAddress }: PollCardProps) => {
  const totalVotes = poll.yesVotes + poll.noVotes;
  const yesPercentage = totalVotes > 0 ? (poll.yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (poll.noVotes / totalVotes) * 100 : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border bg-card">
      <div className="flex items-center gap-6">
        {/* Poll Number/Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
            #{poll.id.slice(0, 3)}
          </div>
        </div>

        {/* Poll Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
                {poll.question}
              </h3>
              {poll.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {poll.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(poll.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-yes transition-all duration-500 flex items-center justify-start px-3"
                style={{ width: `${yesPercentage}%` }}
              >
                {yesPercentage > 15 && (
                  <span className="text-xs font-semibold text-yes-foreground">
                    YES {yesPercentage.toFixed(0)}%
                  </span>
                )}
              </div>
              <div
                className="absolute right-0 top-0 h-full bg-no transition-all duration-500 flex items-center justify-end px-3"
                style={{ width: `${noPercentage}%` }}
              >
                {noPercentage > 15 && (
                  <span className="text-xs font-semibold text-no-foreground">
                    NO {noPercentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vote Buttons */}
          <div className="flex items-center gap-3">
            {!hasVoted && userAddress ? (
              <>
                <Button
                  onClick={() => onVote(poll.id, 'yes')}
                  className="flex-1 bg-yes hover:bg-yes/90 text-yes-foreground"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Vote Yes
                </Button>
                <Button
                  onClick={() => onVote(poll.id, 'no')}
                  className="flex-1 bg-no hover:bg-no/90 text-no-foreground"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Vote No
                </Button>
              </>
            ) : hasVoted ? (
              <Badge variant="secondary" className="px-4 py-2">
                You have voted
              </Badge>
            ) : (
              <Badge variant="outline" className="px-4 py-2">
                Connect wallet to vote
              </Badge>
            )}
            <Badge
              variant={poll.status === 'active' ? 'default' : 'secondary'}
              className="ml-auto"
            >
              {poll.status}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
