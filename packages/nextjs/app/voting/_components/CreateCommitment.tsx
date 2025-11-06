"use client";

import { useEffect, useState } from "react";
import { Fr } from "@aztec/bb.js";
import { ethers } from "ethers";
import { poseidon2 } from "poseidon-lite";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { saveCommitmentToLocalStorage } from "~~/utils/scaffold-eth";

interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  encoded: string;
}

interface CreateCommitmentProps {
  leafEvents?: any[];
  contractAddress?: `0x${string}`;
}

export const CreateCommitment = ({ leafEvents = [], contractAddress }: CreateCommitmentProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { setCommitmentData, commitmentData } = useGlobalState();

  const { address: userAddress, isConnected } = useAccount();
  const [nowSec, setNowSec] = useState<number>(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: votingData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingData",
    args: [userAddress],
    address: contractAddress,
  });

  const votingDataArray = votingData as unknown as any[];
  const isVoter = votingDataArray?.[3] as boolean;
  const hasRegistered = votingDataArray?.[4] as boolean;
  const registrationDeadline = votingDataArray?.[5] as bigint;
  const now = BigInt(nowSec);
  const isRegistrationOpen = typeof registrationDeadline === "bigint" ? now <= registrationDeadline : true;

  const canRegister = Boolean(isConnected && isVoter !== false && hasRegistered !== true && isRegistrationOpen);

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "Voting",
    address: contractAddress,
  });

  // const { writeContractAsync } = useWriteContract();
  // const writeTx = useTransactor();

  const handleGenerateCommitment = async () => {
    setIsGenerating(true);
    try {
      const data = await generateCommitment();
      setCommitmentData(data);
      return data;
    } catch (error) {
      console.error("Error generating commitment:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertCommitment = async (dataOverride?: CommitmentData) => {
    const localData = dataOverride || commitmentData;
    if (!localData) return;

    setIsInserting(true);
    try {
      await writeContractAsync(
        {
          functionName: "insert",
          args: [BigInt(localData.commitment)],
        },
        {
          blockConfirmations: 1,
          onBlockConfirmation: () => {
            if (leafEvents) {
              const newIndex = leafEvents.length;
              const updatedData = { ...localData, index: newIndex };
              setCommitmentData(updatedData);
              setShowSuccess(true);

              saveCommitmentToLocalStorage(updatedData, contractAddress, userAddress);

              // Hide success message after 10 seconds
              setTimeout(() => setShowSuccess(false), 10000);
            }
          },
        },
      );
    } catch (error) {
      console.error("Error inserting commitment:", error);
    } finally {
      setIsInserting(false);
    }
  };

  const handleRegister = async () => {
    const data = await handleGenerateCommitment();
    await handleInsertCommitment(data);
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-5">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold">Register for this vote</h2>
      </div>

      {showSuccess && (
        <div className="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Registration successful! You can now vote when the voting period opens.</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          className={`btn btn-lg ${
            hasRegistered === true
              ? "btn-success cursor-not-allowed"
              : isGenerating || isInserting
                ? "btn-primary"
                : !canRegister
                  ? "btn-disabled"
                  : "btn-primary"
          }`}
          onClick={hasRegistered === true ? undefined : handleRegister}
          disabled={isGenerating || isInserting || !canRegister}
        >
          {isGenerating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Generating commitment...
            </>
          ) : isInserting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              registering...
            </>
          ) : !isConnected ? (
            "Connect wallet to register"
          ) : isVoter === false ? (
            "Not eligible - not on voters list"
          ) : hasRegistered === true ? (
            "✓ Already registered for this vote"
          ) : !isRegistrationOpen ? (
            "Registration closed"
          ) : (
            "Register to vote"
          )}
        </button>
      </div>
    </div>
  );
};

const generateCommitment = async (): Promise<CommitmentData> => {
  // const bb = await Barretenberg.new();
  const nullifier = BigInt(Fr.random().toString());
  const secret = BigInt(Fr.random().toString());

  const commitment = poseidon2([nullifier, secret]);

  // Convert BigInt values to properly formatted bytes32 hex strings
  const commitmentHex = ethers.zeroPadValue(ethers.toBeHex(commitment), 32);
  const nullifierHex = ethers.zeroPadValue(ethers.toBeHex(nullifier), 32);
  const secretHex = ethers.zeroPadValue(ethers.toBeHex(secret), 32);

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "bytes32", "bytes32"],
    [commitmentHex, nullifierHex, secretHex],
  );

  return {
    commitment: commitmentHex,
    nullifier: nullifierHex,
    secret: secretHex,
    encoded,
  };
};
