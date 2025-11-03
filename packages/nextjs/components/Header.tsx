"use client";

import Image from "next/image";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full lg:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" passHref className="flex items-center gap-3 shrink-0">
            <div className="flex relative w-10 h-10">
              <Image alt="Hidden Vote logo" className="cursor-pointer" fill src="/logo-1.svg" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Hidden Vote
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
        </div>
      </div>
    </div>
  );
};
