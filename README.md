1. install flow cli https://docs.onflow.org/flow-cli/install
2. launch flow emulator in the separate console in the root of this project (flow emulator start)
3. launch script: bash ./setup.sh (create 3 accounts and setup FUSD tokens)
4. check FUSD balance on 3 accounts:
  flow scripts execute ./scripts/FUSDBalance.cdc --arg Address:"0xf8d6e0586b0a20c7"
  flow scripts execute ./scripts/FUSDBalance.cdc --arg Address:"0x01cf0e2f2f715450"
  flow scripts execute ./scripts/FUSDBalance.cdc --arg Address:"0x179b6b1cb6755e31"
5. create auction transaction:
  flow transactions send --code ./transactions/CreateAuction.cdc --args-json '[{"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "600.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "1623185490.00"},{"type": "UFix64","value": "1000.0"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}]' --signer emulator-account

  Need to replace time to actual (something similar). easy to use fro this purpose https://www.unixtimestamp.com/.

6. check auction status (1st parameter - address where deployed auction contract. 2st - auctionId):
   flow scripts execute ./scripts/CheckAuctionStatus.cdc --arg Address:"0xf8d6e0586b0a20c7" --arg UInt64:1

7. bid:
  flow transactions send --code ./transactions/Bid.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"},
  {"type": "UInt64","value": "1"}, {"type": "UFix64","value": "1000.0"}]' --signer second-account
   

8. transaction to crate new blocks: 
   flow transactions send --code ./transactions/Tick.cdc --signer emulator-account


9. settle:
  flow transactions send --code ./transactions/Settle.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer emulator-account

10. check NFTs on account: flow scripts execute ./scripts/CheckASMR.cdc --arg Address:"0xf8d6e0586b0a20c7"
