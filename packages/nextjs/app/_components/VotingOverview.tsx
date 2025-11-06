"use client";

import { useState } from "react";
import ListVotings from "./ListVotings";
import OwnedVotings from "./OwnedVotings";
import ParticipatedVotings from "./ParticipatedVotings";

interface VotingOverviewProps {
  onCreateClick: () => void;
}

const VotingOverview = ({ onCreateClick }: VotingOverviewProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "participated">("owned");

  const tabs = [
    { id: "owned" as const, label: "My Votes", component: OwnedVotings },
    { id: "participated" as const, label: "I Can Vote", component: ParticipatedVotings },
    { id: "all" as const, label: "All Votes", component: ListVotings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ListVotings;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="tabs tabs-boxed w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab text-2xl font-medium ${activeTab === tab.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary gap-2 shadow-lg hover:scale-105 transition-transform"
          onClick={onCreateClick}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Vote
        </button>
      </div>

      <div className="w-full max-h-[calc(3*280px+2*1rem)] overflow-y-auto pr-2">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default VotingOverview;
