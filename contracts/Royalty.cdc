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

    pub struct CommissionStructure {
        pub let firstSalePercent: UFix64
        pub let secondSalePercent: UFix64
        pub let description: String
     
        init(          
            firstSalePercent: UFix64, 
            secondSalePercent: UFix64,
            description: String     
        ) {           
            self.firstSalePercent = firstSalePercent
            self.secondSalePercent = secondSalePercent
            self.description = description
        }
    }

    pub struct RoyaltyStatus {
        pub let royalty: { Address: CommissionStructure }  
        pub let editionId: UInt64      

        init(
            royalty: { Address: CommissionStructure },
            editionId: UInt64     
        ) {
            self.royalty = royalty                    
            self.editionId = editionId
        }
    }

    // ResourceItem contains the Resources and metadata for a single auction
    pub resource RoyaltyItem {
        pub let editionId: UInt64
        pub var royalty: { Address: CommissionStructure }   

        init(
            royalty: { Address: CommissionStructure }
        ) {
            Royalty.totalEditions = Royalty.totalEditions + (1 as UInt64)
            self.royalty = royalty                    
            self.editionId = Royalty.totalEditions 
        }
        
        pub fun getRoyalty() : RoyaltyStatus {
            return RoyaltyStatus(
                royalty: self.royalty,                      
                editionId: self.editionId
            )
        }

        pub fun changeCommission(      
           royalty: { Address: CommissionStructure }     
        ) {
            self.royalty = royalty         
        }
       
        destroy() {
            log("destroy royalty")            
        }
    }    

    // AuctionPublic is a resource interface that restricts users to
    // retreiving the auction price list and placing bids
    pub resource interface RoyaltyPublic {

        pub fun createRoyalty(
            royalty: { Address: CommissionStructure }      
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
            royalty: { Address: CommissionStructure }        
        ): UInt64 {

            pre {              
            
            }            
           
            let item <- create RoyaltyItem(
                royalty: royalty                   
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
            royalty: { Address: CommissionStructure }   
        ) {
            let itemRef = &self.royaltyItems[id] as &RoyaltyItem
            itemRef.changeCommission(
                royalty: royalty            
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