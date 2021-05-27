1. install flow cli https://docs.onflow.org/flow-cli/install
2. launch flow emulator in the separate console in the root of this project (flow emulator start)
3. create the second account: 
flow accounts create --key a6ef4cce7ee66d34909966a403388ca72b5134f644bc6de0911abd2d1ce524ab8955bfbb22b6182f83ee8c30db621e2cb10417216cce35b902af0e4670ebe5f4 --signer emulator-account
4. deploy contracts for emulator-account: flow project deploy --update (possibly in case of error you have to regenerate your keys by (flow keys generate) and replace emulator-account keys in flow.json by new generated private key)
5. execute command in cli mint NFT: 
flow transactions send --code ./transactions/MintASMR.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "1"}]' --signer emulator-account
6. check NFTs on emulator account: flow scripts execute ./scripts/CheckASMR.cdc --arg Address:"0xf8d6e0586b0a20c7"
7. check balance on emulator account: flow scripts execute ./scripts/GetBalance.cdc --arg Address:"0xf8d6e0586b0a20c7"
8. check balance on the second account: flow scripts execute ./scripts/GetBalance.cdc --arg Address:"0x01cf0e2f2f715450"
9. transfer money from emulator account to the second account: 
flow transactions send --code ./transactions/TransferTokens.cdc --args-json '[{"type": "UFix64","value": "5000.00"}, {"type": "Address","value": "0x01cf0e2f2f715450"}]' --signer emulator-account
10. repeat steps 7 and 8
11. move NFT to sale storage for emulator account: flow transactions send --code ./transactions/SaleNFT.cdc --args-json '[{"type": "UInt64","value": "0"}, {"type": "UFix64","value": "897.0"}]' --signer emulator-account
12. check NFTs on emulator account: flow scripts execute ./scripts/CheckASMR.cdc --arg Address:"0xf8d6e0586b0a20c7"
13. check NFT's sale storage on emulator account: flow scripts execute ./scripts/CheckSale.cdc --arg Address:"0xf8d6e0586b0a20c7"
14. buy NFT from the second account: flow transactions send --code ./transactions/BuyNFTFromSale.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "UInt64","value": "0"}]' --signer second-account
15. check NFT on the second account: flow scripts execute ./scripts/CheckASMR.cdc --arg Address:"0x01cf0e2f2f715450"
16. check balance on the second account: flow scripts execute ./scripts/GetBalance.cdc --arg Address:"0x01cf0e2f2f715450"
17. check balance on emulator account: flow scripts execute ./scripts/GetBalance.cdc --arg Address:"0xf8d6e0586b0a20c7"
18. move NFT to sale storage for second account: flow transactions send --code ./transactions/SaleNFT.cdc --args-json '[{"type": "UInt64","value": "0"}, {"type": "UFix64","value": "897.0"}]' --signer second-account
19. check NFT on the second account: flow scripts execute ./scripts/CheckASMR.cdc --arg Address:"0x01cf0e2f2f715450"
20. check NFT's sale storage on the second account: flow scripts execute ./scripts/CheckSale.cdc --arg Address:"0x01cf0e2f2f715450"
21. cancel sale. move NFT from sale storage to NFT account storage: 
  flow transactions send --code ./transactions/CancelSale.cdc --args-json '[{"type": "UInt64","value": "0"}]' --signer second-account
22. repeat steps 19 and 20


You can execute test inside this project:
1. "flow emulator -v" in separate console
2. npm install
3. flow project deploy --update
4. npm run test

The other way to execute tests is inside Docker.

flow scripts execute ./scripts/CheckAuctionStatuses.cdc --arg Address:"0xf8d6e0586b0a20c7"

flow scripts execute ./scripts/CheckAuctionTime.cdc --arg Address:"0xf8d6e0586b0a20c7" --arg UInt64:"1"

flow transactions send --code ./transactions/Bid.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, 
{"type": "UInt64","value": "1"}, {"type": "UFix64","value": "1000.0"}]' --signer second-account

flow transactions send --code ./transactions/CancelAuction.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "UInt64","value": "2"}]' --signer emulator-account

flow transactions send --code ./transactions/CreateAuction.cdc --args-json '[{"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "600.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "1621290161.00"},{"type": "UFix64","value": "1000.0"}]' --signer emulator-account

flow accounts create --key 4267a5ef429dbc569172013021563b73466121394448f3360d146bfb16f9008f1b39e6c6fcb8cff7e96e512e64e6888f1749cd14e63c28da26684a1df1a745a4 --signer emulator-account

flow transactions send --code ./transactions/TransferTokens.cdc --args-json '[{"type": "UFix64","value": "5000.00"}, {"type": "Address","value": "0x01cf0e2f2f715450"}]' --signer emulator-account

flow transactions send --code ./transactions/Bid.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "UInt64","value": "1"}, {"type": "UFix64","value": "1000.0"}]' --signer second-account


flow transactions send --code ./transactions/Settle.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer emulator-account

flow transactions send --code ./transactions/CreateRoyalty.cdc --args-json '[{"type": "UFix64","value": "10.00"}, {"type": "UFix64","value": "20.00"},  {"type": "UFix64","value": "10.00"},  {"type": "UFix64","value": "15.00"}, {"type": "Address","value": "0x179b6b1cb6755e31"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}]' --signer emulator-account

flow scripts execute ./scripts/CheckRoyalty.cdc --arg Address:"0xf8d6e0586b0a20c7" --arg UInt64:"1"

flow transactions send --code ./transactions/ChangeRoyalty.cdc --args-json '[{"type": "UInt64","value": "1"}, {"type": "UFix64","value": "10.00"}, {"type": "UFix64","value": "20.00"},  {"type": "UFix64","value": "10.00"},  {"type": "UFix64","value": "17.77"}, {"type": "Address","value": "0x179b6b1cb6755e31"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}]' --signer emulator-account

flow scripts execute ./scripts/CheckRoyalty.cdc --arg Address:"0xf8d6e0586b0a20c7" --arg UInt64:"1"

flow scripts execute ./scripts/CheckEditionNumberNFT.cdc --arg Address:"0xf8d6e0586b0a20c7" --arg UInt64:"0"

flow transactions send --code ./transactions/CreateAuction.cdc --args-json '[{"type": "UInt64","value": "0"}, {"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "600.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "1621261126.00"},{"type": "UFix64","value": "1000.0"}]' --signer emulator-account


flow transactions send --code ./transactions/CreateRoyalty.cdc --args-json 
'{"type": "Dictionary",
"value": [
    {
      "key": {
        "type": "Address",
        "value": "0xf8d6e0586b0a20c7"
      },
      "value": {
          "type": "Struct",
          "value": {            
              "fields": [
                  {
                    "name": "firstSalePercent",
                    "value":  "1.00"
                  },   
                  {
                    "name": "secondSalePercent",
                    "value": "1.00"
                  },
                  {
                    "name": "description",
                    "value": "xxx"
                  }
              ]
          }
      }
    }
]}' --signer emulator-account


flow transactions send --code ./transactions/CreateOpenEdition.cdc --signer emulator-account


flow transactions send --code ./transactions/CreateOpenEdition.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "1"},{"type": "UInt64","value": "1"},  {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "	1621429701.00"}, {"type": "UFix64","value": "300.00"}]' --signer emulator-account

flow scripts execute ./scripts/CheckOpenEditionStatuses.cdc --arg Address:"0xf8d6e0586b0a20c7"

flow transactions send --code ./transactions/PurchaseOpenEdition.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, 
{"type": "UInt64","value": "1"}]' --signer second-account

flow transactions send --code ./transactions/CreateOpenEdition.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "1"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "1621433700.00"}, {"type": "UFix64","value": "300.00"}]' --signer emulator-account

flow transactions send --code ./transactions/PurchaseOpenEdition.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, 
{"type": "UInt64","value": "3"}]' --signer second-account


flow transactions send --code ./transactions/CreateAuction.cdc --args-json '[{"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "600.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "	1621439123.00"},{"type": "UFix64","value": "1000.0"}]' --signer emulator-account


flow transactions send --code ./transactions/AddNFTInAuction.cdc --args-json '[{"type": "UInt64","value": "1"}, {"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "1"}]' --signer emulator-account


flow transactions send --code ./transactions/CreateDrawing.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "1"}, {"type": "UFix64","value": "120.00"}, {"type": "UFix64","value": "1621611328.00"}, {"type": "UFix64","value": "300.00"}]' --signer emulator-account

flow transactions send --code ./transactions/DrawingBid.cdc --args-json '[{"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "UInt64","value": "1"}]' --signer second-account


flow transactions send --code ./transactions/Tick.cdc --signer emulator-account

flow transactions send --code ./transactions/SettleDrawing.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer emulator-account

flow transactions send --code ./transactions/CreatePackSale.cdc --args-json '[{"type": "UFix64","value": "120.00"}, { "type": "UFix64","value": "1622126157.00"}, {"type": "UFix64","value": "300.00"}]' --signer emulator-account

flow transactions send --code ./transactions/MintPacks.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "10"}, {"type": "UInt64","value": "1"}, {"type": "UInt64","value": "1"}]' --signer emulator-account

flow scripts execute ./scripts/CheckPackSale.cdc --arg Address:"0xf8d6e0586b0a20c7"