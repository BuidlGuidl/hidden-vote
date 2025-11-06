"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type VotingStatusProps = {
  votingAddress: `0x${string}`;
};

const VotingStatus = ({ votingAddress }: VotingStatusProps) => {
  const { data: votingStats } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingStats",
    address: votingAddress,
  });

  if (!votingStats) {
    return <div className="h-6" />;
  }

  const votingStatsArray = votingStats as unknown as any[];
  const registrationDeadline = votingStatsArray?.[3] as bigint;
  const votingEndTime = votingStatsArray?.[4] as bigint;

  if (!registrationDeadline || !votingEndTime) {
    return <div className="h-6" />;
  }

  const now = Math.floor(Date.now() / 1000);
  const regDeadline = Number(registrationDeadline);
  const voteEndTime = Number(votingEndTime);

  // Determine which phase we're in
  const isRegistrationPhase = now < regDeadline;
  const isVotingPhase = now >= regDeadline && now < voteEndTime;
  const isVotingClosed = now >= voteEndTime;

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="flex items-center gap-2 h-6">
      {isRegistrationPhase && (
        <>
          <div className="badge badge-primary badge-sm">Registration Open</div>
          <span className="text-xs opacity-60">{formatTimeLeft(regDeadline - now)}</span>
        </>
      )}
      {isVotingPhase && (
        <>
          <div className="badge badge-success badge-sm">Vote Open</div>
          <span className="text-xs opacity-60">{formatTimeLeft(voteEndTime - now)}</span>
        </>
      )}
      {isVotingClosed && <div className="badge badge-error badge-sm">Vote Closed</div>}
    </div>
  );
};

export default VotingStatus;
