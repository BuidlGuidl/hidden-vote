"use client";

import { useState } from "react";
import Papa from "papaparse";
import { normalize } from "viem/ens";
import { useAccount, useConfig } from "wagmi";
import { getEnsAddress, getEnsName } from "wagmi/actions";
import {
  DocumentTextIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type VoterEntry = {
  address: string;
  status: boolean;
  ensName?: string;
};

type AddVotersModalProps = {
  contractAddress: `0x${string}`;
};

export const AddVotersModal = ({ contractAddress }: AddVotersModalProps) => {
  const { address: connectedAddress } = useAccount();
  const config = useConfig();
  const [voters, setVoters] = useState<VoterEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [defaultStatus, setDefaultStatus] = useState(true);

  const { data: contractOwner } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "owner",
    address: contractAddress,
  });

  const { writeContractAsync: writeVotingAsync } = useScaffoldWriteContract({
    contractName: "Voting",
    address: contractAddress,
  });

  const isOwner = connectedAddress && contractOwner && connectedAddress.toLowerCase() === contractOwner.toLowerCase();

  const removeVoterEntry = (index: number) => {
    setVoters(voters.filter((_, i) => i !== index));
  };

  const toggleVoterStatus = (index: number) => {
    const updatedVoters = [...voters];
    updatedVoters[index].status = !updatedVoters[index].status;
    setVoters(updatedVoters);
  };

  const validateEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isENSName = (input: string): boolean => {
    return /^[\w-]+(\.[\w-]+)*\.(eth|xyz|luxe|kred|art|club)$/i.test(input);
  };

  const resolveENSName = async (ensName: string): Promise<string | null> => {
    try {
      const normalizedName = normalize(ensName);
      const address = await getEnsAddress(config, {
        name: normalizedName,
        chainId: 1,
      });
      return address;
    } catch (error) {
      console.error(`Failed to resolve ENS name ${ensName}:`, error);
      return null;
    }
  };

  const reverseResolveENS = async (address: string): Promise<string | null> => {
    try {
      const ensName = await getEnsName(config, {
        address: address as `0x${string}`,
        chainId: 1,
      });
      return ensName;
    } catch (error) {
      console.error(`Failed to reverse resolve address ${address}:`, error);
      return null;
    }
  };

  const handleBulkImport = async () => {
    if (!bulkAddresses.trim()) {
      notification.error("Please enter addresses to import");
      return;
    }

    const lines = bulkAddresses
      .split(/[\n,]+/)
      .map(line => line.trim())
      .filter(Boolean);
    const newVoters: VoterEntry[] = [];
    const errors: string[] = [];
    const ensNameMap: Map<number, string> = new Map();

    lines.forEach((line, index) => {
      if (isENSName(line)) {
        ensNameMap.set(index, line);
      }
    });

    if (ensNameMap.size > 0) {
      for (const [index, ensName] of ensNameMap.entries()) {
        const resolvedAddress = await resolveENSName(ensName);
        if (resolvedAddress) {
          lines[index] = resolvedAddress;
        } else {
          errors.push(`Line ${index + 1}: Failed to resolve ENS name ${ensName}`);
          lines[index] = "";
          ensNameMap.delete(index);
        }
      }
    }

    const validAddresses: Array<{ address: string; index: number }> = [];
    lines.forEach((line, index) => {
      if (!line) return;

      const address = line.trim();

      if (!validateEthAddress(address)) {
        errors.push(`Line ${index + 1}: Invalid address ${address}`);
        return;
      }

      const exists = voters.some(v => v.address.toLowerCase() === address.toLowerCase());
      if (exists) {
        errors.push(`Line ${index + 1}: Address ${address} already in list`);
        return;
      }

      const duplicateInBatch = validAddresses.some(v => v.address.toLowerCase() === address.toLowerCase());
      if (duplicateInBatch) {
        errors.push(`Line ${index + 1}: Duplicate address ${address} in import`);
        return;
      }

      validAddresses.push({ address, index });
    });

    const addressesToLookup = validAddresses.filter(({ index }) => !ensNameMap.has(index));

    if (addressesToLookup.length > 0) {
      for (const { address, index } of addressesToLookup) {
        const reversedENS = await reverseResolveENS(address);
        if (reversedENS) {
          ensNameMap.set(index, reversedENS);
        }
      }
    }

    validAddresses.forEach(({ address, index }) => {
      newVoters.push({
        address,
        status: defaultStatus,
        ensName: ensNameMap.get(index),
      });
    });

    if (errors.length > 0) {
      notification.warning(
        `Import warnings: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ""}`,
      );
    }

    if (newVoters.length === 0) {
      return;
    }

    setVoters([...voters, ...newVoters]);
    setBulkAddresses("");
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      Papa.parse(file, {
        complete: async (results: Papa.ParseResult<string[]>) => {
          const newVoters: VoterEntry[] = [];
          const errors: string[] = [];
          const itemsToProcess: Array<{ input: string; status: boolean; rowIndex: number }> = [];

          results.data.forEach((row: string[], index: number) => {
            if (index === 0 && row[0]?.toLowerCase().includes("address")) return;

            const input = row[0]?.trim();
            if (!input) return;

            // Parse the second column for status (true/false)
            let status = defaultStatus;
            if (row[1] !== undefined && row[1] !== null) {
              const statusValue = row[1].trim().toLowerCase();
              if (statusValue === "true" || statusValue === "1" || statusValue === "yes") {
                status = true;
              } else if (statusValue === "false" || statusValue === "0" || statusValue === "no") {
                status = false;
              }
            }

            itemsToProcess.push({ input, status, rowIndex: index });
          });

          for (let i = 0; i < itemsToProcess.length; i++) {
            const { input: originalInput, status, rowIndex } = itemsToProcess[i];
            let address = originalInput;
            let ensName: string | undefined;

            if (isENSName(originalInput)) {
              const resolved = await resolveENSName(originalInput);
              if (resolved) {
                ensName = originalInput;
                address = resolved;
              } else {
                errors.push(`Row ${rowIndex + 1}: Failed to resolve ENS name ${originalInput}`);
                continue;
              }
            }

            if (!validateEthAddress(address)) {
              errors.push(`Row ${rowIndex + 1}: Invalid address`);
              continue;
            }

            if (!ensName) {
              const reversedENS = await reverseResolveENS(address);
              if (reversedENS) {
                ensName = reversedENS;
              }
            }

            const existsInVoters = voters.some(v => v.address.toLowerCase() === address.toLowerCase());
            const existsInBatch = newVoters.some(v => v.address.toLowerCase() === address.toLowerCase());

            if (!existsInVoters && !existsInBatch) {
              newVoters.push({ address, status, ensName });
            } else if (existsInBatch) {
              errors.push(`Row ${rowIndex + 1}: Duplicate address in file`);
            }
          }

          if (newVoters.length > 0) {
            setVoters([...voters, ...newVoters]);
          }

          if (errors.length > 0) {
            notification.warning(
              `Import warnings: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ""}`,
            );
          }
        },
        error: () => {
          notification.error("Failed to parse CSV file");
        },
      });
    } else if (file.type === "application/json" || file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const addressArray = Array.isArray(data) ? data : data.addresses || [];
          const newVoters: VoterEntry[] = [];
          const errors: string[] = [];

          for (const item of addressArray) {
            const originalInput = typeof item === "string" ? item : item.address;
            let address = originalInput;
            let ensName: string | undefined;

            if (isENSName(originalInput)) {
              const resolved = await resolveENSName(originalInput);
              if (resolved) {
                ensName = originalInput;
                address = resolved;
              } else {
                errors.push(`Failed to resolve ENS name ${originalInput}`);
                continue;
              }
            }

            if (!validateEthAddress(address)) {
              continue;
            }

            if (!ensName) {
              const reversedENS = await reverseResolveENS(address);
              if (reversedENS) {
                ensName = reversedENS;
              }
            }

            const existsInVoters = voters.some(v => v.address.toLowerCase() === address.toLowerCase());
            const existsInBatch = newVoters.some(v => v.address.toLowerCase() === address.toLowerCase());

            if (!existsInVoters && !existsInBatch) {
              newVoters.push({ address, status: defaultStatus, ensName });
            } else if (existsInBatch) {
              errors.push(`Duplicate address in file`);
            }
          }

          if (newVoters.length > 0) {
            setVoters([...voters, ...newVoters]);
          }

          if (errors.length > 0) {
            notification.warning(
              `Import warnings: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ""}`,
            );
          }
        } catch {
          notification.error("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
    }

    e.target.value = "";
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const validVoters = voters.filter(voter => voter.address.trim() !== "");

      if (validVoters.length === 0) {
        alert("Please add at least one valid voter address.");
        return;
      }

      const addresses = validVoters.map(voter => voter.address as `0x${string}`);
      const statuses = validVoters.map(voter => voter.status);

      await writeVotingAsync({
        functionName: "addVoters",
        args: [addresses, statuses],
      });

      setVoters([]);
      setBulkAddresses("");

      const modal = document.getElementById("add-voters-modal") as HTMLInputElement;
      if (modal) modal.checked = false;
    } catch (error) {
      console.error("Error adding voters:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div>
      <label htmlFor="add-voters-modal" className="btn btn-primary btn-sm font-normal gap-1">
        <UserPlusIcon className="h-4 w-4" />
        <span>Add Voters</span>
      </label>
      <input type="checkbox" id="add-voters-modal" className="modal-toggle" />
      <label htmlFor="add-voters-modal" className="modal cursor-pointer">
        <label className="modal-box relative max-w-2xl">
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">Add Voters</h3>
          <label htmlFor="add-voters-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Default permission:</span>
                <div
                  className="tooltip tooltip-right before:!max-w-[280px] before:!rounded-none before:!text-left before:!whitespace-normal before:!p-3"
                  data-tip="Set whether new addresses can vote or are revoked. You can change individual permissions later."
                >
                  <InformationCircleIcon className="h-5 w-5 text-base-content/50 hover:text-primary cursor-help transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="label cursor-pointer gap-2">
                  <span className="label-text text-sm">Allow</span>
                  <input
                    type="radio"
                    name="default-status"
                    className="radio radio-sm radio-success"
                    checked={defaultStatus === true}
                    onChange={() => setDefaultStatus(true)}
                  />
                </label>
                <label className="label cursor-pointer gap-2">
                  <span className="label-text text-sm">Revoke</span>
                  <input
                    type="radio"
                    name="default-status"
                    className="radio radio-sm radio-error"
                    checked={defaultStatus === false}
                    onChange={() => setDefaultStatus(false)}
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 px-3">
                <label className="text-sm font-medium">Paste voter addresses or ENS names</label>
                <div
                  className="tooltip tooltip-right before:!max-w-[280px] before:!rounded-none before:!text-left before:!whitespace-normal before:!p-3"
                  data-tip="Supports Ethereum addresses (0x...) and ENS names (phipsae.eth). Separate with newlines or commas. ENS names will be automatically resolved."
                >
                  <InformationCircleIcon className="h-5 w-5 text-base-content/50 hover:text-primary cursor-help transition-colors" />
                </div>
              </div>
              <textarea
                value={bulkAddresses}
                onChange={e => setBulkAddresses(e.target.value)}
                placeholder="0xAbc123..., phipsae.eth, 0xDef456..."
                rows={5}
                className="w-full px-4 py-3 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleBulkImport} className="btn btn-sm btn-primary gap-2">
                <PlusIcon className="w-4 h-4" />
                Add to List
              </button>
              <div
                className="tooltip tooltip-right before:!max-w-[280px] before:!rounded-none before:!text-left before:!whitespace-pre-line before:!p-3"
                data-tip="Import CSV file with 2 columns:&#10; Address (e.g., 0x123...) and Status (true or false)"
              >
                <label className="btn btn-sm btn-outline gap-2">
                  <DocumentTextIcon className="w-4 h-4" />
                  Import File
                  <input type="file" accept=".csv,.json" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
            </div>

            {voters.length > 0 && (
              <div className="border border-base-300 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Voters to Add ({voters.length})</h4>
                  <button onClick={() => setVoters([])} className="btn btn-ghost btn-xs gap-1">
                    <TrashIcon className="w-3 h-3" />
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {voters.map((voter, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-base-100 rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        {voter.ensName && (
                          <div className="font-medium text-sm text-primary truncate">{voter.ensName}</div>
                        )}
                        <span className="font-mono text-xs opacity-70 truncate block">{voter.address}</span>
                      </div>
                      <button
                        onClick={() => toggleVoterStatus(index)}
                        className={`badge badge-sm ${voter.status ? "badge-success" : "badge-error"} cursor-pointer hover:opacity-80`}
                      >
                        {voter.status ? "Allow" : "Revoke"}
                      </button>
                      <button onClick={() => removeVoterEntry(index)} className="btn btn-ghost btn-xs btn-square">
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-base-300">
              <label htmlFor="add-voters-modal" className="btn btn-ghost btn-sm">
                Cancel
              </label>
              <button
                onClick={handleSubmit}
                className="btn btn-primary btn-sm gap-2"
                disabled={isSubmitting || voters.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-4 w-4" />
                    Add {voters.length} {voters.length === 1 ? "Voter" : "Voters"}
                  </>
                )}
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
