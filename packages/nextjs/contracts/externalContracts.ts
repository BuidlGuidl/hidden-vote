import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const externalContracts = {
  8453: {
    HonkVerifier: {
      address: "0xA33847e9F139c75721df1e613Dac5a578d244439",
      abi: [
        {
          inputs: [],
          name: "ProofLengthWrong",
          type: "error",
        },
        {
          inputs: [],
          name: "PublicInputsLengthWrong",
          type: "error",
        },
        {
          inputs: [],
          name: "ShpleminiFailed",
          type: "error",
        },
        {
          inputs: [],
          name: "SumcheckFailed",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "bytes",
              name: "proof",
              type: "bytes",
            },
            {
              internalType: "bytes32[]",
              name: "publicInputs",
              type: "bytes32[]",
            },
          ],
          name: "verify",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      inheritedFunctions: {},
      deployedOnBlock: 37395118,
    },
    Voting: {
      address: "0x23Bfa836CDDFD82340C9412a2298FAC40436b8cb",
      abi: [
        {
          inputs: [
            {
              internalType: "contract IVerifier",
              name: "_verifier",
              type: "address",
            },
            {
              internalType: "string",
              name: "_question",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "_registrationDuration",
              type: "uint256",
            },
            {
              internalType: "string[]",
              name: "_options",
              type: "string[]",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
          ],
          name: "OwnableInvalidOwner",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address",
            },
          ],
          name: "OwnableUnauthorizedAccount",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "commitment",
              type: "uint256",
            },
          ],
          name: "Voting__CommitmentAlreadyAdded",
          type: "error",
        },
        {
          inputs: [],
          name: "Voting__InvalidOptionCount",
          type: "error",
        },
        {
          inputs: [],
          name: "Voting__InvalidOptionIndex",
          type: "error",
        },
        {
          inputs: [],
          name: "Voting__InvalidProof",
          type: "error",
        },
        {
          inputs: [],
          name: "Voting__NotAllowedToVote",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "bytes32",
              name: "nullifierHash",
              type: "bytes32",
            },
          ],
          name: "Voting__NullifierHashAlreadyUsed",
          type: "error",
        },
        {
          inputs: [],
          name: "Voting__RegistrationPeriodNotOver",
          type: "error",
        },
        {
          inputs: [],
          name: "Voting__RegistrationPeriodOver",
          type: "error",
        },
        {
          inputs: [],
          name: "Voting__VotersLengthMismatch",
          type: "error",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "NewLeaf",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "previousOwner",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "newOwner",
              type: "address",
            },
          ],
          name: "OwnershipTransferred",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "bytes32",
              name: "nullifierHash",
              type: "bytes32",
            },
            {
              indexed: true,
              internalType: "address",
              name: "voter",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "optionIndex",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "timestamp",
              type: "uint256",
            },
          ],
          name: "VoteCast",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "voter",
              type: "address",
            },
          ],
          name: "VoterAdded",
          type: "event",
        },
        {
          inputs: [
            {
              internalType: "address[]",
              name: "voters",
              type: "address[]",
            },
            {
              internalType: "bool[]",
              name: "statuses",
              type: "bool[]",
            },
          ],
          name: "addVoters",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "getAllVoteCounts",
          outputs: [
            {
              internalType: "uint256[]",
              name: "",
              type: "uint256[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getDepth",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
          ],
          name: "getLeaf",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
          ],
          name: "getNode",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "optionIndex",
              type: "uint256",
            },
          ],
          name: "getOptionVoteCount",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getOptionsCount",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getRoot",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getSize",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_voter",
              type: "address",
            },
          ],
          name: "getVotingData",
          outputs: [
            {
              internalType: "uint256",
              name: "treeSize",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "treeDepth",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "treeRoot",
              type: "uint256",
            },
            {
              internalType: "bool",
              name: "isVoterStatus",
              type: "bool",
            },
            {
              internalType: "bool",
              name: "hasRegisteredStatus",
              type: "bool",
            },
            {
              internalType: "uint256",
              name: "registrationDeadline",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getVotingStats",
          outputs: [
            {
              internalType: "address",
              name: "contractOwner",
              type: "address",
            },
            {
              internalType: "string",
              name: "question",
              type: "string",
            },
            {
              internalType: "string[]",
              name: "options",
              type: "string[]",
            },
            {
              internalType: "uint256",
              name: "registrationDeadline",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_voter",
              type: "address",
            },
          ],
          name: "hasRegistered",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "i_registrationDeadline",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "i_verifier",
          outputs: [
            {
              internalType: "contract IVerifier",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_commitment",
              type: "uint256",
            },
          ],
          name: "insert",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_voter",
              type: "address",
            },
          ],
          name: "isVoter",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "owner",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "s_commitments",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "bytes32",
              name: "",
              type: "bytes32",
            },
          ],
          name: "s_nullifierHashes",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "s_options",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "s_question",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "s_tree",
          outputs: [
            {
              internalType: "uint256",
              name: "size",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "depth",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "s_voteCounts",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "newOwner",
              type: "address",
            },
          ],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "bytes",
              name: "_proof",
              type: "bytes",
            },
            {
              internalType: "bytes32",
              name: "_root",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "_nullifierHash",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "_vote",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "_depth",
              type: "bytes32",
            },
          ],
          name: "vote",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      inheritedFunctions: {
        owner: "@openzeppelin/contracts/access/Ownable.sol",
        renounceOwnership: "@openzeppelin/contracts/access/Ownable.sol",
        transferOwnership: "@openzeppelin/contracts/access/Ownable.sol",
      },
      deployedOnBlock: 37395177,
    },
    VotingFactory: {
      address: "0x678043eD0f934dC07F2ed5BB7B29F49bda091f0a",
      abi: [
        {
          inputs: [
            {
              internalType: "contract IVerifier",
              name: "_verifier",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "creator",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "voting",
              type: "address",
            },
            {
              indexed: false,
              internalType: "string",
              name: "question",
              type: "string",
            },
          ],
          name: "VotingCreated",
          type: "event",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "allVotings",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_question",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "_registrationDuration",
              type: "uint256",
            },
            {
              internalType: "string[]",
              name: "_options",
              type: "string[]",
            },
          ],
          name: "createVoting",
          outputs: [
            {
              internalType: "address",
              name: "voting",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "creator",
              type: "address",
            },
          ],
          name: "getVotingsByCreator",
          outputs: [
            {
              internalType: "address[]",
              name: "",
              type: "address[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "verifier",
          outputs: [
            {
              internalType: "contract IVerifier",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      inheritedFunctions: {},
      deployedOnBlock: 37395175,
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
