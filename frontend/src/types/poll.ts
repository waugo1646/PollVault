export interface Poll {
  id: number;
  title: string;
  description: string;
  creator: string;
  deadline: bigint;
  yesCount: bigint;
  noCount: bigint;
  revealedYes: bigint;
  revealedNo: bigint;
  revealed: boolean;
  publiclyDecryptable: boolean;
}

export interface VoteRecord {
  pollId: number;
  poll: Poll;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export interface PollStats {
  totalPolls: number;
  activePolls: number;
  votedPolls: number;
  createdPolls: number;
}

export interface Vote {
  pollId: string;
  voter: string;
  choice: 'yes' | 'no';
  timestamp: Date;
}
