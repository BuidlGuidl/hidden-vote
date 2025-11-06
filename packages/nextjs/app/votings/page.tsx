"use client";

import { useState } from "react";
import CreateVotingModal from "../_components/CreateVotingModal";
import VotingOverview from "../_components/VotingOverview";
import { NextPage } from "next";

const VotingsPage: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <VotingOverview onCreateClick={() => setIsModalOpen(true)} />
      </div>

      <CreateVotingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default VotingsPage;
