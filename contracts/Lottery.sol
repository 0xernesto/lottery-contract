// SPDX-License-Identifier: MIT
pragma solidity ^0.4.17;

/*
    This is a lottery contract that allows an unlimited amount of participants to enter the
    lottery by sending eth to the contract address. The manager of the contract (person who 
    created the contract) will be able to trigger a function to select a random winner whenever
    they want. The price pool will be comprised of all the ETH that is collected from participants
    who joined the lottery.
*/

contract Lottery {
    address public manager;          // public variable of type address
    address[] public  participants;  // dynamic array that can only contain addresses
    address public lastWinner;       // last lottery winner

    // Constructor function that sets the manager to the person who deploys the contract
    function Lottery() public {
        // "msg" is an object that is globally available any time a function is invoked
        // We can simply access it's properties anywhere in our contract
        manager = msg.sender;
    }

    // Allow participants join by sending a minumum amount of ETH to Lottery contract
    function enter() public payable {
        require(msg.value >= 0.01 ether);
        participants.push(msg.sender);
    }

    // Helper function to return a "random" winner, although this method is not truly random
    function random() private view returns (uint) {
        // keccak256() and sha3() are the same hashing algorithm
        // return a large uint based on block difficulty, current time, and addresses of participants
        return uint(keccak256(block.difficulty, now, participants));
    }

    // Only the manager can execute this whole function
    function selectWinner() public restricted {
        // Since the random() function returns a "random" large number, we can mod (%) it by
        // the length of the participants array, which will always return a number (remainder)
        // that is between 0 and length - 1.
        // We can use this result to index the winner's address in the participants array.
        uint index = random() % participants.length;

        // Send the entire ETH balance from the contract's address to the participant's address.
        // For reference, if we instead said .transfer(1), we would be sending 1 wei
        // "this" is a reference to the instance of the current contract
        participants[index].transfer(this.balance);

        // Record the winner
        lastWinner = participants[index];

        // Create a new dynamic participants array of type address with length 0
        participants = new address[](0);
    }

    // Any function with this modifier will run the code in the modifier first
    // and then run the functions code where the underscore is in the modifer.
    // This is a great tool to avoid redundant code
    modifier restricted() {
        // Make sure that only the manager can select a winner
        require(msg.sender == manager);
        _;
    }

    // Return the entire array of participants
    function getParticipants() public view returns (address[]) {
        return participants;
    }

    // Return current lottery pot (contract balance)
    function getLotteryPotBalance() public view returns (uint) {
        return this.balance;
    }
}