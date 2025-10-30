"use client";

import { useEffect, useMemo, useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { EntryPointVersion, entryPoint07Address } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import {
  type AllowedChainIds,
  getAlchemyHttpUrl,
  getStoredProofMetadata,
  getStoredVoteMetadata,
  hasStoredProof,
  loadCommitmentFromLocalStorage,
  notification,
  saveProofToLocalStorage,
  saveVoteToLocalStorage,
  updateVoteInLocalStorage,
} from "~~/utils/scaffold-eth";

export const CombinedVoteBurnerPaymaster = ({
  contractAddress,
  leafEvents = [],
}: {
  contractAddress?: `0x${string}`;
  leafEvents?: any[];
}) => {
  const { commitmentData, voteChoice, setVoteChoice, setProofData, setCommitmentData } = useGlobalState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStoredProofData, setHasStoredProofData] = useState(false);
  const [storedVoteChoice, setStoredVoteChoice] = useState<number | null>(null);
  const [loadedCommitmentData, setLoadedCommitmentData] = useState<any>(null);
  const [voteStatus, setVoteStatus] = useState<"pending" | "success" | "failed" | null>(null);
  const [voteMeta, setVoteMeta] = useState<any>(null);
  const [isTxDetailsOpen, setIsTxDetailsOpen] = useState(false);
  const { address: userAddress, isConnected, chain } = useAccount();
  const [nowSec, setNowSec] = useState<number>(Math.floor(Date.now() / 1000));
  const selectedNetwork = useSelectedNetwork(chain?.id as AllowedChainIds | undefined);
  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";
  const { CHAIN_USED, HTTP_CLIENT_USED, pimlicoUrl } = useMemo(() => {
    const chainUsed = selectedNetwork;
    const alchemyHttpUrl = getAlchemyHttpUrl(chainUsed.id);
    const httpClientUsed = alchemyHttpUrl || selectedNetwork.rpcUrls?.default?.http?.[0] || "";
    const pimlico = `https://api.pimlico.io/v2/${chainUsed.id}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;
    return { CHAIN_USED: chainUsed, HTTP_CLIENT_USED: httpClientUsed, pimlicoUrl: pimlico };
  }, [selectedNetwork]);

  const { data: votingData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingData",
    args: [userAddress],
    address: contractAddress,
  });

  const { data: votingStats } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingStats",
    address: contractAddress,
  });

  const votingDataArray = votingData as unknown as any[];
  const depth = Number(votingDataArray?.[1] ?? 0);
  const root = votingDataArray?.[2] as bigint;
  const isVoter = votingDataArray?.[3] as boolean;
  const hasRegistered = votingDataArray?.[4] as boolean;
  const registrationDeadline = votingDataArray?.[5] as bigint;
  const now = BigInt(nowSec);
  const isVotingOpen = typeof registrationDeadline === "bigint" ? now > registrationDeadline : false;

  const votingStatsArray = votingStats as unknown as any[];
  const options = (votingStatsArray?.[2] as string[]) || [];

  const { data: contractInfo } = useDeployedContractInfo({ contractName: "Voting" });

  const canVoteEligible = Boolean(isConnected && isVoter === true && hasRegistered === true);
  const canVote = Boolean(canVoteEligible && isVotingOpen);
  const selectionLocked = Boolean(hasStoredProofData && voteStatus !== "failed");

  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const hasProof = hasStoredProof(contractAddress, userAddress);
    setHasStoredProofData(hasProof);

    if (hasProof) {
      const storedProofMetadata = getStoredProofMetadata(contractAddress, userAddress);
      setStoredVoteChoice(storedProofMetadata?.voteChoice ?? null);
    } else {
      setStoredVoteChoice(null);
    }

    const meta = getStoredVoteMetadata(contractAddress, userAddress);
    setVoteStatus((meta?.status as any) ?? null);
    setVoteMeta(meta ?? null);

    setIsSubmitting(false);
  }, [contractAddress, userAddress]);

  useEffect(() => {
    if (!contractAddress || !userAddress) return;
    const onStorage = () => {
      const meta = getStoredVoteMetadata(contractAddress, userAddress);
      if (meta?.status) setVoteStatus(meta.status as any);
      if (typeof meta?.voteChoice === "number") setStoredVoteChoice(meta.voteChoice);
      setVoteMeta(meta ?? null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [contractAddress, userAddress]);

  useEffect(() => {
    if (voteStatus !== "pending") return;
    if (!contractAddress || !userAddress) return;
    const id = setInterval(() => {
      const meta = getStoredVoteMetadata(contractAddress, userAddress);
      if (meta?.status && meta.status !== "pending") {
        setVoteStatus(meta.status as any);
        if (typeof meta.voteChoice === "number") setStoredVoteChoice(meta.voteChoice);
        setVoteMeta(meta ?? null);
        clearInterval(id);
      }
    }, 1500);
    return () => clearInterval(id);
  }, [voteStatus, contractAddress, userAddress]);

  useEffect(() => {
    if (contractAddress && userAddress) {
      const storedCommitmentData = loadCommitmentFromLocalStorage(contractAddress, userAddress);
      if (storedCommitmentData) {
        setLoadedCommitmentData(storedCommitmentData);
        if (!commitmentData) {
          setCommitmentData(storedCommitmentData);
        }
      }
    }
  }, [contractAddress, userAddress, commitmentData, setCommitmentData]);

  useEffect(() => {
    setVoteChoice(null);
  }, [userAddress, setVoteChoice]);

  // Pimlico + ERC-4337 setup

  const pimlicoClient = useMemo(
    () =>
      createPimlicoClient({
        chain: CHAIN_USED,
        transport: http(pimlicoUrl),
        entryPoint: { address: entryPoint07Address, version: "0.7" as EntryPointVersion },
      }),
    [CHAIN_USED, pimlicoUrl],
  );

  const createSmartAccount = async () => {
    // Create a random owner and initialize a Safe-based smart account
    const privateKey = generatePrivateKey();
    const wallet = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({ chain: CHAIN_USED, transport: http(HTTP_CLIENT_USED) });

    const smartAccount = await toSafeSmartAccount({
      client: publicClient,
      owners: [wallet],
      version: "1.4.1",
    });

    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain: CHAIN_USED,
      bundlerTransport: http(pimlicoUrl),
      paymaster: pimlicoClient,
      userOperation: {
        estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
      },
    });

    return {
      smartAccountClient,
      accountAddress: smartAccount.address as `0x${string}`,
      burnerAddress: wallet.address as `0x${string}`,
    };
  };

  const handleGenerateAndVote = async () => {
    try {
      setIsSubmitting(true);
      const effectiveVoteChoice = voteChoice ?? storedVoteChoice;
      if (effectiveVoteChoice === null || effectiveVoteChoice === undefined)
        throw new Error("Please select an option first");

      // Use commitment data from global state or loaded from localStorage as fallback
      const activeCommitmentData = commitmentData || loadedCommitmentData;

      if (
        !activeCommitmentData?.nullifier ||
        !activeCommitmentData?.secret ||
        activeCommitmentData?.index === undefined
      )
        throw new Error("Please register first. Missing commitment data.");
      if (!leafEvents || leafEvents.length === 0)
        throw new Error("There are no commitments yet. Please register your commitment first.");

      // Fetch circuit and generate proof
      const response = await fetch("/api/circuit");
      if (!response.ok) throw new Error("Failed to fetch circuit data");
      const circuitData = await response.json();

      const generated = await generateProof(
        root as bigint,
        effectiveVoteChoice,
        depth,
        activeCommitmentData.nullifier,
        activeCommitmentData.secret,
        activeCommitmentData.index as number,
        leafEvents,
        circuitData,
      );

      setProofData({ proof: generated.proof, publicInputs: generated.publicInputs });

      // Save proof data to localStorage
      saveProofToLocalStorage(
        { proof: generated.proof, publicInputs: generated.publicInputs },
        contractAddress,
        effectiveVoteChoice,
        userAddress,
      );
      setHasStoredProofData(true);
      setStoredVoteChoice(effectiveVoteChoice);

      // Build calldata for Voting.vote
      const proofHex = uint8ArrayToHexString(generated.proof);
      const inputsHex = normalizePublicInputsToHex32(generated.publicInputs);

      if (!contractInfo && !contractAddress) throw new Error("Contract not found");

      const callData = encodeFunctionData({
        abi: (contractInfo?.abi as any) || ([] as any),
        functionName: "vote",
        args: [proofHex, inputsHex[0], inputsHex[1], inputsHex[2], inputsHex[3]],
      });

      const { smartAccountClient, accountAddress, burnerAddress } = await createSmartAccount();

      const userOpHash = await smartAccountClient.sendTransaction({
        to: contractAddress as `0x${string}`,
        data: callData,
        value: 0n,
      });

      // Record vote as pending using the userOp hash
      saveVoteToLocalStorage(
        effectiveVoteChoice,
        userOpHash,
        contractAddress,
        userAddress,
        accountAddress,
        burnerAddress,
        "pending",
      );
      setVoteStatus("pending");
      setVoteMeta(
        getStoredVoteMetadata(contractAddress, userAddress) ?? {
          voteChoice: effectiveVoteChoice,
          txHash: userOpHash,
          status: "pending",
          contractAddress,
          userAddress,
          smartAccountAddress: accountAddress,
          burnerAddress,
          timestamp: Date.now(),
        },
      );

      const publicClient = createPublicClient({ chain: CHAIN_USED, transport: http(HTTP_CLIENT_USED) });
      const proofPublicInputs = normalizePublicInputsToHex32(generated.publicInputs);
      const ourNullifier = proofPublicInputs[0];

      if (DEBUG) console.log("Transaction submitted. Waiting for confirmation...");

      // Simple polling: just wait and check if nullifier was used
      const waitForVoteConfirmation = async (): Promise<any> => {
        const maxWait = 30_000; // 30 seconds (360 seconds is too long)
        const startTime = Date.now();
        let attempts = 0;

        while (Date.now() - startTime < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 4000)); // Check every 4 seconds
          attempts++;

          try {
            // Check if the nullifier has been used (which means vote was recorded)
            const hasVoted = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: contractInfo?.abi as any,
              functionName: "hasVoted",
              args: [ourNullifier],
            });

            if (DEBUG) console.log(`[Attempt ${attempts}] hasVoted(${ourNullifier}):`, hasVoted);

            if (hasVoted) {
              console.log("✅ Vote confirmed on-chain!");
              return {
                transactionHash: userOpHash,
                confirmed: true,
              };
            }
          } catch (err) {
            if (DEBUG) console.log(`[Attempt ${attempts}] Check failed:`, err);
          }
        }

        // console.log("⏱️ Timeout waiting for confirmation, but vote was submitted");
        return {
          transactionHash: userOpHash,
          confirmed: false,
        };
      };

      const receipt = await waitForVoteConfirmation();
      if (DEBUG) console.log("Transaction included:", receipt);
      const rawTxHash =
        (receipt as any)?.receipt?.transactionHash ||
        (receipt as any)?.transactionHash ||
        (receipt as any)?.hash ||
        userOpHash;
      const txHash = typeof rawTxHash === "string" ? rawTxHash : rawTxHash?.toString?.();
      if (txHash) {
        updateVoteInLocalStorage(contractAddress, userAddress, {
          txHash,
          status: "success",
          blockNumber: (receipt as any)?.receipt?.blockNumber?.toString?.(),
        });
      }
      setVoteStatus("success");
      setVoteMeta(getStoredVoteMetadata(contractAddress, userAddress));
      notification.success("Vote submitted successfully");
    } catch (err) {
      console.error(err);
      const name = (err as any)?.name || "";
      const message = (err as Error)?.message || "";
      const isTimeout =
        name.includes("WaitForUserOperationReceiptTimeoutError") ||
        message.includes("WaitForUserOperationReceiptTimeoutError") ||
        message.includes("Timed out while waiting for User Operation") ||
        message.includes("Timeout: Vote not found on-chain");

      if (isTimeout) {
        try {
          updateVoteInLocalStorage(contractAddress, userAddress, {
            status: "success",
            error: undefined,
          });
        } catch {}
        setVoteStatus("success");
        setVoteMeta(getStoredVoteMetadata(contractAddress, userAddress));
        // Vote was submitted but we couldn't confirm it within timeout
        notification.success("Vote submitted successfully! Confirmation may take a moment.");
      } else {
        notification.error(message || "Failed to submit vote");
        try {
          updateVoteInLocalStorage(contractAddress, userAddress, {
            status: "failed",
            error: message || name,
          });
        } catch {}
        setVoteStatus("failed");
        setVoteMeta(getStoredVoteMetadata(contractAddress, userAddress));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-6 relative">
      <div className="flex justify-end">
        {voteMeta && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setIsTxDetailsOpen(v => !v)}
            title="Show vote transaction details"
          >
            {isTxDetailsOpen ? "Hide tx" : "Tx details"}
          </button>
        )}
      </div>
      {isTxDetailsOpen && voteMeta && (
        <div className="absolute left-1/2 -translate-x-1/2 top-14 z-10 p-3 rounded-lg bg-base-200 shadow text-xs space-y-1 w-[min(90vw,32rem)]">
          <div>
            <span className="opacity-70">Status:</span> {voteMeta.status ?? "—"}
          </div>
          {typeof voteMeta.voteChoice === "number" && (
            <div>
              <span className="opacity-70">Choice:</span> Option {voteMeta.voteChoice + 1} (
              {options[voteMeta.voteChoice] || "Unknown"})
            </div>
          )}
          {voteMeta.txHash && (
            <div className="break-all">
              <span className="opacity-70">Tx hash:</span> {voteMeta.txHash}
            </div>
          )}
          {voteMeta.blockNumber && (
            <div>
              <span className="opacity-70">Block:</span> {voteMeta.blockNumber}
            </div>
          )}
          {voteMeta.smartAccountAddress && (
            <div className="break-all">
              <span className="opacity-70">Smart account:</span> {voteMeta.smartAccountAddress}
            </div>
          )}
          {voteMeta.burnerAddress && (
            <div className="break-all">
              <span className="opacity-70">Burner:</span> {voteMeta.burnerAddress}
            </div>
          )}
          {voteMeta.contractAddress && (
            <div className="break-all">
              <span className="opacity-70">Contract:</span> {voteMeta.contractAddress}
            </div>
          )}
          {voteMeta.timestamp && (
            <div>
              <span className="opacity-70">Time:</span> {new Date(voteMeta.timestamp).toLocaleString()}
            </div>
          )}
          {voteMeta.error && (
            <div className="text-error break-all">
              <span className="opacity-70">Error:</span> {voteMeta.error}
            </div>
          )}
        </div>
      )}
      {loadedCommitmentData && !commitmentData && (
        <div className="alert alert-info">
          <div className="flex items-center gap-2">
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
              ></path>
            </svg>
            <span className="text-sm">Using commitment data from previous session</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-bold">Choose your vote</h2>
        </div>
        <div
          className={`grid gap-3 ${
            options.length <= 2 ? "grid-cols-2" : options.length <= 4 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {options.map((option, index) => {
            const isSelected = voteChoice === index || (hasStoredProofData && storedVoteChoice === index);
            const baseStyle = selectionLocked ? { pointerEvents: "none" as const, cursor: "not-allowed" } : {};

            return (
              <button
                key={index}
                className={`
                  w-full px-6 py-4 rounded-lg
                  flex flex-col items-center justify-center
                  transition-all duration-200 ease-in-out
                  cursor-pointer
                  ${
                    isSelected
                      ? "bg-primary text-primary-content shadow-md !border-0"
                      : "bg-base-100 text-base-content hover:bg-base-200 !border !border-base-content/15"
                  }
                  ${!canVote && !hasStoredProofData ? "opacity-50 cursor-not-allowed" : ""}
                `}
                style={baseStyle}
                onClick={canVote && !selectionLocked ? () => setVoteChoice(index) : undefined}
                disabled={!canVote && !hasStoredProofData}
              >
                <span className="text-xs opacity-70 mb-1">Option {index + 1}</span>
                <span className="truncate max-w-full">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="divider"></div>

      <div className="flex flex-col gap-3">
        {(() => {
          const isAlreadyVoted = voteStatus === "success";
          const isPendingVote = voteStatus === "pending";
          const disabled = isSubmitting || isPendingVote || isAlreadyVoted || !canVote;
          const votedOptionText =
            typeof storedVoteChoice === "number"
              ? `Option ${storedVoteChoice + 1} (${options[storedVoteChoice] || "Unknown"})`
              : "";
          const label = isAlreadyVoted
            ? `✓ Already voted with ${votedOptionText}`
            : isPendingVote
              ? "Vote pending..."
              : !canVote
                ? canVoteEligible
                  ? "Voting not open yet"
                  : "Must register first"
                : "Vote";
          const variant = isAlreadyVoted
            ? "btn-success"
            : isPendingVote
              ? "btn-outline"
              : !canVote
                ? "btn-disabled"
                : "btn-primary";
          return (
            <button
              className={`btn btn-lg ${variant} ${isAlreadyVoted ? "cursor-not-allowed" : ""}`}
              onClick={disabled ? undefined : handleGenerateAndVote}
              disabled={disabled}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-md"></span>
                  <span>voting...</span>
                </div>
              ) : (
                label
              )}
            </button>
          );
        })()}
      </div>
    </div>
  );
};

// Local helpers adapted from existing components
const generateProof = async (
  _root: bigint,
  _vote: number,
  _depth: number,
  _nullifier: string,
  _secret: string,
  _index: number,
  _leaves: any[],
  _circuitData: any,
) => {
  const nullifierHash = poseidon1([BigInt(_nullifier)]);

  const calculatedTree = new LeanIMT((a: bigint, b: bigint) => poseidon2([a, b]));
  const leaves = _leaves.map(event => event?.args.value);
  const leavesReversed = leaves.reverse();
  calculatedTree.insertMany(leavesReversed as bigint[]);
  const calculatedProof = calculatedTree.generateProof(_index);
  const sibs = calculatedProof.siblings.map(sib => sib.toString());

  const lengthDiff = 16 - sibs.length;
  for (let i = 0; i < lengthDiff; i++) {
    sibs.push("0");
  }

  const noir = new Noir(_circuitData);
  const honk = new UltraHonkBackend(_circuitData.bytecode, { threads: 1 });

  const input = {
    root: _root.toString(),
    nullifier_hash: nullifierHash.toString(),
    vote: _vote.toString(),
    depth: _depth.toString(),
    nullifier: BigInt(_nullifier).toString(),
    secret: BigInt(_secret).toString(),
    index: calculatedProof.index.toString(),
    siblings: sibs,
  };

  const { witness } = await noir.execute(input);
  const originalLog = console.log;
  console.log = () => {};
  const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
  console.log = originalLog;
  return { proof, publicInputs };
};

const uint8ArrayToHexString = (buffer: Uint8Array): `0x${string}` => {
  const hex: string[] = [];
  buffer.forEach(i => {
    let h = i.toString(16);
    if (h.length % 2) h = "0" + h;
    hex.push(h);
  });
  return `0x${hex.join("")}`;
};

const toBytes32Hex = (value: any): `0x${string}` => {
  if (typeof value === "string" && value.startsWith("0x")) {
    const hex = value.slice(2);
    if (hex.length > 64) throw new Error("Hex value too long for bytes32");
    return `0x${hex.padStart(64, "0")}`;
  }
  if (typeof value === "bigint") {
    return `0x${value.toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "number") {
    return `0x${BigInt(value).toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "string") {
    const asBig = BigInt(value);
    return `0x${asBig.toString(16).padStart(64, "0")}`;
  }
  throw new Error("Unsupported public input type");
};

const normalizePublicInputsToHex32 = (inputs: any[]): `0x${string}`[] => inputs.map(toBytes32Hex);
