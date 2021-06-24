emulator example
run test: yarn test
This is about 120 automated tests, which is combined with unit tests.
Tests time takes about 20-25 minutes, because every test is separate and hava thsese stages:
 1. lauch emulator
 2. create accounts
 3. deploy contracts
 4. setup FUSD resource
 5. mint and transfer FUSD on the account
 6. other preparation, which is specific for the test

testnet example

There are four accounts with FUSD: testnet-xtingles-1, testnet-xtingles-2, testnet-xtingles-3, testnet-xtingles-4

Collectible.

1. Check NFT on the account: 
    
    --arg Address:"0xf9e164b413a74d51" - (account's address)

    flow scripts execute ./scripts/testnet/CheckCollectible.cdc --arg Address:"0xf9e164b413a74d51" --network=testnet

Auction.

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

  flow transactions send ./transactions/testnet/CreateAuction.cdc --args-json '[ {"type": "UFix64","value": "10.0"}, {"type": "UFix64","value": "600.00"}, {"type": "UFix64","value": "1200.00"}, {"type": "UFix64","value": "20.00"}, {"type": "UFix64","value": "1624529487.00"},{"type": "UFix64","value": "20.0"}, {"type": "Address","value": "0x0bd2b85a9b5947ef"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}]' --signer testnet-xtingles-1 --network=testnet

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

   flow transactions send ./transactions/testnet/Bid.cdc --args-json '[{"type": "Address","value": "0xfc747df8f5e61fcb"},
       {"type": "UInt64","value": "1"}, {"type": "UFix64","value": "25.0"}]' --signer testnet-xtingles-4 --network=testnet


4. settle: 
  after auction time is expired, auction should be settled. settle is to pay commision and send NFT to winner.
  only owner of the auction can settle

  id: UInt64 - auction id

  flow transactions send ./transactions/testnet/Settle.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer testnet-xtingles-1 --network=testnet

5. cancel: 
 auction can be cancelled. in this case NFT wil be burt and the last bid will be returned. only owner of the auction can cancel

 id: UInt64 - auction id

flow transactions send --code ./transactions/testnet/CancelAuction.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer testnet-xtingles-1 --network=testnet


OpenEdition.

1. create:

    link: String  - (metadata NFT: link to file)         
    name: String - (metadata NFT: name)   
    author: String - (metadata NFT: author)   
    description: String - (metadata NFT: description)   
    price: UFix64,       - (price)
    startTime: UFix64,  - (start sale time at unix timestamp sec)
    saleLength: UFix64, - (length sale in sec)
    platformAddress: Address - (platform vault address to handle share commission fails)

   flow transactions send ./transactions/testnet/CreateOpenEdition.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "UFix64","value": "12.00"}, {"type": "UFix64","value": "1624530447.00"}, {"type": "UFix64","value": "300.00"}, {"type": "Address","value": "0x0bd2b85a9b5947ef"}]' --signer testnet-xtingles-1 --network=testnet

2. status: 
  --arg Address:"0xfc747df8f5e61fcb" - (account's address, where auction collection is stored)
  --arg UInt64:1 - (auction id)

  flow scripts execute ./scripts/testnet/OpenEditionStatus.cdc --arg Address:"0xfc747df8f5e61fcb" --arg UInt64:1 --network=testnet

3. purchase: 

    // auction owner address   
    openEditionAddress: Address,
    // open edition id
    id: UInt64,    
 
   flow transactions send ./transactions/testnet/PurchaseOpenEdition.cdc --args-json '[{"type": "Address","value": "0xfc747df8f5e61fcb"}, {"type": "UInt64","value": "1"}]' --signer testnet-xtingles-4 --network=testnet

4. settle: 
  after open edition time is expired, open edition should be settled. settle is set final amount of the all sold copies.
  only owner of the auction can settle

  id: UInt64 - auction id

  flow transactions send ./transactions/testnet/SettleOpenEdition.cdc --args-json '[{"type": "UInt64","value": "1"}]' --signer testnet-xtingles-1 --network=testnet

5. cancel: 
 open edition can be cancelled.  cancel is set final amount of the all sold copies and sale will be over until finish time. only owner of the auction can cancel

 id: UInt64 - open edition id

flow transactions send --code ./transactions/testnet/CancelOpenEdition.cdc --args-json '[{"type": "UInt64","value": "2"}]' --signer testnet-xtingles-1 --network=testnet

MarketPlace.

1. Send NFT to Sale (transfer from /storage/CollectibleCollection to /storage/CollectibleSale):
   tokenId: UInt64, - (NFT id)
   price: UFix64 - (price) 

   flow transactions send ./transactions/testnet/SaleNFT.cdc --args-json '[{"type": "UInt64","value": "3"}, {"type": "UFix64","value": "40.0"}]' --signer testnet-xtingles-4 --network=testnet

2. check sale (/storage/CollectibleSale): 
   
  --arg Address:"0xf9e164b413a74d51" - (account's address)

  flow scripts execute ./scripts/testnet/CheckSale.cdc --arg Address:"0xf9e164b413a74d51" --network=testnet

3. buy:

  marketplace: Address, - (seller address)
  tokenId: UInt64, - (NFT id, which to buy)

 flow transactions send ./transactions/testnet/BuyNFTMarketPlace.cdc --args-json '[{"type": "Address","value": "0xf9e164b413a74d51"}, {"type": "UInt64","value": "3"}]' --signer testnet-xtingles-4 --network=testnet

4. cancel ((transfer from /storage/CollectibleSale to /storage/CollectibleCollection):

 tokenId: UInt64, - (NFT id)

 flow transactions send ./transactions/testnet/CancelSaleMarketPlace.cdc --args-json '[{"type": "UInt64","value": "3"}]' --signer testnet-xtingles-4 --network=testnet
