"use client";

import { useMemo } from "react";
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
  const hasRegistered = votingDataArray?.[4] as boolean;

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
          <div className="mt-6 text-sm opacity-70 text-center">No voting address in URL.</div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-2xl space-y-4 mt-6">
              {showSwitchToBase && (
                <div className="alert alert-warning flex items-center justify-between">
                  <span>
                    This voting is deployed on Base, but your wallet is connected to Mainnet.
                    <br />
                    Please switch to Base to interact with this voting.
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
                    This voting is deployed on Mainnet, but your wallet is connected to Base.
                    <br />
                    Please switch to Mainnet to interact with this voting.
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
              <div className="flex flex-wrap gap-2 justify-between">
                {address && <AddVotersModal contractAddress={address} />}
                <div className="flex items-center gap-2">
                  {address && <ShowVotersModal contractAddress={address} />}
                </div>
              </div>
              <VotingStats contractAddress={address} />

              {!hasRegistered && <CreateCommitment leafEvents={leavesEvents} contractAddress={address} />}

              {hasRegistered && <CombinedVoteBurnerPaymaster contractAddress={address} leafEvents={leavesEvents} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
