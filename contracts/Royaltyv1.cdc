import FungibleToken from "./FungibleToken.cdc"

pub contract Royalty {

     // The total amount of editions that have been created
    pub var totalEditions: UInt64

    // Events
    pub event CollectionCreated(owner: Address)
    pub event Created(tokenID: UInt64, owner: Address, startPrice: UFix64, startTime: UFix64)
    pub event Bid(tokenID: UInt64, bidderAddress: Address, bidPrice: UFix64)
    pub event Settled(tokenID: UInt64, price: UFix64)
    pub event Canceled(tokenID: UInt64)
    pub event MarketplaceEarned(amount:UFix64, owner: Address)  
    pub event TimeRemain(amount:UFix64, owner: Address) 
    pub event Extend(auctionLengthFrom: UFix64, auctionLengthTo: UFix64) 

    pub struct RoyaltyStatus {
        pub let firstCommissionAuthor: UFix64
        pub let firstCommissionPlatform: UFix64
        pub let secondCommissionAuthor: UFix64
        pub let secondCommissionPlatform: UFix64
        pub let editionId: UInt64
        //the capability to pay the platform
        pub let platformVaultCap: Capability<&{FungibleToken.Receiver}>
        //the capability to pay the author
        pub let authorVaultCap: Capability<&{FungibleToken.Receiver}>
     
        init(
            firstCommissionAuthor: UFix64,
            firstCommissionPlatform: UFix64,
            secondCommissionAuthor: UFix64,
            secondCommissionPlatform: UFix64,
            editionId: UInt64,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformVaultCap: Capability<&{FungibleToken.Receiver}>          
        ) {
            self.firstCommissionAuthor = firstCommissionAuthor
            self.firstCommissionPlatform = firstCommissionPlatform
            self.secondCommissionAuthor = secondCommissionAuthor
            self.secondCommissionPlatform = secondCommissionPlatform           
            self.editionId = editionId
            self.authorVaultCap = authorVaultCap
            self.platformVaultCap = platformVaultCap
        }
    }

    // ResourceItem contains the Resources and metadata for a single auction
    pub resource RoyaltyItem {
        pub var editionId: UInt64
        priv var firstCommissionAuthor: UFix64
        priv var firstCommissionPlatform: UFix64
        priv var secondCommissionAuthor: UFix64
        priv var secondCommissionPlatform: UFix64

        //the capability to pay the platform
        priv var platformVaultCap: Capability<&{FungibleToken.Receiver}>

        //the capability to pay the author
        priv var authorVaultCap: Capability<&{FungibleToken.Receiver}>

        init(
            firstCommissionAuthor: UFix64,
            firstCommissionPlatform: UFix64,
            secondCommissionAuthor: UFix64,
            secondCommissionPlatform: UFix64,      
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformVaultCap: Capability<&{FungibleToken.Receiver}>
        ) {
            Royalty.totalEditions = Royalty.totalEditions + (1 as UInt64)
            self.firstCommissionAuthor = firstCommissionAuthor
            self.firstCommissionPlatform = firstCommissionPlatform
            self.secondCommissionAuthor = secondCommissionAuthor
            self.secondCommissionPlatform = secondCommissionPlatform     
            self.editionId = Royalty.totalEditions     
            self.authorVaultCap = authorVaultCap
            self.platformVaultCap = platformVaultCap
        }
        
        pub fun getRoyalty() : RoyaltyStatus {

            return RoyaltyStatus(
                firstCommissionAuthor: self.firstCommissionAuthor,
                firstCommissionPlatform: self.firstCommissionPlatform,
                secondCommissionAuthor: self.secondCommissionAuthor,
                secondCommissionPlatform: self.secondCommissionPlatform,
                editionId: self.editionId,
                authorVaultCap: self.authorVaultCap,
                platformVaultCap: self.platformVaultCap
            )
        }

        pub fun changeCommission( 
            firstCommissionAuthor: UFix64,
            firstCommissionPlatform: UFix64,
            secondCommissionAuthor: UFix64,
            secondCommissionPlatform: UFix64,   
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformVaultCap: Capability<&{FungibleToken.Receiver}>
        ) {
            self.firstCommissionAuthor = firstCommissionAuthor
            self.firstCommissionPlatform = firstCommissionPlatform
            self.secondCommissionAuthor = secondCommissionAuthor
            self.secondCommissionPlatform = secondCommissionPlatform
            self.authorVaultCap = authorVaultCap
            self.platformVaultCap = platformVaultCap                
        }
       
        destroy() {
            log("destroy roaylty")            
        }
    }    

    // AuctionPublic is a resource interface that restricts users to
    // retreiving the auction price list and placing bids
    pub resource interface RoyaltyPublic {

        pub fun createRoyalty(
            firstCommissionAuthor: UFix64,
            firstCommissionPlatform: UFix64,
            secondCommissionAuthor: UFix64,
            secondCommissionPlatform: UFix64,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformVaultCap: Capability<&{FungibleToken.Receiver}>
        ): UInt64

        pub fun getRoyalty(_ id: UInt64): RoyaltyStatus
    }

    //aucti RoyaltyCollection contains a dictionary ofaucti RoyaltyItems and provides
    // methods for manipulating theaucti RoyaltyItems
    pub resource RoyaltyCollection: RoyaltyPublic  {

        // Royalty Items
        access(account) var royaltyItems: @{UInt64: RoyaltyItem} 

        init() {    
            self.royaltyItems <- {}
        }

        pub fun keys() : [UInt64] {
            return self.royaltyItems.keys
        }

        // addTokenToauctionItems adds an NFT to the auction items and sets the meta data
        // for the auction item
        pub fun createRoyalty(
            firstCommissionAuthor: UFix64,
            firstCommissionPlatform: UFix64,
            secondCommissionAuthor: UFix64,
            secondCommissionPlatform: UFix64,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformVaultCap: Capability<&{FungibleToken.Receiver}>
        ): UInt64 {

            pre {              
            
            }            
           
            let item <- create RoyaltyItem(
                firstCommissionAuthor: firstCommissionAuthor,
                firstCommissionPlatform: firstCommissionPlatform,
                secondCommissionAuthor: secondCommissionAuthor,
                secondCommissionPlatform: secondCommissionPlatform,
                authorVaultCap: authorVaultCap,
                platformVaultCap: platformVaultCap
            )

            let id = item.editionId

            // update the auction items dictionary with the new resources
            let oldItem <- self.royaltyItems[id] <- item
            
            destroy oldItem

            return id
        }
     
        pub fun getRoyalty(_ id: UInt64): RoyaltyStatus {
            // Get the auction item resources
            let itemRef = &self.royaltyItems[id] as &RoyaltyItem
            return itemRef.getRoyalty()
        }

        pub fun changeCommission(
            id: UInt64,
            firstCommissionAuthor: UFix64,
            firstCommissionPlatform: UFix64,
            secondCommissionAuthor: UFix64,
            secondCommissionPlatform: UFix64,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformVaultCap: Capability<&{FungibleToken.Receiver}>
        ) {
            let itemRef = &self.royaltyItems[id] as &RoyaltyItem
            itemRef.changeCommission(
                firstCommissionAuthor: firstCommissionAuthor,
                firstCommissionPlatform: firstCommissionPlatform,
                secondCommissionAuthor: secondCommissionAuthor,
                secondCommissionPlatform: secondCommissionPlatform,
                authorVaultCap: authorVaultCap,
                platformVaultCap: platformVaultCap
            )
        }
    
        destroy() {
            log("destroy royalty collection")
            // destroy the empty resources
            destroy self.royaltyItems
        }
    }
   

    // createRoyaltyCollection returns a new createRoyaltyCollection  resource to the caller
    pub fun createRoyaltyCollection(): @RoyaltyCollection {
        let royaltyCollection <- create RoyaltyCollection()

        return <- royaltyCollection
    }

    init() {
        self.totalEditions = (0 as UInt64)
    }   
}