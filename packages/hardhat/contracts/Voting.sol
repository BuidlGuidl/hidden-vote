//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {LeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/LeanIMT.sol";

import {IVerifier} from "./Verifier.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    using LeanIMT for LeanIMTData;

    IVerifier public immutable i_verifier;
    string public s_question;
    uint256 public immutable i_registrationDeadline;
    uint256 public immutable i_votingEndTime;
    string[] public s_options;

    // so that not 2 times the same commitment can be inserted
    mapping(uint256 => bool) public s_commitments;
    // so that the proof cannot be replayed - and a person can only vote once
    mapping(bytes32 => bool) public s_nullifierHashes;
    mapping(address => bool) private s_voters;
    mapping(address => bool) private s_hasRegistered;

    LeanIMTData public s_tree;
    mapping(uint256 => uint256) public s_voteCounts; // optionIndex => count

    event NewLeaf(uint256 index, uint256 value);
    event VoteCast(bytes32 indexed nullifierHash, address indexed voter, uint256 optionIndex, uint256 timestamp);
    event VoterAdded(address indexed voter);

    error Voting__CommitmentAlreadyAdded(uint256 commitment);
    error Voting__NullifierHashAlreadyUsed(bytes32 nullifierHash);
    error Voting__InvalidProof();
    error Voting__NotAllowedToVote();
    error Voting__VotersLengthMismatch();
    error Voting__RegistrationPeriodNotOver();
    error Voting__RegistrationPeriodOver();
    error Voting__InvalidOptionCount();
    error Voting__InvalidOptionIndex();
    error Voting__VotingPeriodOver();
    error Voting__VotingEndTimeMustBeAfterRegistration();
    error Voting__RegistrationDeadlineMustBeInFuture();
    error Voting__VotingEndTimeMustBeInFuture();

    constructor(
        IVerifier _verifier,
        string memory _question,
        uint256 _registrationDeadline,
        uint256 _votingEndTime,
        string[] memory _options
    ) Ownable(msg.sender) {
        if (_options.length < 2 || _options.length > 16) {
            revert Voting__InvalidOptionCount();
        }

        // Validate registration deadline is in the future
        if (_registrationDeadline <= block.timestamp) {
            revert Voting__RegistrationDeadlineMustBeInFuture();
        }

        // Validate voting end time is in the future
        if (_votingEndTime <= block.timestamp) {
            revert Voting__VotingEndTimeMustBeInFuture();
        }

        // Ensure voting end time is after registration deadline
        if (_votingEndTime <= _registrationDeadline) {
            revert Voting__VotingEndTimeMustBeAfterRegistration();
        }

        i_verifier = _verifier;
        s_question = _question;
        i_registrationDeadline = _registrationDeadline;
        i_votingEndTime = _votingEndTime;
        s_options = _options;
    }

    function addVoters(address[] calldata voters, bool[] calldata statuses) public onlyOwner {
        if (block.timestamp > i_registrationDeadline) {
            revert Voting__RegistrationPeriodOver();
        }
        if (voters.length != statuses.length) {
            revert Voting__VotersLengthMismatch();
        }

        for (uint256 i = 0; i < voters.length; i++) {
            s_voters[voters[i]] = statuses[i];
            emit VoterAdded(voters[i]);
        }
    }

    function insert(uint256 _commitment) public {
        if (block.timestamp > i_registrationDeadline) {
            revert Voting__RegistrationPeriodOver();
        }
        if (!s_voters[msg.sender] || s_hasRegistered[msg.sender]) {
            revert Voting__NotAllowedToVote();
        }
        if (s_commitments[_commitment]) {
            revert Voting__CommitmentAlreadyAdded(_commitment);
        }
        s_commitments[_commitment] = true;
        s_hasRegistered[msg.sender] = true;
        s_tree.insert(_commitment);
        emit NewLeaf(s_tree.size - 1, _commitment);
    }

    function vote(bytes memory _proof, bytes32 _root, bytes32 _nullifierHash, bytes32 _vote, bytes32 _depth) public {
        if (block.timestamp <= i_registrationDeadline) {
            revert Voting__RegistrationPeriodNotOver();
        }
        if (block.timestamp > i_votingEndTime) {
            revert Voting__VotingPeriodOver();
        }
        if (s_nullifierHashes[_nullifierHash]) {
            revert Voting__NullifierHashAlreadyUsed(_nullifierHash);
        }
        s_nullifierHashes[_nullifierHash] = true;

        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = _root;
        publicInputs[1] = _nullifierHash;
        publicInputs[2] = _vote;
        publicInputs[3] = _depth;

        if (!i_verifier.verify(_proof, publicInputs)) {
            revert Voting__InvalidProof();
        }

        uint256 optionIndex = uint256(_vote);
        if (optionIndex >= s_options.length) {
            revert Voting__InvalidOptionIndex();
        }

        s_voteCounts[optionIndex]++;

        emit VoteCast(_nullifierHash, msg.sender, optionIndex, block.timestamp);
    }

    //////////////
    // getters ///
    //////////////

    function getLeaf(uint256 index) public view returns (uint256) {
        return s_tree.leaves[index];
    }

    function getNode(uint256 index) public view returns (uint256) {
        return s_tree.sideNodes[index];
    }

    function getSize() public view returns (uint256) {
        return s_tree.size;
    }

    function getDepth() public view returns (uint256) {
        return s_tree.depth;
    }

    function getRoot() public view returns (uint256) {
        return s_tree.root();
    }

    function hasRegistered(address _voter) public view returns (bool) {
        return s_hasRegistered[_voter];
    }

    function isVoter(address _voter) public view returns (bool) {
        return s_voters[_voter];
    }

    function getVotingData(address _voter)
        public
        view
        returns (
            uint256 treeSize,
            uint256 treeDepth,
            uint256 treeRoot,
            bool isVoterStatus,
            bool hasRegisteredStatus,
            uint256 registrationDeadline,
            uint256 votingEndTime
        )
    {
        return (
            s_tree.size,
            s_tree.depth,
            s_tree.root(),
            s_voters[_voter],
            s_hasRegistered[_voter],
            i_registrationDeadline,
            i_votingEndTime
        );
    }

    function getVotingStats()
        public
        view
        returns (
            address contractOwner,
            string memory question,
            string[] memory options,
            uint256 registrationDeadline,
            uint256 votingEndTime
        )
    {
        return (owner(), s_question, s_options, i_registrationDeadline, i_votingEndTime);
    }

    function getOptionVoteCount(uint256 optionIndex) public view returns (uint256) {
        return s_voteCounts[optionIndex];
    }

    function getAllVoteCounts() public view returns (uint256[] memory) {
        uint256[] memory counts = new uint256[](s_options.length);
        for (uint256 i = 0; i < s_options.length; i++) {
            counts[i] = s_voteCounts[i];
        }
        return counts;
    }

    function getOptionsCount() public view returns (uint256) {
        return s_options.length;
    }
}
