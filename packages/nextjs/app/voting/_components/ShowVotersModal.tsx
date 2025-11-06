"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { EyeIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type ShowVotersModalProps = {
  contractAddress: `0x${string}`;
};

type VoterRow = { votingAddress: string; voter: string };
type NetworkVotersData = { voters: { items: VoterRow[] } };

async function fetchVoters(votingAddress: string) {
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const VotersQuery = gql`
    query BaseVoters {
      voters: baseVoterss {
        items {
          voter
          votingAddress
        }
      }
    }
  `;
  const data = await request<NetworkVotersData>(endpoint, VotersQuery);
  const items = data?.voters?.items ?? [];
  return items.filter(row => row.votingAddress?.toLowerCase() === votingAddress.toLowerCase());
}

export const ShowVotersModal = ({ contractAddress }: ShowVotersModalProps) => {
  const [allowedVoters, setAllowedVoters] = useState<string[]>([]);

  // Fetch all voters using GraphQL query - always from Base network
  const {
    data: voterData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["voters", contractAddress],
    queryFn: () => fetchVoters(contractAddress),
    enabled: Boolean(contractAddress && contractAddress.length === 42),
    // light polling so UI picks up new voters soon after indexer writes them
    refetchInterval: 2000,
    // Don't retry on errors to avoid spamming
    retry: false,
  });

  // Get unique voter addresses from the data
  const uniqueVoters = useMemo(() => {
    if (!voterData) return [];

    // Get unique addresses from the voter data
    const addresses = Array.from(new Set(voterData.map(row => row.voter)));
    return addresses;
  }, [voterData]);

  // Component to check individual voter status and report back
  const VoterStatusChecker = ({
    userAddress,
    onStatusChecked,
  }: {
    userAddress: string;
    onStatusChecked: (address: string, isAllowed: boolean) => void;
  }) => {
    const { data: votingData } = useScaffoldReadContract({
      contractName: "Voting",
      functionName: "getVotingData",
      args: [userAddress],
      address: contractAddress,
    });

    const votingDataArray = votingData as unknown as any[];
    const isVoter = votingDataArray?.[3] as boolean;

    useEffect(() => {
      if (votingData !== undefined) {
        onStatusChecked(userAddress, isVoter);
      }
    }, [votingData, isVoter, userAddress, onStatusChecked]);

    return null;
  };

  // Update allowed voters list as statuses come in
  const handleStatusChecked = (address: string, isAllowed: boolean) => {
    setAllowedVoters(prev => {
      if (isAllowed && !prev.includes(address)) {
        return [...prev, address];
      } else if (!isAllowed && prev.includes(address)) {
        return prev.filter(a => a !== address);
      }
      return prev;
    });
  };

  // Component to display individual voter
  const VoterDisplay = ({ userAddress }: { userAddress: string }) => {
    const { data: votingData } = useScaffoldReadContract({
      contractName: "Voting",
      functionName: "getVotingData",
      args: [userAddress],
      address: contractAddress,
    });

    const votingDataArray = votingData as unknown as any[];
    const hasRegistered = votingDataArray?.[4] as boolean;

    return (
      <div className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
        <div className="flex-1">
          <Address address={userAddress as `0x${string}`} />
        </div>
        <div className="flex items-center justify-center w-24">
          {hasRegistered ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-success"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-error"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Hidden components to check voter statuses */}
      {uniqueVoters.map(voterAddress => (
        <VoterStatusChecker
          key={`checker-${voterAddress}`}
          userAddress={voterAddress}
          onStatusChecked={handleStatusChecked}
        />
      ))}

      <label htmlFor="show-voters-modal" className="btn btn-outline btn-sm font-normal gap-1">
        <UsersIcon className="h-4 w-4" />
        <span>View Voters ({allowedVoters.length})</span>
      </label>
      <input type="checkbox" id="show-voters-modal" className="modal-toggle" />
      <label htmlFor="show-voters-modal" className="modal cursor-pointer">
        <label className="modal-box relative max-w-3xl">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <EyeIcon className="h-5 w-5" />
            All Voters
          </h3>
          <label htmlFor="show-voters-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-70">List of all allowed voters for this proposal.</p>
              <div className="stats stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Voters</div>
                  <div className="stat-value text-lg">{allowedVoters.length}</div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
                <span className="ml-2">Loading voters...</span>
              </div>
            ) : error ? (
              <div className="alert alert-warning">
                <span>Error loading voters: {error.message}</span>
              </div>
            ) : allowedVoters.length === 0 ? (
              <div className="text-center py-8 opacity-70">
                <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No allowed voters found.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-base-300">
                  <div className="flex-1 text-sm font-medium opacity-80">Voter Address</div>
                  <div className="w-24 text-center text-sm font-medium opacity-80">Registered</div>
                </div>
                <div className="space-y-2">
                  {allowedVoters.map((voterAddress, index) => (
                    <VoterDisplay key={`${voterAddress}-${index}`} userAddress={voterAddress} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end items-center pt-4 border-t border-base-300">
              <label htmlFor="show-voters-modal" className="btn btn-primary btn-sm">
                Close
              </label>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
