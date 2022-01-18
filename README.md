emulator example
run test: npm run test
This is about 120 automated tests, which is combined with unit tests.
Tests time takes about 20-25 minutes, because every test is separate and hava these stages:
 1. lauch emulator
 2. create accounts
 3. deploy contracts
 4. setup FUSD resource
 5. mint and transfer FUSD on the account
 6. other preparation, which are specific for the test

testnet example

There are four accounts with setup FUSD resource and fungible token on the balance: testnet-xtingles-1, testnet-xtingles-2, testnet-xtingles-3, testnet-xtingles-4.

  "testnet-xtingles-1": {
    "address": "0xfc747df8f5e61fcb",
  },
  "testnet-xtingles-2": {
    "address": "0xefb501878aa34730",	
  },
  "testnet-xtingles-3": {
    "address": "0x0bd2b85a9b5947ef",
  },
  "testnet-xtingles-4": {
    "address": "0xf9e164b413a74d51",
  },

Collectible.

1. Check NFT on the account: 
    
    --arg Address:"0xf9e164b413a74d51" - (account's address)

    flow scripts execute ./scripts/testnet/CheckCollectible.cdc --arg Address:"0x5dbf3321dc1b66e8" --network=mainnet

Auction (english type of auction with extended lenght).

1. create: 

  minimumBidIncrement: UFix64 - (min precent different between two bids in a row) 
  auctionLength: UFix64 - (initial auction length in sec)
  extendedLength: UFix64 - (length in sec to extend auction in case of bid and time until finish less than remain LengthToExtend)
  remainLengthToExtend: UFix64 - (time until finish, when auction is extended in case of bid)
  auctionStartTime: UFix64 - (start auction time at unix timestamp sec)
  startPrice: UFix64 - (iniial price) 
  platformAddress: Address - (platform vault address to handle share commission fails)
  link: String  - (metadata NFT: link to file)         
  name: String - (metadata NFT: name)   
  author: String - (metadata NFT: author)   
  description: String - (metadata NFT: description)   

  flow transactions send ./transactions/testnet/CreateAuction.cdc --args-json '[ {"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "60000.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "20.00"}, {"type": "UFix64","value": "1632256046.00"},{"type": "UFix64","value": "20.0"}, {"type": "Address","value": "0x0bd2b85a9b5947ef"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}]' --signer testnet-xtingles-2 --network=testnet

2. check auction status: 
  --arg Address:"0xfc747df8f5e61fcb" - (account's address, where auction collection is stored)
  --arg UInt64:1 - (auction id)

  flow scripts execute ./scripts/testnet/CheckAuctionStatus.cdc --arg Address:"0xfc747df8f5e61fcb" --arg UInt64:1 --network=testnet

3. bid:
    // auction owner address
    address: Address,
    // auction id
    id: UInt64,    
    // bid amount
    amount: UFix64

   flow transactions send ./transactions/testnet/Bid.cdc --args-json '[{"type": "Address","value": "0xefb501878aa34730"},
       {"type": "UInt64","value": "1"}, {"type": "UFix64","value": "5.0"}]' --signer testnet-xtingles-3 --network=testnet

   flow transactions send ./transactions/RemoveCapability.cdc --signer testnet-account --network=testnet

  flow transactions send ./transactions/UnlinkCapability.cdc --signer testnet-account --network=testnet

4. settle: 
  after auction time is expired, auction should be settled. settle is to pay commision and send NFT to winner.
  only owner of the auction can settle

  id: UInt64 - auction id

  flow transactions send ./transactions/testnet/Settle.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer testnet-xtingles-1 --network=testnet

5. cancel: 
 auction can be cancelled. in this case NFT wil be burt and the last bid will be returned. only owner of the auction can cancel

 id: UInt64 - auction id

flow transactions send ./transactions/testnet/CancelAuction.cdc --args-json '[{"type": "UInt64","value": "2"}]' --signer testnet-xtingles-1 --network=testnet


Open Edition (purchase with fixed time lengh to sell one item with sold number of copies).

1. create:

    link: String  - (metadata NFT: link to file)         
    name: String - (metadata NFT: name)   
    author: String - (metadata NFT: author)   
    description: String - (metadata NFT: description)   
    price: UFix64,       - (price)
    startTime: UFix64,  - (start sale time at unix timestamp sec)
    saleLength: UFix64, - (length sale in sec)
    platformAddress: Address - (platform vault address to handle share commission fails)

   flow transactions send ./transactions/testnet/CreateOpenEdition.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "UFix64","value": "12.00"}, {"type": "UFix64","value": "1632263543.00"}, {"type": "UFix64","value": "300000.00"}, {"type": "Address","value": "0x96c8ac9a55867f24"}]' --signer testnet-xtingles-2 --network=testnet

2. status: 
  --arg Address:"0xfc747df8f5e61fcb" - (account's address, where auction collection is stored)
  --arg UInt64:1 - (auction id)

  flow scripts execute ./scripts/testnet/OpenEditionStatus.cdc --arg Address:"0xfc747df8f5e61fcb" --arg UInt64:1 --network=testnet

3. purchase: 

    // auction owner address   
    openEditionAddress: Address,
    // open edition id
    id: UInt64,    
 
   flow transactions send ./transactions/testnet/PurchaseOpenEdition.cdc --args-json '[{"type": "Address","value": "0xefb501878aa34730"}, {"type": "UInt64","value": "1"}]' --signer testnet-xtingles-2 --network=testnet

4. settle: 
  after open edition time is expired, open edition should be settled. settle is set final amount of the all sold copies.
  only owner of the auction can settle

  id: UInt64 - auction id

  flow transactions send ./transactions/testnet/SettleOpenEdition.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer testnet-xtingles-1 --network=testnet

5. cancel: 
 open edition can be cancelled.  cancel is set final amount of the all sold copies and sale will be over until finish time. only owner of the auction can cancel

 id: UInt64 - open edition id

flow transactions send ./transactions/testnet/CancelOpenEdition.cdc --args-json '[{"type": "UInt64","value": "2"}]' --signer testnet-xtingles-1 --network=testnet

Marketplace.

1. Send NFT to Sale (transfer from /storage/CollectibleCollection to /storage/CollectibleSale):
   tokenId: UInt64, - (NFT id)
   price: UFix64 - (price) 

   flow transactions send ./transactions/testnet/SaleNFT.cdc --args-json '[{"type": "UInt64","value": "86"}, {"type": "UFix64","value": "4.0"}]' --signer testnet-xtingles-2 --network=testnet

2. check sale (/storage/CollectibleSale): 
   
  --arg Address:"0xf9e164b413a74d51" - (account's address)

  flow scripts execute ./scripts/testnet/CheckSale.cdc --arg Address:"0x4cf4918adcd96011" --network=mainnet

3. buy:

  marketplace: Address, - (seller address)
  tokenId: UInt64, - (NFT id, which to buy)

 flow transactions send ./transactions/testnet/BuyNFTMarketPlace.cdc --args-json '[{"type": "Address","value": "0xefb501878aa34730"}, {"type": "UInt64","value": "90"}]' --signer testnet-xtingles-3 --network=testnet

4. cancel ((transfer from /storage/CollectibleSale to /storage/CollectibleCollection):

 tokenId: UInt64, - (NFT id)

 flow transactions send ./transactions/testnet/CancelSaleMarketPlace.cdc --args-json '[{"type": "UInt64","value": "89"}]' --signer testnet-xtingles-2 --network=testnet

5. change price: 
  tokenId: UInt64 - (NFT id)
  price: UFix64 - (price) 

  flow transactions send ./transactions/testnet/ChangePriceMarketPlace.cdc --args-json '[{"type": "UInt64","value": "1"},  {"type": "UFix64","value": "5.0"}]' --signer testnet-xtingles-4 --network=testnet
   


Edition.
 (We use this contract to manage commission and store item's amount of copies. In case of open edition, the final amount of copies will be known only after finish of purchase).

 1. Change commission:
    id: UInt64 - (unique number for issue all copies of item. this number is dictionary key to store commission information on the Edition resource)

    flow transactions send ./transactions/testnet/ChangeCommission.cdc --args-json '[{"type": "UInt64","value": "2"}]' --signer testnet-xtingles-1 --network=testnet

2.  check commission information by edition number: 
    --arg Address:"0xfc747df8f5e61fcb" - adress, where stores common information for issue of all copies
    --arg UInt64:2 - unique number for all copies

    flow scripts execute ./scripts/testnet/GetEdition.cdc --arg Address:"0xf5b0eb433389ac3f" --arg UInt64:1 --network=mainnet

    royalty - commission
    maxEditon - amount of copies
    editionId -  unique editionNumber

3. check editionNumber (unique for all copies of the item) for NFT:1631563808
    --arg Address:"0x0bd2b85a9b5947ef" - (NFT owner's address)
    --arg UInt64:1 - (NFT id)
    
   flow scripts execute ./scripts/testnet/CheckEditionNumberNFT.cdc --arg Address:"00xf5b0eb433389ac3f" --arg UInt64:1 --network=mainnet

   You can commission info and amount of copies by script from point 2.


   Blocto.

    Edition and Collectible Contracts  are deployed to dev-account (testnet).

    flow transactions send ./transactions/blocto/MintCollectible.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "1"}]' --signer new-account --network=testnet

    // The firth 4 parameters are metadata.
    // The fifth is amount of issued tokens.

    flow transactions send ./transactions/blocto/SetupNFTStorage.cdc --signer new-account --network=testnet

    // Setup NFT storage

    flow transactions send ./transactions/blocto/TransferNFT.cdc --args-json '[{"type": "Address","value": "0x0bd2b85a9b5947ef"}, {"type": "UInt64","value": "1"}]' --signer testnet-xtingles-4 --network=testnet

    // Recipient of NFT
    // NFT id

    flow scripts execute ./scripts/blocto/CheckCollectibles.cdc --arg Address:"0x01547a7e742007d9" --arg Address:"0x01547a7e742007d9" --network=testnet

    // Script to display NFT info in storage
    // The first argument is owner address
    // The second is account, where was deployed Edition contract. Need to exract final amount of minted NFT



    flow scripts execute ./scripts/blocto/CheckCollectibles.cdc --arg Address:"0x01547a7e742007d9" --network=testnet


      flow transactions send ./transactions/checkLogin.cdc --args-json '[{"type": "String","value": "xxx"}]' --signer testnet-xtingles-1 --network=mainnet



    flow transactions send ./transactions/AddKey.cdc --args-json '[{"type": "String","value": "82db8e6544c20df4fce368155e1bd6ae70fb8b239a7da977b62e97f912e7ff0055729656b0927cc1118126343e2c53455a839b9004d93d8acac5281ddac80648"}]' --signer testnet-xtingles-1 --network=mainnet

 flow scripts execute ./scripts/testnet/CheckCollectible.cdc --arg Address:"0x4cf4918adcd96011" --network=mainnet

 flow transactions send ./transactions/RevokeKey.cdc --signer testnet-xtingles-1 --network=mainnet


 flow transactions send ./transactions/Transaction.cdc --signer testnet-xtingles-1 --network=mainnet



 flow scripts execute ./scripts/testnet/xxx.cdc --network=mainnet


  flow transactions send ./transactions/transfer_tokens.cdc --args-json '[{"type": "UFix64","value": "0.5"}, {"type": "Address","value": "0xf5b0eb433389ac3f"}]' --signer testnet-xtingles-4 --network=mainnet

flow transactions send ./transactions/RemoveCapability.cdc --signer testnet-xtingles-4 --network=testnet


  flow transactions send ./transactions/blocto/MintCollectible.cdc --args-json '[{"type": "Address","value": "0x55370037286514e7"}, {"type": "UInt64","value": "${value}"}]' --signer staging-account --network=testnet --gas-limit=9999

 
  flow scripts execute ./scripts/blocto/CheckCollectible.cdc --arg Address:"0x5f14b7e68e0bc3c3" --network=mainnet

 flow transactions send ./transactions/blocto/SetupNFTStorage.cdc  --signer new-account-5 --network=testnet 

  flow transactions send ./transactions/blocto/CreateEdition.cdc  --signer testnet-xtingles-1 --network=mainnet 


AuctionV2

  1. Create
  flow transactions send ./transactions/testnet/CreateAuctionV2.cdc --args-json '[ {"type": "UFix64","value": "5.0"}, {"type": "UFix64","value": "60000.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "20.00"}, {"type": "UFix64","value": "1635108918.00"},
{"type": "UFix64","value": "0.00"}, {"type": "UFix64","value": "20.0"}, {"type": "Address","value": "0x0bd2b85a9b5947ef"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}]' --signer dev-account --network=testnet

  2. Status 
  flow scripts execute ./scripts/testnet/CheckAuctionV2Status.cdc --arg Address:"0x1bc62b2c04dfd147" --arg UInt64:11 --network=testnet

  3. bid:
    // auction owner address
    address: Address,
    // auction id
    id: UInt64,    
    // bid amount
    amount: UFix64

   flow transactions send ./transactions/testnet/BidAuctionV2.cdc --args-json '[{"type": "Address","value": "0x1bc62b2c04dfd147"},
       {"type": "UInt64","value": "11"}, {"type": "UFix64","value": "20.0"}]' --signer dev-account --network=testnet


 4. Settle

  flow transactions send ./transactions/testnet/SettleAuctionV2.cdc --args-json '[{"type": "UInt64","value": "10"}]' --signer dev-account --network=testnet

  5. Cancel 
    
flow transactions send ./transactions/testnet/CancelAuctionV2.cdc --args-json '[{"type": "UInt64","value": "9"}]'  --signer dev-account  --network=testnet


OpenEditionV3

 1. Create
 flow transactions send ./transactions/testnet/CreateOpenEditionV3.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "UFix64","value": "1.00"}, {"type": "UFix64","value": "1635703841.00"}, {"type": "UFix64","value": "300000.00"}, {"type": "Address","value": "0x2695ea898b04f0c0"}, {"type": "UInt64","value": "200"}]' --signer testnet-account --network=testnet

2. status: 
  --arg Address:"0xfc747df8f5e61fcb" - (account's address, where auction collection is stored)
  --arg UInt64:1 - (auction id)

  flow scripts execute ./scripts/testnet/OpenEditionStatusV3.cdc --arg Address:"0x2695ea898b04f0c0" --arg UInt64:20 --network=testnet


3. purchase: 

    // open edition owner address   
    openEditionAddress: Address,
    // open edition id
    id: UInt64,    
 
   flow transactions send ./transactions/testnet/PurchaseOpenEditionV3.cdc --args-json '[{"type": "Address","value": "0x2695ea898b04f0c0"}, {"type": "UInt64","value": "23"}, {"type": "UInt64","value": "20"}]' --signer testnet-account --network=testnet  --gas-limit=9999

4. settle: 
  after open edition time is expired or number of minted nfts , open edition should be settled. settle is set final amount of the all sold copies.
  only owner of the auction can settle

  id: UInt64 - auction id

  flow transactions send ./transactions/testnet/SettleOpenEditionV3.cdc --args-json '[{"type": "UInt64","value": "21"}]' --signer  testnet-account --network=testnet

5. cancel: 
 open edition can be cancelled.  cancel is set final amount of the all sold copies and sale will be over until finish time. only owner of the auction can cancel

 id: UInt64 - open edition id

flow transactions send ./transactions/testnet/CancelOpenEditionV3.cdc --args-json '[{"type": "UInt64","value": "21"}]' --signer testnet-account --network=testnet

  price: UFix64,
  startTime: UFix64,
  saleLength: UFix64,
  platformAddress: Address,
  numberOfMaxPack: UInt64


flow transactions send ./transactions/emulator/packlimitededition/CreatePackLimitedEdition.cdc --args-json '[{"type": "UFix64","value": "1.00"}, {"type": "UFix64","value": "1635703841.00"}, {"type": "UFix64","value": "300000.00"}, {"type": "Address","value": "0x01cf0e2f2f715450"}, {"type": "UInt64","value": "200"}]' --signer testnet-account --network=emulator