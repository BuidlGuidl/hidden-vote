"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useAccount } from "wagmi";
import { DocumentTextIcon, PlusIcon, TrashIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type VoterEntry = {
  address: string;
  status: boolean;
};

type AddVotersModalProps = {
  contractAddress: `0x${string}`;
};

export const AddVotersModal = ({ contractAddress }: AddVotersModalProps) => {
  const { address: connectedAddress } = useAccount();
  const [voters, setVoters] = useState<VoterEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [defaultStatus, setDefaultStatus] = useState(true);

  // Check if the connected user is the owner of the contract
  const { data: contractOwner } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "owner",
    address: contractAddress,
  });

  const { writeContractAsync: writeVotingAsync } = useScaffoldWriteContract({
    contractName: "Voting",
    address: contractAddress,
  });

  // Only show the modal if the connected user is the owner
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

  const handleBulkImport = () => {
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

    lines.forEach((line, index) => {
      const address = line.trim();

      if (!validateEthAddress(address)) {
        errors.push(`Line ${index + 1}: Invalid address ${address}`);
        return;
      }

      // Check if address already exists in current voters list
      const exists = voters.some(v => v.address.toLowerCase() === address.toLowerCase());
      if (exists) {
        errors.push(`Line ${index + 1}: Address ${address} already in list`);
        return;
      }

      newVoters.push({ address, status: defaultStatus });
    });

    if (errors.length > 0) {
      notification.error(`Import warnings: ${errors.join(", ")}`);
    }

    if (newVoters.length === 0) {
      notification.error("No valid addresses to import");
      return;
    }

    setVoters([...voters, ...newVoters]);
    setBulkAddresses("");
    notification.success(`Successfully added ${newVoters.length} addresses`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      Papa.parse(file, {
        complete: (results: Papa.ParseResult<string[]>) => {
          const newVoters: VoterEntry[] = [];
          const errors: string[] = [];

          results.data.forEach((row: string[], index: number) => {
            if (index === 0 && row[0]?.toLowerCase().includes("address")) return;

            const address = row[0]?.trim();
            if (!address) return;

            if (!validateEthAddress(address)) {
              errors.push(`Row ${index + 1}: Invalid address`);
              return;
            }

            if (!voters.some(v => v.address.toLowerCase() === address.toLowerCase())) {
              newVoters.push({ address, status: defaultStatus });
            }
          });

          if (newVoters.length > 0) {
            setVoters([...voters, ...newVoters]);
            notification.success(`Imported ${newVoters.length} addresses from CSV`);
          }

          if (errors.length > 0) {
            notification.error(errors.join(", "));
          }
        },
        error: () => {
          notification.error("Failed to parse CSV file");
        },
      });
    } else if (file.type === "application/json" || file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const addressArray = Array.isArray(data) ? data : data.addresses || [];
          const newVoters: VoterEntry[] = [];

          addressArray.forEach((item: any) => {
            const address = typeof item === "string" ? item : item.address;

            if (validateEthAddress(address) && !voters.some(v => v.address.toLowerCase() === address.toLowerCase())) {
              newVoters.push({ address, status: defaultStatus });
            }
          });

          if (newVoters.length > 0) {
            setVoters([...voters, ...newVoters]);
            notification.success(`Imported ${newVoters.length} addresses from JSON`);
          }
        } catch {
          notification.error("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
    }

    // Reset file input
    e.target.value = "";
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Filter out empty addresses
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

      // Reset form
      setVoters([]);
      setBulkAddresses("");

      // Close modal
      const modal = document.getElementById("add-voters-modal") as HTMLInputElement;
      if (modal) modal.checked = false;
    } catch (error) {
      console.error("Error adding voters:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if user is not the owner
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
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">Add Voters</h3>
          <label htmlFor="add-voters-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>

          <div className="space-y-4">
            <p className="text-sm opacity-70">
              Add addresses that are allowed to vote. Paste multiple addresses or import from a file.
            </p>

            {/* Default Status Selector */}
            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <span className="text-sm font-medium">Default status for addresses:</span>
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

            {/* Paste Addresses Textarea */}
            <div>
              <label className="block text-sm font-medium mb-2">Paste voter addresses</label>
              <textarea
                value={bulkAddresses}
                onChange={e => setBulkAddresses(e.target.value)}
                placeholder="0xAbc123..., 0xDef456...&#10;0x789Ghi..."
                rows={5}
                className="w-full px-4 py-3 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm"
              />
              <p className="text-xs opacity-60 mt-1">One address per line, or comma-separated</p>
            </div>

            {/* Import Buttons */}
            <div className="flex gap-2">
              <button onClick={handleBulkImport} className="btn btn-sm btn-primary gap-2">
                <PlusIcon className="w-4 h-4" />
                Add to List
              </button>
              <label className="btn btn-sm btn-outline gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                Import File
                <input type="file" accept=".csv,.json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>

            {/* Display Current Voters List */}
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
                      <span className="font-mono text-xs flex-1 truncate">{voter.address}</span>
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

            {/* Submit Buttons */}
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
