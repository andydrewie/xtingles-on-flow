A. emulator example

1. install flow cli https://docs.onflow.org/flow-cli/install
2. launch flow emulator in the separate console in the root of this project (flow emulator start)
3. launch script: bash ./setup.sh (create 3 accounts and setup FUSD tokens)
4. check FUSD balance on 3 accounts:
  flow scripts execute ./scripts/emulator/FUSDBalance.cdc --arg Address:"0xf8d6e0586b0a20c7"
  flow scripts execute ./scripts/emulator/FUSDBalance.cdc --arg Address:"0x01cf0e2f2f715450"
  flow scripts execute ./scripts/emulator/FUSDBalance.cdc --arg Address:"0x179b6b1cb6755e31"
5. create auction transaction:
  flow transactions send --code ./transactions/emulator/CreateAuctionWithNFT.cdc --args-json '[{"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "600.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "1623440139.00"},{"type": "UFix64","value": "1000.0"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}]' --signer emulator-account

  Need to replace time to actual (something similar). easy to use fro this purpose https://www.unixtimestamp.com/.

6. check auction status (1st parameter - address where deployed auction contract. 2st - auctionId):
   flow scripts execute ./scripts/emulator/CheckAuctionStatus.cdc --arg Address:"0xf8d6e0586b0a20c7" --arg UInt64:1

7. bid:
  flow transactions send --code ./transactions/emulator/Bid.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"},
  {"type": "UInt64","value": "1"}, {"type": "UFix64","value": "25.0"}]' --signer testnet-second-account
   

8. transaction to crate new blocks: 
   flow transactions send --code ./transactions/emulator/Tick.cdc --signer emulator-account


9. settle:
  flow transactions send --code ./transactions/emulator/Settle.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer emulator-account

10. check NFTs on account: flow scripts execute ./scripts/emulator/CheckCollectible.cdc --arg Address:"0xf8d6e0586b0a20c7"


B. testnet example
three accounts: testnet-account, testnet-second-account, testnet-third-account

1. testnet create Auction: 
  flow transactions send --code ./transactions/emulator/CreateAuctionWithNFT.cdc --args-json '[{"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "600.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "20.00"}, {"type": "UFix64","value": "1623248636.00"},{"type": "UFix64","value": "20.0"}, {"type": "Address","value": "0x2695ea898b04f0c0"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}]' --signer second-account 

2. see auction status: 
  flow scripts execute ./scripts/testnet/CheckAuctionStatus.cdc --arg Address:"0x2695ea898b04f0c0" --arg UInt64:2 --network=testnet

3. flow transactions send --code ./transactions/testnet/Bid.cdc --args-json '[{"type": "Address","value": "0x2695ea898b04f0c0"},
    {"type": "UInt64","value": "2"}, {"type": "UFix64","value": "25.0"}]' --signer testnet-second-account --network=testnet

4. flow transactions send --code ./transactions/Settle.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer testnet-account --network=testnet

5. check NFTs on account: flow scripts execute ./scripts/testnet/CheckCollectible.cdc --arg Address:"0x2695ea898b04f0c0" --network=testnet

6. flow scripts execute ./scripts/testnet/FUSDBalance.cdc --arg Address:"0x616e69383b392700" --network=testnet

flow transactions send --code ./transactions/testnet/Bid.cdc --args-json '[{"type": "Address","value": "0x616e69383b392700"}, {"type": "UInt64","value": "6"}, {"type": "UFix64","value": "2.00"}]' --signer testnet-second-account --network=testnet

flow transactions send --code ./transactions/testnet/Bid.cdc --args-json '[{"type": "Address","value": "0x2695ea898b04f0c0"}, {"type": "UInt64","value": "6"}, {"type": "UFix64","value": "2.00"}]' --signer testnet-second-account --network=testnet

flow transactions send --code ./transactions/emulator/MintCollectible.cdc --args-json '[{"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "2"}]' --signer emulator-account

flow transactions send --code ./transactions/emulator/SaleNFT.cdc --args-json '[{"type": "UInt64","value": "1"}, {"type": "UFix64","value": "33.0"}]' --signer emulator-account

flow transactions send --code ./transactions/emulator/CreateEdition.cdc --args-json '[{"type": "UFix64","value": "10.00"}, {"type": "UFix64","value": "20.00"},  {"type": "UFix64","value": "10.00"},  {"type": "UFix64","value": "15.00"}, {"type": "Address","value": "0x179b6b1cb6755e31"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}]' --signer emulator-account

 flow transactions send --code ./transactions/emulator/CreateEdition.cdc --signer emulator-account

  flow transactions send --code ./transactions/trancations/BuyNFTFromSale.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "UInt64","value": "1"}]' --signer second-account

  flow transactions send --code ./transactions/emulator/BuyNFTFromSale.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "UInt64","value": "1"}]' --signer third-account


  flow transactions send --code ./transactions/emulator/CancelAuction.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "UInt64","value": "1"}]' --signer emulator-account


  flow transactions send --code ./transactions/emulator/ChangeCommission.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer emulator-account