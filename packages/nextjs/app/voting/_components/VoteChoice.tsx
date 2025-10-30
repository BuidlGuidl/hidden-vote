"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

export const VoteChoice = ({ contractAddress }: { contractAddress?: `0x${string}` }) => {
  const voteChoice = useGlobalState(state => state.voteChoice);
  const setVoteChoice = useGlobalState(state => state.setVoteChoice);

  const { data: votingStats } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingStats",
    address: contractAddress,
  });

  const votingStatsArray = votingStats as unknown as any[];
  const options = (votingStatsArray?.[2] as string[]) || [];

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold">Choose your vote</h2>
      </div>
      <div
        className={`grid gap-3 ${
          options.length <= 2 ? "grid-cols-2" : options.length <= 4 ? "grid-cols-2" : "grid-cols-3"
        }`}
      >
        {options.map((option, index) => (
          <button
            key={index}
            className={`btn btn-lg ${voteChoice === index ? "btn-primary" : "btn-outline"}`}
            onClick={() => setVoteChoice(index)}
          >
            <div className="flex flex-col items-center">
              <span className="text-xs opacity-70">Option {index + 1}</span>
              <span className="truncate max-w-full font-normal">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
