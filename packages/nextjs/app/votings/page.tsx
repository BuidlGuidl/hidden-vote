"use client";

import { useState } from "react";
import CreateVotingModal from "../_components/CreateVotingModal";
import VotingOverview from "../_components/VotingOverview";
import { NextPage } from "next";

const VotingsPage: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "participated">("owned");

  const tabs = [
    { id: "owned" as const, label: "My Votings" },
    { id: "participated" as const, label: "I Can Vote" },
    { id: "all" as const, label: "All Votings" },
  ];

  return (
    <div className="min-h-full">
      <header className="bg-primary pb-24 lg:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="relative flex items-center justify-between py-5 lg:pt-12">
            {/* Tab Navigation */}
            <nav className="flex space-x-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${
                    activeTab === tab.id
                      ? "text-white bg-secondary/75"
                      : "text-indigo-100 hover:bg-indigo-500/75 dark:hover:bg-indigo-700/75"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-4">
              {/* Create Button */}
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
                <svg
                  className="inline-block w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Voting
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-24 lg:-mt-28 pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="overflow-hidden min-h-48 flex items-center justify-center rounded-lg bg-white shadow dark:bg-gray-800 dark:shadow-none dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-white/10">
            <div className="p-6 w-full">
              <VotingOverview activeTab={activeTab} />
            </div>
          </div>
        </div>
      </main>

      <CreateVotingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default VotingsPage;
