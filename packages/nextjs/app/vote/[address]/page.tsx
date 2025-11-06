"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useAccount } from "wagmi";
import AccentWrapper from "~~/app/_components/AccentWrapper";
import { AddVotersModal } from "~~/app/vote/_components/AddVotersModal";
import { CombinedVoteBurnerPaymaster } from "~~/app/vote/_components/CombinedVoteBurnerPaymaster";
import { CreateCommitment } from "~~/app/vote/_components/CreateCommitment";
import { ShowVotersModal } from "~~/app/vote/_components/ShowVotersModal";
import { VotingStats } from "~~/app/vote/_components/VotingStats";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getStoredVoteMetadata } from "~~/utils/localStorage";

interface LeavesData {
  leaves: {
    items: {
      votingAddress: string;
      index: string;
      value: string;
    }[];
  };
}

async function fetchLeaves(votingAddress: string, limit = 200) {
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const LeavesQuery = gql/* GraphQL */ `
    query BaseLeaves($addr: String!, $limit: Int = 200) {
      leaves: baseLeavess(where: { votingAddress: $addr }, orderBy: "indexNum", orderDirection: "desc", limit: $limit) {
        items {
          votingAddress
          index
          value
        }
      }
    }
  `;
  const data = await request<LeavesData>(endpoint, LeavesQuery, {
    addr: votingAddress.toLowerCase(),
    limit,
  });
  return data.leaves.items;
}

export default function VotingByAddressPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const address = params?.address as `0x${string}` | undefined;
  const { address: userAddress } = useAccount();

  // Guard: no address in URL yet
  const enabled = Boolean(address && address.length === 42);

  // Read voting data to check if user has registered
  const { data: votingData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingData",
    args: [userAddress],
    address: address,
  });

  const votingDataArray = votingData as unknown as any[];
  const isVoter = votingDataArray?.[3] as boolean;
  const hasRegistered = votingDataArray?.[4] as boolean;
  const registrationDeadline = votingDataArray?.[5] as bigint;
  const votingEndTime = votingDataArray?.[6] as bigint;

  // Get voting stats to access options
  const { data: votingStats } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingStats",
    address: address,
  });
  const votingStatsArray = votingStats as unknown as any[];
  const options = (votingStatsArray?.[2] as string[]) || [];

  // Check if voting is still open
  const now = Math.floor(Date.now() / 1000);
  const isRegistrationOpen = registrationDeadline && now <= Number(registrationDeadline);
  const isVotingOpen =
    registrationDeadline && votingEndTime && now > Number(registrationDeadline) && now <= Number(votingEndTime);

  // Check if user has voted (continuously check localStorage)
  const [votedChoice, setVotedChoice] = useState<number | null>(null);
  useEffect(() => {
    if (address && userAddress) {
      const checkVoteStatus = () => {
        const voteMeta = getStoredVoteMetadata(address, userAddress);
        if (voteMeta && voteMeta.status === "success" && typeof voteMeta.voteChoice === "number") {
          setVotedChoice(voteMeta.voteChoice);
        }
      };

      // Check immediately
      checkVoteStatus();

      // Check every 2 seconds to catch when user votes
      const interval = setInterval(checkVoteStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [address, userAddress]);

  const { data } = useQuery({
    queryKey: ["leavess", address],
    queryFn: () => fetchLeaves(address!),
    enabled,
    // light polling so UI picks up rows soon after indexer writes them
    refetchInterval: 2000,
  });

  // Map GraphQL rows -> viem-like event array your components use
  const leavesEvents = useMemo(
    () =>
      (data ?? []).map((row, i) => ({
        args: {
          index: BigInt(row.index),
          value: BigInt(row.value),
        },
        logIndex: i,
        // I dont understand why this is needed, but it is
        blockNumber: 0n,
        blockHash: "0x0" as `0x${string}`,
        transactionHash: "0x0" as `0x${string}`,
        removed: false,
        address: "0x0" as `0x${string}`,
        data: "0x0" as `0x${string}`,
        topics: ["0x0"] as [`0x${string}`, ...`0x${string}`[]],
        transactionIndex: 0,
      })),
    [data],
  );

  return (
    <>
      <AccentWrapper>
        <div className="py-10 lg:py-16"></div>
      </AccentWrapper>
      <div className="relative z-10 -mt-36 lg:-mt-64 mb-24">
        <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div>
            <Link href="/votes" className="btn btn-sm gap-2 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Votes
            </Link>
          </div>
          <div className="lg:col-span-4">
            {!enabled ? (
              <div className="mt-6 text-sm opacity-70 text-center">No vote address in URL.</div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="w-full max-w-3xl">
                  <div className="bg-base-100 shadow rounded-xl p-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {address && isRegistrationOpen && <AddVotersModal contractAddress={address} />}
                      <div className="flex items-center gap-2 ml-auto">
                        {address && <ShowVotersModal contractAddress={address} />}
                      </div>
                    </div>
                    <VotingStats contractAddress={address} />

                    {/* Show registration status or component (only during registration period) */}
                    {isRegistrationOpen &&
                      (hasRegistered === true ? (
                        <div className="border border-base-300 rounded-lg p-3 flex items-center gap-2">
                          <span className="text-base opacity-40">ℹ️</span>
                          <span className="text-xs opacity-60">
                            You have already registered for this vote. You can vote when the voting period opens.
                          </span>
                        </div>
                      ) : (
                        /* Only show registration component if user is on the allowlist and hasn't registered */
                        isVoter === true && <CreateCommitment leafEvents={leavesEvents} contractAddress={address} />
                      ))}

                    {/* Show "Already voted" banner if user has voted */}
                    {votedChoice !== null ? (
                      <div className="border border-base-300 rounded-lg p-3 flex items-center gap-2">
                        <span className="text-base opacity-40">✓</span>
                        <span className="text-xs opacity-60">
                          Already voted with {options[votedChoice] || "Unknown"} (Option {votedChoice + 1})
                        </span>
                      </div>
                    ) : (
                      /* Only show voting component if user is on the allowlist, has registered, voting is open, and hasn't voted */
                      isVoter === true &&
                      hasRegistered &&
                      isVotingOpen && (
                        <CombinedVoteBurnerPaymaster contractAddress={address} leafEvents={leavesEvents} />
                      )
                    )}

                    {/* Show message if user is not on the allowlist */}
                    {userAddress && isVoter === false && (
                      <div className="border border-base-300 rounded-lg p-3 flex items-center gap-2">
                        <span className="text-base opacity-40">ℹ️</span>
                        <span className="text-xs opacity-60">
                          You are not on the allowlist for this vote. Only approved addresses can register and vote.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
