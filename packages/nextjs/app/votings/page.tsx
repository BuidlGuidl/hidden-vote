"use client";

import { useState } from "react";
import AccentWrapper from "../_components/AccentWrapper";
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
      <AccentWrapper>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="relative w-full flex items-center py-5 lg:pt-12">
            {/* Right section */}
            <div className="w-full flex items-center justify-between gap-4 overflow-x-auto sm:overflow-visible py-2">
              {/* Tab Navigation */}
              <nav className="flex space-x-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap text-primary-content ${
                      activeTab === tab.id ? "bg-secondary" : "hover:bg-secondary/75 dark:hover:bg-secondary/75"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Create Button */}
              <button
                className="hidden sm:block btn btn-accent btn-outline whitespace-nowrap"
                onClick={() => setIsModalOpen(true)}
              >
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
      </AccentWrapper>

      <main className="relative z-10 -mt-24 lg:-mt-44 pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="overflow-hidden min-h-48 flex items-center justify-center rounded-lg bg-white shadow dark:bg-gray-800 dark:shadow-none dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-white/10">
            <div className="p-6 w-full">
              <VotingOverview activeTab={activeTab} />
              <button
                className="sm:hidden mt-6 btn btn-primary btn-outline whitespace-nowrap"
                onClick={() => setIsModalOpen(true)}
              >
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
      </main>

      <CreateVotingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default VotingsPage;
