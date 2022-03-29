//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @title Voting.
contract Votings {
    
    struct Candidate {                
        uint votesCount; 
        address payable candidateAddress;
    }

    struct Voter {         
         bool voted;       
    }

    struct Voting {
        string name;        
        uint startTime;
        uint amount;
        bool finished;
        Candidate[] candidates;
        mapping(address => Voter) voters;
    }
    
    uint public voteFee = 1e16 wei;
    uint commissionPercentage = 10;

    address public owner;
    mapping(string => Voting) public votings;

   
    constructor() {
        owner = msg.sender;
    }
    
    function addVoting(string calldata name, address payable[] calldata candidateAddresses) external {        
        require( msg.sender == owner, "Only owner can create voting.");

        Voting storage voting = votings[name];
        for (uint i = 0;i < candidateAddresses.length;i ++) {
            voting.candidates.push(Candidate({votesCount: uint(0), candidateAddress: candidateAddresses[i]}));
        }

        voting.name = name;
        voting.startTime = block.timestamp;        
        voting.amount = 0;
    }

    function vote(string calldata votingName, address candidateAddress) external payable {
        require (msg.value >= voteFee, "You don't have enough balance.");
        
        Voting storage voting = votings[votingName];
        require(voting.finished == false, "Voting was already finished.");

        Voter storage sender = voting.voters[msg.sender];
        require(sender.voted == false, "You already voted.");
        
        for (uint i = 0;i < voting.candidates.length;i ++) {
            if (voting.candidates[i].candidateAddress == candidateAddress)
            {
                voting.candidates[i].votesCount ++;
            }            
        }
        voting.amount += msg.value;
        voting.voters[msg.sender] = Voter({voted: true});        
    }

    function finish(string calldata votingName) external {
        Voting storage voting = votings[votingName];
        require(voting.finished == false, "Voting was already finished.");

        uint deadline = voting.startTime + 3 days;
        require(deadline <= block.timestamp, "Voting can be closed only 3 days after the start.");

        voting.finished = true;
    }

    function withdrawCommission(string calldata votingName)  external {
        require( msg.sender == owner, "Only owner can withdraw commission.");
        
        Voting storage voting = votings[votingName];
        require(voting.finished == true, "Voting should be finished.");

        address payable winner = payable(winningCandidate(votingName));
        winner.transfer(voting.amount * commissionPercentage / 100);
    }

    function winningCandidate(string calldata votingName) public view
            returns (address winningProposal_)
    {
        uint winningVoteCount = 0;
        Voting storage voting = votings[votingName];

        for (uint p = 0; p < voting.candidates.length; p++) {
            if (voting.candidates[p].votesCount > winningVoteCount) {
                winningVoteCount = voting.candidates[p].votesCount;
                winningProposal_ = voting.candidates[p].candidateAddress;
            }
        }
    }

    function viewVotings(string calldata votingName) public view
            returns (Candidate[] memory candidates)
    {
        Voting storage voting = votings[votingName];
        return voting.candidates;        
    }

}