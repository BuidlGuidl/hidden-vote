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
  // uint256 registrationDeadline
  const votingStatsArray = votingStats as unknown as any[];
  const voteCountsArray = allVoteCounts as unknown as bigint[];

  const owner = votingStatsArray?.[0] as string;
  const question = votingStatsArray?.[1] as string;
  const options = votingStatsArray?.[2] as string[];
  const registrationDeadline = votingStatsArray?.[3] as bigint;

  const q = (question as string | undefined) || undefined;
  const opts = (options as string[] | undefined) || [];
  const counts = (voteCountsArray as bigint[] | undefined) || [];
  const totalVotes = counts.reduce((sum, count) => sum + (count ?? 0n), 0n);

  // Registration countdown (small and subtle)
  const [timeLeft, setTimeLeft] = useState<string>("");
  const deadlineMs = useMemo(() => {
    try {
      return registrationDeadline ? Number(registrationDeadline) * 1000 : 0;
    } catch {
      return 0;
    }
  }, [registrationDeadline]);

  useEffect(() => {
    if (!deadlineMs) {
      setTimeLeft("");
      return;
    }

    const format = (diff: number) => {
      if (diff <= 0) return "Registration closed";
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

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, deadlineMs - now);
      setTimeLeft(format(diff));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, [deadlineMs]);

  return (
    <div className="bg-base-100 shadow rounded-xl p-4 space-y-3">
      {timeLeft ? (
        <div className="flex justify-end">
          {timeLeft === "Registration closed" ? (
            <span className="badge badge-warning badge-sm">Registration closed</span>
          ) : (
            <span className="badge badge-primary badge-sm">Reg closes in {timeLeft}</span>
          )}
        </div>
      ) : null}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{q || "Loading..."}</h2>
        <div className="flex justify-center gap-10">
          <div>
            Voting contract: <Address address={contractAddress} />
          </div>
          <div>
            Owner: <Address address={owner as `0x${string}`} />
          </div>
        </div>
        <span className="text-xs opacity-70">Total Votes: {totalVotes.toString()}</span>
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
      <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden flex">
        {opts.map((_, index) => {
          const count = counts[index] ?? 0n;
          const percentage = totalVotes > 0n ? Number((count * 100n) / totalVotes) : 0;
          return <div key={index} className="h-2 bg-primary" style={{ width: `${percentage}%` }} />;
        })}
      </div>
    </div>
  );
};
