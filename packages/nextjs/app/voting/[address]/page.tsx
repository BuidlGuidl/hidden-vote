"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { base, mainnet } from "viem/chains";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { AddVotersModal } from "~~/app/voting/_components/AddVotersModal";
import { CombinedVoteBurnerPaymaster } from "~~/app/voting/_components/CombinedVoteBurnerPaymaster";
import { CreateCommitment } from "~~/app/voting/_components/CreateCommitment";
import { ShowVotersModal } from "~~/app/voting/_components/ShowVotersModal";
import { VotingStats } from "~~/app/voting/_components/VotingStats";
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

async function fetchLeaves(votingAddress: string, isBase: boolean, limit = 200) {
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const LeavesQuery = isBase
    ? gql/* GraphQL */ `
        query BaseLeaves($addr: String!, $limit: Int = 200) {
          leaves: baseLeavess(
            where: { votingAddress: $addr }
            orderBy: "indexNum"
            orderDirection: "desc"
            limit: $limit
          ) {
            items {
              votingAddress
              index
              value
            }
          }
        }
      `
    : gql/* GraphQL */ `
        query MainnetLeaves($addr: String!, $limit: Int = 200) {
          leaves: mainnetLeavess(
            where: { votingAddress: $addr }
            orderBy: "indexNum"
            orderDirection: "desc"
            limit: $limit
          ) {
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
  const { chain, address: userAddress } = useAccount();
  const isBase = chain?.id === base.id;
  const baseClient = usePublicClient({ chainId: base.id });
  const mainnetClient = usePublicClient({ chainId: mainnet.id });
  const { switchChain } = useSwitchChain();

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
    queryKey: ["leavess", address, chain?.id],
    queryFn: () => fetchLeaves(address!, Boolean(isBase)),
    enabled,
    // light polling so UI picks up rows soon after indexer writes them
    refetchInterval: 2000,
  });

  // Detect on which network this contract address is deployed
  const { data: baseBytecode } = useQuery({
    queryKey: ["bytecode", "base", address],
    queryFn: async () => (await baseClient!.getCode({ address: address! })) ?? "0x",
    enabled: enabled && Boolean(baseClient),
    staleTime: 60_000,
  });
  const { data: mainnetBytecode } = useQuery({
    queryKey: ["bytecode", "mainnet", address],
    queryFn: async () => (await mainnetClient!.getCode({ address: address! })) ?? "0x",
    enabled: enabled && Boolean(mainnetClient),
    staleTime: 60_000,
  });

  const contractOnBase = Boolean(baseBytecode && baseBytecode !== "0x");
  const contractOnMainnet = Boolean(mainnetBytecode && mainnetBytecode !== "0x");
  const showSwitchToBase = chain?.id === mainnet.id && contractOnBase && !contractOnMainnet;
  const showSwitchToMainnet = chain?.id === base.id && contractOnMainnet && !contractOnBase;

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
    <div className="flex items-center justify-center flex-col grow pt-6 w-full">
      <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto">
        <Link href="/votings" className="btn btn-sm btn-ghost gap-2 mb-4">
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
          Back to Home
        </Link>
        {!enabled ? (
          <div className="mt-6 text-sm opacity-70 text-center">No vote address in URL.</div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-2xl space-y-4 mt-6">
              {showSwitchToBase && (
                <div className="alert alert-warning flex items-center justify-between">
                  <span>
                    This vote is deployed on Base, but your wallet is connected to Mainnet.
                    <br />
                    Please switch to Base to interact with this vote.
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => switchChain?.({ chainId: base.id })}
                  >
                    Switch to Base
                  </button>
                </div>
              )}

              {showSwitchToMainnet && (
                <div className="alert alert-warning flex items-center justify-between">
                  <span>
                    This vote is deployed on Mainnet, but your wallet is connected to Base.
                    <br />
                    Please switch to Mainnet to interact with this vote.
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => switchChain?.({ chainId: mainnet.id })}
                  >
                    Switch to Mainnet
                  </button>
                </div>
              )}
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
                  <div className="alert alert-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-current shrink-0 w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>You have already registered for this vote. You can vote when the voting period opens.</span>
                  </div>
                ) : (
                  /* Only show registration component if user is on the allowlist and hasn't registered */
                  isVoter === true && <CreateCommitment leafEvents={leavesEvents} contractAddress={address} />
                ))}

              {/* Show "Already voted" banner if user has voted */}
              {votedChoice !== null ? (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Already voted with {options[votedChoice] || "Unknown"} (Option {votedChoice + 1})
                  </span>
                </div>
              ) : (
                /* Only show voting component if user is on the allowlist, has registered, voting is open, and hasn't voted */
                isVoter === true &&
                hasRegistered &&
                isVotingOpen && <CombinedVoteBurnerPaymaster contractAddress={address} leafEvents={leavesEvents} />
              )}

              {/* Show message if user is not on the allowlist */}
              {userAddress && isVoter === false && (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    You are not on the allowlist for this vote. Only approved addresses can register and vote.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
