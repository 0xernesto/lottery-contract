const path = require("path"); // path module (ensures cross-platform compatibility)
const fs = require("fs"); // file system module
const solc = require("solc"); // Solidity compiler

// __dirname is a node-defined constant
// __dirname is always set to the current working directory
const lotteryPath = path.resolve(__dirname, "contracts", "Lottery.sol");
const source = fs.readFileSync(lotteryPath, "utf8");

// this statement compiles our source code
// module.exports allows us to export our compiled code
module.exports = solc.compile(source, 1).contracts[":Lottery"];
