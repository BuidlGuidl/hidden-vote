"use client";

import Image from "next/image";
import Link from "next/link";
import { NextPage } from "next";
import { HeroBackground } from "~~/components/HeroBackground";

const LandingPage: NextPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 size-full opacity-70 mix-blend-overlay dark:md:opacity-100"
          style={{
            background: "url(/noise.webp) lightgray 0% 0% / 83.69069695472717px 83.69069695472717px repeat",
          }}
        ></div>
        {/* Hero Background SVG */}
        <div className="absolute inset-x-[-50vw] -top-32 -bottom-48 opacity-40 lg:opacity-60 rotate-12 scale-150 lg:right-0 lg:left-auto lg:w-1/2">
          <HeroBackground className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-0 lg:translate-x-[30%] lg:translate-y-[-60%]" />
        </div>
        {/* Background Images */}
        <Image className="absolute -top-64 opacity-50" src="/blur-cyan.png" alt="" width={530} height={530} priority />
        <Image
          className="absolute -top-64 right-0"
          src="/blur-cyan.png"
          alt=""
          width={530}
          height={530}
          unoptimized
          priority
        />
        <Image
          className="absolute right-24"
          src="/blur-indigo.png"
          alt=""
          width={567}
          height={567}
          unoptimized
          priority
        />

        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 md:py-32">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <Image className="mx-auto w-28" src="/logo-color.svg" alt="Hidden Vote Logo" width={451} height={311} />
            <h1 className="mb-0 text-6xl md:text-7xl font-bold leading-tight tracking-tight relative font-display">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text font-display text-transparent">
                Hidden Vote
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl max-w-3xl mx-auto text-white font-display tracking-tight">
              Private voting powered by Zero-Knowledge Proofs
            </p>

            {/* Description */}
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-200">
              Create secure voting sessions where individual votes remain completely private while results stay
              verifiable and transparent on the blockchain.
            </p>

            {/* CTA Button */}
            <div className="pt-6">
              <Link
                href="/votings"
                className="btn btn-primary btn-lg gap-2 shadow-2xl hover:scale-105 transition-transform"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-8 py-32 lg:py-48">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 font-display tracking-tight">
          Why Hidden Vote?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card bg-base-200 border border-blue-200 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-400/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="card-title text-2xl font-display">Complete Privacy</h3>
              <p className="m-0 opacity-70">
                Your vote remains encrypted and anonymous. Zero-knowledge proofs ensure nobody can see how you voted.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card bg-base-200 border border-purple-200 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-400/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="card-title text-2xl font-display">Blockchain Verified</h3>
              <p className="m-0 opacity-70">
                All votes and results are cryptographically secured and permanently recorded on the blockchain.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card bg-base-200 border border-pink-200 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-pink-400/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="card-title text-2xl font-display">Transparent Results</h3>
              <p className="m-0 opacity-70">
                Vote counts are publicly verifiable while maintaining individual voter anonymity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="px-2">
        <div className="relative bg-slate-900 px-6 py-24 rounded-4xl overflow-hidden">
          <div
            className="absolute inset-0 size-full opacity-70 mix-blend-overlay dark:md:opacity-100"
            style={{
              background: "url(/noise.webp) lightgray 0% 0% / 83.69069695472717px 83.69069695472717px repeat",
            }}
          ></div>
          <Image className="absolute -top-44 opacity-50" src="/blur-cyan.png" alt="" width={530} height={530} />
          <Image
            className="absolute -top-64 -right-32"
            src="/blur-cyan.png"
            alt=""
            width={530}
            height={530}
            unoptimized
          />
          <Image
            className="absolute -right-12 bottom-24"
            src="/blur-indigo.png"
            alt=""
            width={567}
            height={567}
            unoptimized
          />
          <div className="relative z-10 max-w-6xl mx-auto">
            <h2 className="text-4xl text-white md:text-5xl font-bold text-center mb-16 font-display tracking-tight">
              How It Works
            </h2>

            <div className="space-y-12 text-gray-100">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue-400 text-white flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold font-display">Create a Voting Session</h3>
                  <p className="text-lg opacity-70 mb-0">
                    Set up your question with up to 16 choices, and configure registration and voting periods.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-purple-400 text-white flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold font-display">Register to Vote</h3>
                  <p className="text-lg opacity-70 mb-0">
                    During the registration period, eligible voters register to join the voting session. This builds the
                    anonymity set that protects voter privacy when voting begins.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-pink-400 text-white flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold font-display">Cast Your Vote</h3>
                  <p className="text-lg opacity-70 mb-0">
                    Submit your encrypted vote during the voting period using zero-knowledge proofs to maintain privacy.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-purple-500 text-white flex items-center justify-center text-2xl font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold font-display">View Results</h3>
                  <p className="text-lg opacity-70 mb-0">
                    Once voting ends, results are tallied and publicly displayed while individual votes remain private.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-8 py-32 lg:py-48 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 font-display tracking-tight">Ready to Get Started?</h2>
        <p className="text-xl opacity-70 mb-12 max-w-2xl mx-auto">
          Experience the future of private, secure, and transparent voting on the blockchain.
        </p>
        <Link href="/votings" className="btn btn-primary btn-lg gap-2 shadow-2xl hover:scale-105 transition-transform">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Launch App
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
