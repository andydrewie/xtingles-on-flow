import FungibleToken from "./FungibleToken.cdc"
import FlowToken from "./FlowToken.cdc"
import ASMR from "./ASMR.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"
import Royalty from "./Royalty.cdc"
import Pack from "./Pack.cdc"

pub contract PackSale {

    pub struct PackSaleStatus{
        pub let id: UInt64
        pub let price : UFix64
        pub let active: Bool
        pub let timeRemaining : Fix64
        pub let endTime : Fix64
        pub let startTime : Fix64     
        pub let completed: Bool
        pub let expired: Bool
        pub let cancelled: Bool 
     
        init(
            id:UInt64, 
            price: UFix64,            
            active: Bool, 
            timeRemaining:Fix64,      
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
            self.startTime = startTime
            self.endTime = endTime          
            self.completed = completed
            self.expired = expired
            self.cancelled = cancelled
        }
    }

    // The total amount of AuctionItems that have been created
    pub var totalPackSales: UInt64

    // Events
    pub event PackSaleCollectionCreated()
    pub event Created(id: UInt64, price: UFix64, startTime: UFix64)
    pub event Purchase(PackSaleId: UInt64, buyerAddress: Address, price: UFix64, tokenID: UInt64, edition: UInt64)
    pub event Earned(amount:UFix64, owner: Address, description: String)
    pub event Settled(id: UInt64, price: UFix64, amountMintedNFT: UInt64)
    pub event Canceled(id: UInt64)

    // PackSaleItem contains the Resources and metadata for a single auction
    pub resource PackSaleItem {
        
        //The id of this individual open edition
        pub let PackSaleID: UInt64

        //The minimum increment for a bid. This is an english auction style system where bids increase
        pub let price: UFix64

        //the time the acution should start at
        priv var startTime: UFix64

        //The length in seconds for this auction
        priv var saleLength: UFix64

        //Right now the dropitem is not moved from the collection when it ends, it is just marked here that it has ended 
        priv var completed: Bool

        //This action was cncelled
        priv var cancelled: Bool       

        priv let contractsAccountAddress: Address

        priv let royalty: {Address: UFix64}

        priv var packs: @{UInt64: Pack.NFT}

        //the capability to pay the platform when the purchase is done
        priv let platformVaultCap: Capability<&{FungibleToken.Receiver}>   

        init(
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64,
            royalty: { Address: UFix64 }
            platformVaultCap: Capability<&{FungibleToken.Receiver}>
        ) {
            PackSale.totalPackSales = PackSale.totalPackSales + (1 as UInt64)
            self.price = price
            self.startTime = startTime
            self.saleLength = saleLength           
            self.PackSaleID = PackSale.totalPackSales
            self.completed = false
            self.cancelled = false      
            self.royalty = royalty 
            self.contractsAccountAddress = 0xf8d6e0586b0a20c7
            self.platformVaultCap = platformVaultCap
            self.packs <- {}
        }        

        //This method should probably use preconditions more 
        pub fun settlePackSale(clientRoyalty: &Royalty.RoyaltyCollection)  {

            pre {
                !self.completed : "The open edition is already settled"            
                self.isAuctionExpired() : "Auction has not completed yet"
            }     
         
            self.completed = true  

            emit Settled(id: self.PackSaleID, price: self.price, amountMintedNFT: self.numberOfMintedNFT)
        }
  
        //this can be negative if is expired
        pub fun timeRemaining() : Fix64 {
            let length = self.saleLength

            let startTime = self.startTime

            let currentTime = getCurrentBlock().timestamp

            let remaining = Fix64(startTime + length) - Fix64(currentTime)

            return remaining
        }

        pub fun getPrice(): UFix64  {
            return self.price
        }

        pub fun isAuctionExpired(): Bool {
            let timeRemaining = self.timeRemaining()
            return timeRemaining < Fix64(0.0)
        }

        // This method should probably use preconditions more
        pub fun purchase(
            buyerTokens: @FungibleToken.Vault,
            buyerCollectionCap: Capability<&{ASMR.CollectionPublic}>,
            minterCap: Capability<&ASMR.NFTMinter>
        ) {
            pre {
                !self.completed : "The open edition has already settled"              
                self.startTime < getCurrentBlock().timestamp : "The open edition has not started yet"
                !self.cancelled : "Open edition was cancelled"
                !self.isAuctionExpired() : "The open edition time has finished"
                !self.cancelled : "The open edition was cancelled"     
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

            let minterRef = minterCap.borrow() ?? panic("Could not borrow minter reference")     

            let platformValutCap = self.platformVaultCap.borrow() ?? panic("Could not borrow platform vault reference")   

            platformValutCap.deposit(from: <- buyerTokens)

            self.numberOfMintedNFT = self.numberOfMintedNFT + UInt64(1)

            self.metadata.edition = self.numberOfMintedNFT

            let newNFT <- minterRef.mintNFT(metadata: self.metadata, editionNumber: self.editionNumber)

            let buyerNFTCollection = buyerCollectionCap.borrow() ?? panic("Could not borrow platform vault reference") 

            let tokenID = newNFT.id  
    
            buyerNFTCollection.deposit(token: <- newNFT)           

            emit Purchase(PackSaleId: self.PackSaleID, buyerAddress: buyerCollectionCap.borrow()!.owner!.address, price: self.price, tokenID: tokenID, edition: self.numberOfMintedNFT)
        }

        pub fun getAuctionStatus() : PackSaleStatus {       

            return PackSaleStatus(
                id: self.PackSaleID,
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
    pub resource interface PackSalePublic {

        pub fun createPackSale(
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64, 
            royalty: { Address: UFix64 },    
            platformVaultCap: Capability<&{FungibleToken.Receiver}>  
        ) 

        pub fun getPackSaleStatuses(): {UInt64: PackSaleStatus}
        pub fun getPackSaleStatus(_ id : UInt64):  PackSaleStatus
        pub fun getTimeLeft(_ id: UInt64): Fix64
        pub fun getPrice(_ id:UInt64): UFix64 
        pub fun cancelPackSale(_ id: UInt64)

        pub fun purchase(
            id: UInt64, 
            buyerTokens: @FungibleToken.Vault,      
            collectionCap: Capability<&{ASMR.CollectionPublic}>       
        )
    }

    // AuctionCollection contains a dictionary of AuctionItems and provides
    // methods for manipulating the AuctionItems
    pub resource PackSaleCollection: PackSalePublic {
        // Auction Items
        access(account) var PackSalesItems: @{UInt64: PackSaleItem}     

        access(contract) let minterCap: Capability<&ASMR.NFTMinter>

        init(minterCap: Capability<&ASMR.NFTMinter>) {
            self.PackSalesItems <- {} 
            self.minterCap = minterCap
        }

        pub fun keys() : [UInt64] {
            return self.PackSalesItems.keys
        }

        // addTokenToauctionItems adds an NFT to the auction items and sets the meta data
        // for the auction item
        pub fun createPackSale(        
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64, 
            royalty: { Address: UFix64 },    
            platformVaultCap: Capability<&{FungibleToken.Receiver}>  
        ) {

            pre {              
                saleLength > 0.00 : "Sale lenght should be more then 0.00"
                startTime > getCurrentBlock().timestamp : "Start time can't be in the past"
                price > 0.00 : "Price should be more then 0.00"
            }            
        
            let item <- create PackSaleItem(
                price: price,
                startTime: startTime,
                saleLength: saleLength, 
                royalty: royalty,    
                platformVaultCap: platformVaultCap
            )

            let id = item.PackSaleID

            // update the auction items dictionary with the new resources
            let oldItem <- self.PackSalesItems[id] <- item
            
            destroy oldItem         

            emit Created(id: id, price: price, startTime: startTime)
        }

        // getAuctionPrices returns a dictionary of available NFT IDs with their current price
        pub fun getPackSaleStatuses(): {UInt64: PackSaleStatus} {
            pre {
                self.PackSalesItems.keys.length > 0: "There are no open edition items"
            }

            let priceList: {UInt64: PackSaleStatus} = {}

            for id in self.PackSalesItems.keys {
                let itemRef = &self.PackSalesItems[id] as? &PackSaleItem
                priceList[id] = itemRef.getAuctionStatus()
            }
            
            return priceList
        }

        pub fun getPackSaleStatus(_ id:UInt64): PackSaleStatus {
            pre {
                self.PackSalesItems[id] != nil:
                    "Open Edition doesn't exist"
            }

            // Get the auction item resources
            let itemRef = &self.PackSalesItems[id] as &PackSaleItem
            return itemRef.getAuctionStatus()
        }

        pub fun getPrice(_ id:UInt64): UFix64  {
            pre {
                self.PackSalesItems[id] != nil:
                    "Open Edition doesn't exist"
            }

            // Get the open edition item resources
            let itemRef = &self.PackSalesItems[id] as &PackSaleItem
            return itemRef.getPrice()
        }

        pub fun getTimeLeft(_ id: UInt64): Fix64 {
            pre {
                self.PackSalesItems[id] != nil:
                    "Open Edition doesn't exist"
            }

            // Get the auction item resources
            let itemRef = &self.PackSalesItems[id] as &PackSaleItem
            return itemRef.timeRemaining()
        }

        // settleAuction sends the auction item to the highest bidder
        // and deposits the FungibleTokens into the auction owner's account
        pub fun settlePackSale(id: UInt64, clientRoyalty: &Royalty.RoyaltyCollection) {
            let itemRef = &self.PackSalesItems[id] as &PackSaleItem
            itemRef.settlePackSale(clientRoyalty: clientRoyalty)
        }

        pub fun cancelPackSale(_ id: UInt64) {
            pre {
                self.PackSalesItems[id] != nil:
                    "Open Edition does not exist"
            }
            let itemRef = &self.PackSalesItems[id] as &PackSaleItem     
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
                self.PackSalesItems[id] != nil:
                    "Open Edition does not exist"
            }
            // Get the auction item resources
            let itemRef = &self.PackSalesItems[id] as &PackSaleItem
            itemRef.purchase(
                buyerTokens: <- buyerTokens,
                buyerCollectionCap: collectionCap,
                minterCap: self.minterCap
            )
        }

        destroy() {
            log("destroy open edition collection")
            // destroy the empty resources
            destroy self.PackSalesItems
        }
    }

    // createAuctionCollection returns a PackSaleCollection resource to the caller
    pub fun createPackSaleCollection(minterCap: Capability<&ASMR.NFTMinter>): @PackSaleCollection {
        let PackSaleCollection <- create PackSaleCollection(minterCap: minterCap)

        emit PackSaleCollectionCreated()
        return <- PackSaleCollection
    }

    init() {
        self.totalPackSales = (0 as UInt64)
    }   
}