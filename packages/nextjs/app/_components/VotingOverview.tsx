"use client";

import ListVotings from "./ListVotings";
import OwnedVotings from "./OwnedVotings";
import ParticipatedVotings from "./ParticipatedVotings";

interface VotingOverviewProps {
  activeTab: "all" | "owned" | "participated";
}

const VotingOverview = ({ activeTab }: VotingOverviewProps) => {
  const tabs = [
    { id: "owned" as const, component: OwnedVotings },
    { id: "participated" as const, component: ParticipatedVotings },
    { id: "all" as const, component: ListVotings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ListVotings;

  return (
    <div className="w-full">
      <ActiveComponent />
    </div>
  );
};

export default VotingOverview;
