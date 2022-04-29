//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @title Votings.
contract Votings {
    
    struct Candidate {                
        uint id;
        uint votesCount; 
        address payable candidateAddress;        
    }

    struct Voting {
        string name;        
        uint startTime;
        uint amount;
        bool commissionWithdrawn;
        bool finished;
        uint candidatesCount;
        Candidate[] candidates;
        mapping(address => bool) voters;
    }
    
    uint public voteFee = 1e16 wei;
    uint commissionPercentage = 10;

    address public owner;
    mapping(string => Voting) private votings;
   
    constructor() {
        owner = msg.sender;
    }
    
    function addVoting(string calldata name, address payable[] calldata candidateAddresses) external {        
        require( msg.sender == owner, "Only owner can create voting.");

        Voting storage voting = votings[name];
        for (uint i = 0;i < candidateAddresses.length;i ++) {            
            voting.candidates.push(Candidate(i, uint(0), candidateAddresses[i]));
        }
        voting.candidatesCount = candidateAddresses.length;
        voting.name = name;
        voting.startTime = block.timestamp;
        voting.amount = 0;
    }

    function vote(string calldata votingName, uint candidateId) external payable {
        require (msg.value >= voteFee, "You don't have enough balance.");
        
        Voting storage voting = votings[votingName];
        require(voting.finished == false, "Voting was already finished.");
        require(!voting.voters[msg.sender], "You already voted.");
        require(candidateId < voting.candidatesCount, "Not correct candidate id.");
       
        voting.candidates[candidateId].votesCount +=1;
        voting.amount += msg.value;
        voting.voters[msg.sender] = true;
    }

    function finish(string calldata votingName) external {
        Voting storage voting = votings[votingName];
        require(voting.finished == false, "Voting was already finished.");

        uint deadline = voting.startTime + 3 days;
        require(deadline <= block.timestamp, "Voting can be closed only 3 days after the start.");

        voting.finished = true;

        address payable winner = payable(winningCandidate(votingName));
        winner.transfer(voting.amount * (100 - commissionPercentage) / 100);
    }

    function withdrawCommission(string calldata votingName)  external {
        require( msg.sender == owner, "Only owner can withdraw commission.");
            
        Voting storage voting = votings[votingName];
        require(voting.finished == true, "Voting should be finished.");
        require(!voting.commissionWithdrawn, "The commission has already been withdrawn.");
           
        payable(owner).transfer(voting.amount * commissionPercentage / 100);
        voting.commissionWithdrawn = true;
    }

    function winningCandidate(string calldata votingName) public view
            returns (address winningProposal_)
    {
        uint winningVoteCount = 0;
        Voting storage voting = votings[votingName];

        for (uint p = 0; p < voting.candidatesCount; p++) {
            if (voting.candidates[p].votesCount > winningVoteCount) {
                winningVoteCount = voting.candidates[p].votesCount;
                winningProposal_ = voting.candidates[p].candidateAddress;
            }
        }
    }

    function viewVoting(string calldata votingName) public view
            returns (string memory, Candidate[] memory, uint, bool, uint)
    {
        Voting storage voting = votings[votingName];
        return (voting.name, voting.candidates, voting.startTime, voting.finished, voting.amount);
    }
}