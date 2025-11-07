"use client";

import { useEffect, useMemo, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const VotingStats = ({ contractAddress }: { contractAddress?: `0x${string}` }) => {
  const { data: votingStats } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingStats",
    address: contractAddress,
  });

  const { data: allVoteCounts } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getAllVoteCounts",
    address: contractAddress,
  });

  // address owner,
  // string memory question,
  // string[] memory options,
  // uint256 registrationDeadline,
  // uint256 votingEndTime
  const votingStatsArray = votingStats as unknown as any[];
  const voteCountsArray = allVoteCounts as unknown as bigint[];

  const owner = votingStatsArray?.[0] as string;
  const question = votingStatsArray?.[1] as string;
  const options = votingStatsArray?.[2] as string[];
  const registrationDeadline = votingStatsArray?.[3] as bigint;
  const votingEndTime = votingStatsArray?.[4] as bigint;

  const q = (question as string | undefined) || undefined;
  const opts = (options as string[] | undefined) || [];
  const counts = (voteCountsArray as bigint[] | undefined) || [];
  const totalVotes = counts.reduce((sum, count) => sum + (count ?? 0n), 0n);

  // Registration countdown (small and subtle)
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [votingTimeLeft, setVotingTimeLeft] = useState<string>("");

  const deadlineMs = useMemo(() => {
    try {
      return registrationDeadline ? Number(registrationDeadline) * 1000 : 0;
    } catch {
      return 0;
    }
  }, [registrationDeadline]);

  const votingEndMs = useMemo(() => {
    try {
      return votingEndTime ? Number(votingEndTime) * 1000 : 0;
    } catch {
      return 0;
    }
  }, [votingEndTime]);

  const format = (diff: number, closedText: string) => {
    if (diff <= 0) return closedText;
    const sec = Math.floor(diff / 1000);
    const days = Math.floor(sec / 86400);
    const hrs = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    const parts = [] as string[];
    if (days > 0) parts.push(`${days}d`);
    if (hrs > 0 || days > 0) parts.push(`${hrs}h`);
    parts.push(`${String(mins).padStart(2, "0")}m`);
    parts.push(`${String(secs).padStart(2, "0")}s`);
    return parts.join(" ");
  };

  useEffect(() => {
    if (!deadlineMs) {
      setTimeLeft("");
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, deadlineMs - now);
      setTimeLeft(format(diff, "Registration closed"));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, [deadlineMs]);

  useEffect(() => {
    if (!votingEndMs) {
      setVotingTimeLeft("");
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, votingEndMs - now);
      setVotingTimeLeft(format(diff, "Vote closed"));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, [votingEndMs]);

  // Determine which phase we're in
  const now = Date.now();
  const isRegistrationPhase = registrationDeadline && now < Number(registrationDeadline) * 1000;
  const isVotingPhase =
    registrationDeadline &&
    votingEndTime &&
    now >= Number(registrationDeadline) * 1000 &&
    now < Number(votingEndTime) * 1000;
  const isVotingClosed = votingEndTime && now >= Number(votingEndTime) * 1000;

  return (
    <div className="bg-base-100 shadow rounded-xl p-4 space-y-3">
      <div className="flex justify-end">
        {isRegistrationPhase && timeLeft && timeLeft !== "Registration closed" && (
          <span className="badge badge-primary badge-sm">Registration closes in {timeLeft}</span>
        )}
        {isVotingPhase && votingTimeLeft && votingTimeLeft !== "Vote closed" && (
          <span className="badge badge-success badge-sm">Vote ends in {votingTimeLeft}</span>
        )}
        {isVotingClosed && <span className="badge badge-error badge-sm">Vote closed</span>}
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold">{q || "Loading..."}</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-10 mt-2">
          <div className="flex flex-col sm:flex-row items-center gap-1">
            <span className="text-sm opacity-70">Vote contract:</span>
            <Address address={contractAddress} />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1">
            <span className="text-sm opacity-70">Owner:</span>
            <Address address={owner as `0x${string}`} />
          </div>
        </div>

        {(registrationDeadline || votingEndTime) && (
          <div className="mt-3 flex justify-center gap-6 text-sm">
            {registrationDeadline && (
              <div className="flex flex-col">
                <span className="opacity-50 text-xs">Registration Closes</span>
                <span className="font-medium">
                  {new Date(Number(registrationDeadline) * 1000).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {votingEndTime && (
              <div className="flex flex-col">
                <span className="opacity-50 text-xs">Vote Closes</span>
                <span className="font-medium">
                  {new Date(Number(votingEndTime) * 1000).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        <span className="text-xs opacity-70 block mt-2">Total Votes: {totalVotes.toString()}</span>
      </div>
      <div
        className={`grid gap-2 text-center ${opts.length <= 2 ? "grid-cols-2" : opts.length <= 4 ? "grid-cols-2" : "grid-cols-3"}`}
      >
        {opts.map((option, index) => {
          const count = counts[index] ?? 0n;
          const percentage = totalVotes > 0n ? Number((count * 100n) / totalVotes) : 0;
          return (
            <div key={index} className="rounded-lg border border-base-300 p-3">
              <div className="text-xs opacity-70 truncate" title={option}>
                {index + 1}. {option}
              </div>
              <div className="text-xl font-bold">{count.toString()}</div>
              <div className="text-xs opacity-70">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
