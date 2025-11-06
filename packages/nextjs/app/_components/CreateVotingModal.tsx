"use client";

import { useEffect, useMemo, useState } from "react";
import { InformationCircleIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface CreateVotingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateVotingModal = ({ isOpen, onClose }: CreateVotingModalProps) => {
  const { writeContractAsync: writeVotingAsync, isMining } = useScaffoldWriteContract({
    contractName: "VotingFactory",
  });

  const [question, setQuestion] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [votingEndTime, setVotingEndTime] = useState("");
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);

  // Get minimum datetime for inputs (now + 1 minute)
  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  }, []);

  // Get minimum voting end time (registration deadline + 1 minute)
  const minVotingEndTime = useMemo(() => {
    if (!registrationDeadline) return minDateTime;
    const regDate = new Date(registrationDeadline);
    regDate.setMinutes(regDate.getMinutes() + 1);
    return regDate.toISOString().slice(0, 16);
  }, [registrationDeadline, minDateTime]);

  // Convert datetime strings to Unix timestamps
  const registrationTimestamp = useMemo(() => {
    if (!registrationDeadline) return 0n;
    return BigInt(Math.floor(new Date(registrationDeadline).getTime() / 1000));
  }, [registrationDeadline]);

  const votingEndTimestamp = useMemo(() => {
    if (!votingEndTime) return 0n;
    return BigInt(Math.floor(new Date(votingEndTime).getTime() / 1000));
  }, [votingEndTime]);

  // Check if times are valid
  const isValidTime = useMemo(() => {
    if (!registrationDeadline || !votingEndTime) {
      console.log("Missing times:", { registrationDeadline, votingEndTime });
      return false;
    }
    const now = Date.now();
    const regTime = new Date(registrationDeadline).getTime();
    const voteTime = new Date(votingEndTime).getTime();
    const isValid = regTime > now && voteTime > regTime;
    console.log("Time validation:", {
      now: new Date(now).toLocaleString(),
      registrationDeadline: new Date(regTime).toLocaleString(),
      votingEndTime: new Date(voteTime).toLocaleString(),
      regInFuture: regTime > now,
      voteAfterReg: voteTime > regTime,
      isValid,
    });
    return isValid;
  }, [registrationDeadline, votingEndTime]);

  // Auto-clear voting end time if registration deadline is changed to be after it
  useEffect(() => {
    if (registrationDeadline && votingEndTime) {
      const regTime = new Date(registrationDeadline).getTime();
      const voteTime = new Date(votingEndTime).getTime();
      if (voteTime <= regTime) {
        setVotingEndTime("");
      }
    }
  }, [registrationDeadline, votingEndTime]);

  const addOption = () => {
    if (options.length < 16) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreateVoting = async () => {
    try {
      // Validate options
      const validOptions = options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        alert("Please add at least 2 valid options");
        return;
      }

      if (!isValidTime) {
        alert("Please ensure times are valid and in the future");
        return;
      }

      await writeVotingAsync({
        functionName: "createVoting",
        args: [question, registrationTimestamp, votingEndTimestamp, validOptions] as any,
        gas: 5000000n,
      });
      setQuestion("");
      setRegistrationDeadline("");
      setVotingEndTime("");
      setOptions(["Yes", "No"]);
      onClose();
    } catch (error) {
      console.error("Failed to create voting:", error);
    }
  };

  const handleClose = () => {
    setQuestion("");
    setRegistrationDeadline("");
    setVotingEndTime("");
    setOptions(["Yes", "No"]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-base-100 rounded-2xl border border-base-300 p-8 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Create New Vote</h2>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost hover:btn-error hover:text-error-content transition-colors"
            disabled={isMining}
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="form-control w-full">
            <label className="label mb-2">
              <span className="label-text font-semibold text-base flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Vote Question
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered input-lg w-full focus:input-primary transition-colors"
              placeholder="e.g., Should we implement feature X?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !isMining && question.trim() && isValidTime) {
                  void handleCreateVoting();
                }
              }}
              autoFocus
            />
          </div>

          <div className="form-control w-full">
            <label className="label mb-2">
              <span className="label-text font-semibold text-base flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Registration Deadline
                <div
                  className="tooltip tooltip-right before:!max-w-[280px] before:!rounded-none before:!text-left before:!whitespace-normal before:!p-3"
                  data-tip="Voters must register before this time. Prevents immediate voting after registration to ensure privacy."
                >
                  <InformationCircleIcon className="h-5 w-5 text-base-content/50 hover:text-primary cursor-help transition-colors" />
                </div>
              </span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered input-lg w-full focus:input-primary transition-colors"
              value={registrationDeadline}
              min={minDateTime}
              onChange={e => setRegistrationDeadline(e.target.value)}
            />
            {registrationDeadline && (
              <div className="text-center mt-2">
                <span className="label-text-alt text-base-content/60">
                  Registration closes: {new Date(registrationDeadline).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label mb-2">
              <span className="label-text font-semibold text-base flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Vote End Time
                <div
                  className="tooltip tooltip-right before:!max-w-[280px] before:!rounded-none before:!text-left before:!whitespace-normal before:!p-3"
                  data-tip="Voting period ends at this time. Must be after registration deadline."
                >
                  <InformationCircleIcon className="h-5 w-5 text-base-content/50 hover:text-primary cursor-help transition-colors" />
                </div>
              </span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered input-lg w-full focus:input-primary transition-colors"
              value={votingEndTime}
              min={minVotingEndTime}
              onChange={e => setVotingEndTime(e.target.value)}
              disabled={!registrationDeadline}
            />
            {!registrationDeadline && (
              <div className="text-center mt-2">
                <span className="label-text-alt text-warning">Please set registration deadline first</span>
              </div>
            )}
            {votingEndTime && (
              <div className="text-center mt-2">
                <span className="label-text-alt text-base-content/60">
                  Vote closes: {new Date(votingEndTime).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label mb-2">
              <span className="label-text font-semibold text-base flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Vote Options ({options.length}/16)
              </span>
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex items-center justify-center w-8 text-sm opacity-70">{index + 1}.</span>
                  <input
                    type="text"
                    className="input input-bordered flex-1 focus:input-primary transition-colors"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={e => updateOption(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="btn btn-ghost btn-square"
                      disabled={isMining}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 16 && (
              <button
                onClick={addOption}
                className="btn btn-sm btn-outline btn-primary w-full mt-3 gap-2 text-sm"
                disabled={isMining}
              >
                <PlusIcon className="h-5 w-5" />
                Add Another Option
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn btn-ghost btn-lg" onClick={handleClose} disabled={isMining}>
              Cancel
            </button>
            <button
              className={`btn btn-lg min-w-[180px] transition-all ${
                !isMining && question.trim() && isValidTime && options.filter(opt => opt.trim() !== "").length >= 2
                  ? "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white border-none shadow-lg hover:shadow-xl hover:scale-105"
                  : "btn-disabled"
              }`}
              onClick={handleCreateVoting}
              disabled={
                isMining || !question.trim() || !isValidTime || options.filter(opt => opt.trim() !== "").length < 2
              }
            >
              {isMining ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Create Vote
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVotingModal;
