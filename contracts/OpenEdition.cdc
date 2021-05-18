import FungibleToken from "./FungibleToken.cdc"
import FlowToken from "./FlowToken.cdc"
import ASMR from "./ASMR.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"
import Royalty from "./Royalty.cdc"

pub contract OpenEdition {

    pub struct OpenEditionStatus{
        pub let id: UInt64
        pub let price : UFix64
        pub let active: Bool
        pub let timeRemaining : Fix64
        pub let endTime : Fix64
        pub let startTime : Fix64
        pub let metadata: ASMR.Metadata?
        pub let completed: Bool
        pub let expired: Bool
        pub let cancelled: Bool 
     
        init(
            id:UInt64, 
            price: UFix64,            
            active: Bool, 
            timeRemaining:Fix64, 
            metadata: ASMR.Metadata?,            
            startTime: Fix64,
            endTime: Fix64,
            completed: Bool,
            expired:Bool, 
            cancelled: Bool     
        ) {
            self.id = id
            self.price = price         
            self.active = active
            self.timeRemaining = timeRemaining
            self.metadata = metadata        
            self.startTime = startTime
            self.endTime = endTime          
            self.completed = completed
            self.expired = expired
            self.cancelled = cancelled
        }
    }

    // The total amount of AuctionItems that have been created
    pub var totalOpenEditions: UInt64

    // Events
    pub event OpenEditionCollectionCreated()
    pub event Created(id: UInt64, price: UFix64, startTime: UFix64)
    pub event Purchase(openEditionId: UInt64, buyerAddress: Address, price: UFix64, tokenID: UInt64, edition: UInt64)
    pub event Earned(amount:UFix64, owner: Address, description: String)
    pub event Settled(tokenID: UInt64, price: UFix64)
    pub event Canceled(id: UInt64)

    // OpenEditionItem contains the Resources and metadata for a single auction
    pub resource OpenEditionItem {
        
        //Number of purchased NFTs
        priv var numberOfMintedNFT: UInt64

        //The id of this individual open edition
        pub let openEditionID: UInt64

        //The minimum increment for a bid. This is an english auction style system where bids increase
        priv let price: UFix64

        //the time the acution should start at
        priv var startTime: UFix64

        //The length in seconds for this auction
        priv var saleLength: UFix64

        //Right now the dropitem is not moved from the collection when it ends, it is just marked here that it has ended 
        priv var completed: Bool

        //This action was cncelled
        priv var cancelled: Bool

        priv var editionNumber: UInt64  

        priv let contractsAccountAddress: Address

        priv let metadata: ASMR.Metadata

        init(
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64, 
            editionNumber: UInt64,
            metadata: ASMR.Metadata                
        ) {
            OpenEdition.totalOpenEditions = OpenEdition.totalOpenEditions + (1 as UInt64)
            self.price = price
            self.startTime = startTime
            self.saleLength = saleLength
            self.editionNumber = editionNumber
            self.numberOfMintedNFT = 0
            self.openEditionID = OpenEdition.totalOpenEditions
            self.completed = false
            self.cancelled = false
            self.metadata = metadata
            self.contractsAccountAddress = 0xf8d6e0586b0a20c7
        }        

        pub fun getEditionNumber(id: UInt64): UInt64 {             
            return self.editionNumber
        }

        //This method should probably use preconditions more 
        pub fun settleOpenEdition()  {

            pre {
                !self.completed : "The open edition is already settled"            
                self.isAuctionExpired() : "Auction has not completed yet"
            }     
         
            self.completed = true
            
            emit Settled(tokenID: self.openEditionID, price: self.price)
        }
  
        //this can be negative if is expired
        pub fun timeRemaining() : Fix64 {
            let length = self.saleLength

            let startTime = self.startTime

            let currentTime = getCurrentBlock().timestamp

            let remaining = Fix64(startTime + length) - Fix64(currentTime)

            return remaining
        }

        pub fun isAuctionExpired(): Bool {
            let timeRemaining = self.timeRemaining()
            return timeRemaining < Fix64(0.0)
        }

        // This method should probably use preconditions more
        pub fun purchase(buyerTokens: @FungibleToken.Vault, buyerCollectionCap: Capability<&{ASMR.CollectionPublic}>) {

            pre {
                !self.completed : "The open edition has already settled"              
                self.startTime < getCurrentBlock().timestamp : "The open edition has not started yet"
                !self.cancelled : "Open edition was cancelled"
            }

            let contractsAccount = getAccount(self.contractsAccountAddress)

            let royaltyRef = contractsAccount.getCapability<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection).borrow() 
                ?? panic("Could not borrow royalty reference")     

            let royaltyStatus = royaltyRef.getRoyalty(self.editionNumber)

            for key in royaltyStatus.royalty.keys {
                let commission = self.price * royaltyStatus.royalty[key]!.firstSalePercent * 0.01

                let account = getAccount(key) 

                let vaultCap = account.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver).borrow() ?? panic("Could not borrow vault reference")     

                vaultCap.deposit(from: <- buyerTokens.withdraw(amount: commission))

                emit Earned(amount: commission, owner: vaultCap.owner!.address, description: royaltyStatus.royalty[key]!.description)
            }

            emit Purchase(openEditionId: self.openEditionID, buyerAddress: buyerCollectionCap.borrow()!.owner!.address, price: self.price, tokenID: newNFTId, edition: self.numberOfMintedNFT)
        }

        pub fun getAuctionStatus() : OpenEditionStatus {       

            return OpenEditionStatus(
                id: self.openEditionID,
                price: self.price,             
                active: !self.completed && !self.isAuctionExpired(),
                timeRemaining: self.timeRemaining(),
                metadata: self.metadata,             
                startTime: Fix64(self.startTime),
                endTime: Fix64(self.startTime + self.saleLength),            
                completed: self.completed,
                expired: self.isAuctionExpired(),
                cancelled: self.cancelled           
            )
        }

        pub fun cancelAuction() {
            self.cancelled = true
        }

        destroy() {
            log("destroy open editions")                       
         
        }
    }    

    // AuctionPublic is a resource interface that restricts users to
    // retreiving the auction price list and placing bids
    pub resource interface OpenEditionPublic {

        pub fun createOpenEdition(
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64, 
            editionNumber: UInt64,
            metadata: ASMR.Metadata    
        ) 

        pub fun getOpenEditionStatuses(): {UInt64: OpenEditionStatus}
        pub fun getOpenEditionStatus(_ id : UInt64):  OpenEditionStatus
        pub fun getTimeLeft(_ id: UInt64): Fix64
        pub fun cancelOpenEdition(_ id: UInt64)

        pub fun purchase(
            id: UInt64, 
            buyerTokens: @FungibleToken.Vault,      
            collectionCap: Capability<&{ASMR.CollectionPublic}>
        )
    }

    // AuctionCollection contains a dictionary of AuctionItems and provides
    // methods for manipulating the AuctionItems
    pub resource OpenEditionCollection: OpenEditionPublic {
        // Auction Items
        access(account) var openEditionsItems: @{UInt64: OpenEditionItem}     

        init() {
            self.openEditionsItems <- {}
        }

        pub fun keys() : [UInt64] {
            return self.openEditionsItems.keys
        }

        // addTokenToauctionItems adds an NFT to the auction items and sets the meta data
        // for the auction item
        pub fun createOpenEdition(        
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64, 
            editionNumber: UInt64,
            metadata: ASMR.Metadata     
        ) {

            pre {              
                saleLength > 0.00 : "Sale lenght should be more then 0.00"
                startTime > getCurrentBlock().timestamp : "Start time can't be in the past"
                price > 0.00 : "Price should be more then 0.00"
            }            
        
            let item <- create OpenEditionItem(
                price: price,
                startTime: startTime,
                saleLength: saleLength, 
                editionNumber: editionNumber,
                metadata: metadata     
            )

            let id = item.openEditionID

            // update the auction items dictionary with the new resources
            let oldItem <- self.openEditionsItems[id] <- item
            
            destroy oldItem         

            emit Created(id: id, price: price, startTime: startTime)
        }

        // getAuctionPrices returns a dictionary of available NFT IDs with their current price
        pub fun getOpenEditionStatuses(): {UInt64: OpenEditionStatus} {
            pre {
                self.openEditionsItems.keys.length > 0: "There are no open edition items"
            }

            let priceList: {UInt64: OpenEditionStatus} = {}

            for id in self.openEditionsItems.keys {
                let itemRef = &self.openEditionsItems[id] as? &OpenEditionItem
                priceList[id] = itemRef.getAuctionStatus()
            }
            
            return priceList
        }

        pub fun getOpenEditionStatus(_ id:UInt64): OpenEditionStatus {
            pre {
                self.openEditionsItems[id] != nil:
                    "NFT doesn't exist"
            }

            // Get the auction item resources
            let itemRef = &self.openEditionsItems[id] as &OpenEditionItem
            return itemRef.getAuctionStatus()
        }

        pub fun getTimeLeft(_ id: UInt64): Fix64 {
            pre {
                self.openEditionsItems[id] != nil:
                    "Open Edition doesn't exist"
            }

            // Get the auction item resources
            let itemRef = &self.openEditionsItems[id] as &OpenEditionItem
            return itemRef.timeRemaining()
        }

        // settleAuction sends the auction item to the highest bidder
        // and deposits the FungibleTokens into the auction owner's account
        pub fun settleOpenEdition(_ id: UInt64) {
            let itemRef = &self.openEditionsItems[id] as &OpenEditionItem
            itemRef.settleOpenEdition()
        }

        pub fun cancelOpenEdition(_ id: UInt64) {
            pre {
                self.openEditionsItems[id] != nil:
                    "Open Edition does not exist"
            }
            let itemRef = &self.openEditionsItems[id] as &OpenEditionItem     
            itemRef.cancelAuction()
            emit Canceled(id: id)
        }

        // purchase sends the buyer's tokens to the buyer's tokens vault      
        pub fun purchase(
            id: UInt64, 
            buyerTokens: @FungibleToken.Vault,      
            collectionCap: Capability<&{ASMR.CollectionPublic}>
        ) {
            pre {
                self.openEditionsItems[id] != nil:
                    "Open Edition does not exist"
            }

            // Get the auction item resources
            let itemRef = &self.openEditionsItems[id] as &OpenEditionItem
            itemRef.purchase(
                buyerTokens: <- buyerTokens,
                buyerCollectionCap: collectionCap
            )
        }

        destroy() {
            log("destroy open edition collection")
            // destroy the empty resources
            destroy self.openEditionsItems
        }
    }

    // createAuctionCollection returns a new AuctionCollection resource to the caller
    pub fun createAuctionCollection(): @OpenEditionCollection {
        let auctionCollection <- create OpenEditionCollection()

        emit OpenEditionCollectionCreated()
        return <- auctionCollection
    }

    init() {
        self.totalOpenEditions = (0 as UInt64)
    }   
}