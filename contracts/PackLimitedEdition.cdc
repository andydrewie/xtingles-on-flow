import FungibleToken from "./FungibleToken.cdc"
import FlowToken from "./FlowToken.cdc"
import Pack from "./Pack.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"
import Edition from "./Edition.cdc"
import FUSD from "./FUSD.cdc"

pub contract PackLimitedEdition {

    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath

    pub struct LimitedEditionStatus{
        pub let id: UInt64
        pub let price : UFix64
        pub let active: Bool
        pub let timeRemaining : Fix64
        pub let endTime : Fix64
        pub let startTime : Fix64
        pub let completed: Bool
        pub let expired: Bool
        pub let cancelled: Bool
        pub let numberOfMinted: UInt64
     
        init(
            id:UInt64, 
            price: UFix64,            
            active: Bool, 
            timeRemaining:Fix64,   
            startTime: Fix64,
            endTime: Fix64,
            completed: Bool,
            expired:Bool, 
            cancelled: Bool,
            numberOfMinted: UInt64, 
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
            self.numberOfMinted = numberOfMinted
        }
    }

    // The total amount of limitedEditions that have been created
    pub var totalLimitedEditions: UInt64

    // Events
    pub event LimitedEditionCollectionCreated()
    pub event Created(id: UInt64, price: UFix64, startTime: UFix64, numberOfMaxPack: UInt64)
    pub event Purchase(limitedEditionID: UInt64, buyer: Address, price: UFix64, NFTid: UInt64, edition: UInt64, purchaseTime: UFix64)
    pub event Earned(nftID: UInt64, amount: UFix64, owner: Address, type: String)
    pub event FailEarned(nftID: UInt64, amount: UFix64, owner: Address, type: String)
    pub event Settled(id: UInt64, price: UFix64, amountMintedPack: UInt64)
    pub event Canceled(id: UInt64, amountMintedPack: UInt64)

    // LimitedEditionItem contains the Resources and metadata for a single sale
    pub resource LimitedEditionItem {
        
        // Number of purchased packs
        priv var numberOfMintedPack: UInt64

        // The id of this individual Limited Edition
        pub let limitedEditionID: UInt64

        // The current price
        pub let price: UFix64

        // The time the Limited Edition should start at
        priv var startTime: UFix64

        // The length in seconds for this Limited Edition
        priv var saleLength: UFix64

        // After settle Limited Edition
        priv var completed: Bool

        // Set if an Limited Edition will be cancelled
        priv var cancelled: Bool

        // Common number for all copies one item
        priv let editionNumber: UInt64  

        //The vault receive FUSD in case of the recipient of commissiona is unreachable 
        priv let platformVaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>   

        // Number of max purchased NFTs
        priv var numberOfMaxPack: UInt64

        init(
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64, 
            editionNumber: UInt64,
            platformVaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>,
            numberOfMaxPack: UInt64
        ) {
            PackLimitedEdition.totalLimitedEditions = PackLimitedEdition.totalLimitedEditions + (1 as UInt64)
            self.price = price
            self.startTime = startTime
            self.saleLength = saleLength
            self.editionNumber = editionNumber
            self.numberOfMintedPack = 0
            self.limitedEditionID = PackLimitedEdition.totalLimitedEditions
            self.completed = false
            self.cancelled = false
            self.platformVaultCap = platformVaultCap
            self.numberOfMaxPack = numberOfMaxPack
        }        

        pub fun settleLimitedEdition()  {

            pre {
                !self.cancelled : "The limited edition was cancelled"
                !self.completed : "The limited edition has already settled"            
                self.isExpired() : "The limited edition time has not expired yet"
            }
         
            self.completed = true 
                     
            emit Settled(id: self.limitedEditionID, price: self.price, amountMintedPack: self.numberOfMintedPack)
        }
  
        //this can be negative if is expired
        priv fun timeRemaining() : Fix64 {
            let length = self.saleLength

            if (length == 0.0) {
                return 0.0
            }

            let startTime = self.startTime

            let currentTime = getCurrentBlock().timestamp

            let remaining = Fix64(startTime + length) - Fix64(currentTime)

            return remaining
        }

        pub fun getPrice(): UFix64  {
            return self.price
        }

        priv fun isExpired(): Bool {
            let timeRemaining = self.timeRemaining()
            return timeRemaining < Fix64(0.0)
        }

        priv fun sendCommissionPayments(buyerTokens: @FUSD.Vault, tokenID: UInt64) {
            // Capability to resource with commission information
            let editionRef = PackLimitedEdition.account.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath).borrow()! 
        
            // Commission informaton for all copies of on item
            let editionStatus = editionRef.getEdition(self.editionNumber)!

            // Vault for platform account
            let platformVault = self.platformVaultCap.borrow()!

            for key in editionStatus.royalty.keys {
                // Commission is paid all recepient except platform
                if (editionStatus.royalty[key]!.firstSalePercent > 0.0 && key != platformVault.owner!.address) {
                    let commission = self.price * editionStatus.royalty[key]!.firstSalePercent * 0.01

                    let account = getAccount(key) 

                    let vaultCap = account.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)   

                    // vaultCap was checked during creation of commission info on Edition contract, therefore this is extra check
                    // if vault capability is not avaliable, the rest tokens will sent to platform vault                     
                    if (vaultCap.check()) {
                        let vault = vaultCap.borrow()!
                        vault.deposit(from: <- buyerTokens.withdraw(amount: commission))
                        emit Earned(nftID: tokenID, amount: commission, owner: key, type: editionStatus.royalty[key]!.description)
                    } else {
                        emit FailEarned(nftID: tokenID, amount: commission, owner: key, type: editionStatus.royalty[key]!.description)
                    }            
                }                
            }

            // Platform get the rest of Fungible tokens and tokens from failed transactions
            let amount = buyerTokens.balance        

            platformVault.deposit(from: <- (buyerTokens as! @FungibleToken.Vault))

            emit Earned(nftID: tokenID, amount: amount, owner: platformVault.owner!.address, type: "PLATFORM")  
        }
   
        pub fun purchase(
            buyerTokens: @FUSD.Vault,
            buyerCollectionCap: Capability<&{Pack.CollectionPublic}>,
            minterCap: Capability<&Pack.PackMinter>
        ) {
            pre {              
                self.startTime < getCurrentBlock().timestamp : "The limited edition has not started yet"
                !self.isExpired() : "The limited edition time expired"     
                !self.cancelled : "The limited edition was cancelled"
                buyerTokens.balance == self.price: "Not exact amount tokens to buy the pack"       
                self.numberOfMintedPack < self.numberOfMaxPack: "Number of minted packs have reached max value"              
            }

            // Get minter reference to create NFT
            let minterRef = minterCap.borrow()!    
            
            // Change amount of copies in this edition
            self.numberOfMintedPack = self.numberOfMintedPack + UInt64(1)
                
            // Mint pack
            let pack <- minterRef.mintPack(editionNumber: self.editionNumber)
            
            // Pack number
            let packId = pack.id  

            // Get buyer's NFT Collection reference
            let buyerNFTCollection = buyerCollectionCap.borrow()!

            // Sent NFT to buyer    
            buyerNFTCollection.deposit(token: <- pack)  

            // Pay commission to recipients
            self.sendCommissionPayments(
                buyerTokens: <- buyerTokens,
                tokenID: packId
            )     

            // Set end of purchases, when amount of purchased packs attained max value
            if (self.numberOfMaxPack == self.numberOfMintedPack)  {
                self.saleLength = getCurrentBlock().timestamp - self.startTime;
            }

            // Purchase event
            emit Purchase(limitedEditionID: self.limitedEditionID, buyer: buyerCollectionCap.borrow()!.owner!.address, price: self.price, NFTid: packId, edition: self.numberOfMintedPack, purchaseTime: getCurrentBlock().timestamp)
        }

        pub fun getLimitedEditionStatus() : LimitedEditionStatus {         

            return LimitedEditionStatus(
                id: self.limitedEditionID,
                price: self.price,             
                active: !self.completed && !self.isExpired(),
                timeRemaining: self.timeRemaining(),           
                startTime: Fix64(self.startTime),
                endTime: Fix64(self.startTime + self.saleLength),            
                completed: self.completed,
                expired: self.isExpired(),
                cancelled: self.cancelled,
                numberOfMinted: self.numberOfMintedPack   
            )
        }

        pub fun cancelLimitedEdition() {
            pre {
               !self.completed : "The limited edition has already settled"              
               !self.cancelled : "The limited edition has been cancelled earlier" 
            }

            self.cancelled = true

            emit Canceled(id: self.limitedEditionID, amountMintedPack: self.numberOfMintedPack)
        }

        destroy() {
            log("destroy limited editions")          
        }
    }   

    // LimitedEditionPublic is a resource interface that restricts users to
    // retreiving the auction price list and placing bids
    pub resource interface LimitedEditionCollectionPublic {

        pub fun getLimitedEditionStatuses(): {UInt64: LimitedEditionStatus}?
        pub fun getLimitedEditionStatus(_ id : UInt64):  LimitedEditionStatus?
        pub fun getPrice(_ id:UInt64): UFix64? 

        pub fun purchase(
            id: UInt64, 
            buyerTokens: @FUSD.Vault,      
            collectionCap: Capability<&{Pack.CollectionPublic}>       
        )
    }

    // LimitedEditionCollection contains a dictionary of LimitedEditionItems and provides
    // methods for manipulating the LimitedEditionItems
    pub resource LimitedEditionCollection: LimitedEditionCollectionPublic {
        // LimitedEdition Items
        access(account) var LimitedEditionsItems: @{UInt64: LimitedEditionItem}     

        access(contract) let minterCap: Capability<&Pack.PackMinter>

        init(minterCap: Capability<&Pack.PackMinter>) {
            self.LimitedEditionsItems <- {} 
            self.minterCap = minterCap
        }

        pub fun keys() : [UInt64] {
            return self.LimitedEditionsItems.keys
        }

        // create limited edition purchase
        pub fun createLimitedEdition(        
            price: UFix64,
            startTime: UFix64,
            saleLength: UFix64, 
            editionNumber: UInt64,
            platformVaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>, 
            numberOfMaxPack: UInt64
        ) {
            pre {              
                startTime > getCurrentBlock().timestamp : "Start time can't be in the past"
                price > 0.00 : "Price should be more than 0.00"
                price <= 999999.99 : "Price should be less than 1 000 000.00"
                platformVaultCap.check() : "Platform vault should be reachable"
                numberOfMaxPack > (0 as UInt64) : "Max amount of packs should be more than 0"
            }     

            let editionRef = PackLimitedEdition.account.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath).borrow()! 

            // Check edition info in contract Edition in order to manage commission and all amount of copies of the same item
            // This error throws inside Edition contract. But I put this check for redundant
            if editionRef.getEdition(editionNumber) == nil {
                panic("Edition doesn't exist")
            }
        
            let item <- create LimitedEditionItem(
                price: price,
                startTime: startTime,
                saleLength: saleLength, 
                editionNumber: editionNumber,
                platformVaultCap: platformVaultCap,
                numberOfMaxPack: numberOfMaxPack
            )

            let id = item.limitedEditionID

            // update the auction items dictionary with the new resources
            let oldItem <- self.LimitedEditionsItems[id] <- item
            
            destroy oldItem         

            emit Created(id: id, price: price, startTime: startTime, numberOfMaxPack: numberOfMaxPack)
        }

        // getLimitedEditionPrices returns a dictionary of available NFT IDs with their current price
        pub fun getLimitedEditionStatuses(): {UInt64: LimitedEditionStatus}? {

            if self.LimitedEditionsItems.keys.length == 0 {
                return nil
            }

            let priceList: {UInt64: LimitedEditionStatus} = {}

            for id in self.LimitedEditionsItems.keys {
                let itemRef = &self.LimitedEditionsItems[id] as? &LimitedEditionItem
                priceList[id] = itemRef.getLimitedEditionStatus()
            }
            
            return priceList
        }

        pub fun getLimitedEditionStatus(_ id:UInt64): LimitedEditionStatus? {
            if self.LimitedEditionsItems[id] == nil { 
                return nil
            }

            // Get the auction item resources
            let itemRef = &self.LimitedEditionsItems[id] as &LimitedEditionItem
            return itemRef.getLimitedEditionStatus()
        }

        pub fun getPrice(_ id:UInt64): UFix64?  {
            if self.LimitedEditionsItems[id] == nil { 
                return nil
            }

            // Get the Limited Edition item resources
            let itemRef = &self.LimitedEditionsItems[id] as &LimitedEditionItem
            return itemRef.getPrice()
        }

        // settleLimitedEdition sends the auction item to the highest bidder
        // and deposits the FungibleTokens into the auction owner's account
        pub fun settleLimitedEdition(id: UInt64) {
            pre {
                self.LimitedEditionsItems[id] != nil:
                    "Limited Edition does not exist"
            }
            
            let itemRef = &self.LimitedEditionsItems[id] as &LimitedEditionItem
            itemRef.settleLimitedEdition()
        }

        pub fun cancelLimitedEdition(id: UInt64) {
            pre {
                self.LimitedEditionsItems[id] != nil:
                    "Limited Edition does not exist"
            }
            let itemRef = &self.LimitedEditionsItems[id] as &LimitedEditionItem     
            itemRef.cancelLimitedEdition()
        }

        // purchase sends the buyer's tokens to the buyer's tokens vault      
        pub fun purchase(
            id: UInt64, 
            buyerTokens: @FUSD.Vault,      
            collectionCap: Capability<&{Pack.CollectionPublic}>       
        ) {
            pre {
                self.LimitedEditionsItems[id] != nil: "Limited Edition does not exist"
                collectionCap.check(): "Pack storage does not exist on the account"
            }          

            // Get the auction item resources
            let itemRef = &self.LimitedEditionsItems[id] as &LimitedEditionItem
            
            itemRef.purchase(
                buyerTokens: <- buyerTokens,
                buyerCollectionCap: collectionCap,
                minterCap: self.minterCap
            )
        }

        destroy() {
            log("destroy limited edition collection")
            // destroy the empty resources
            destroy self.LimitedEditionsItems
        }
    }

    // createLimitedEditionCollection returns a LimitedEditionCollection resource
    priv fun createLimitedEditionCollection(minterCap: Capability<&Pack.PackMinter>): @LimitedEditionCollection {
        let LimitedEditionCollection <- create LimitedEditionCollection(minterCap: minterCap)

        emit LimitedEditionCollectionCreated()
        return <- LimitedEditionCollection
    }

    init() {
        self.totalLimitedEditions = (10 as UInt64)
        self.CollectionPublicPath = /public/NFTbloctoXtinglesPackLimitedEdition
        self.CollectionStoragePath = /storage/NFTbloctoXtinglesPackLimitedEdition

        let minterCap = self.account.getCapability<&Pack.PackMinter>(Pack.MinterPrivatePath)!    
        let LimitedEdition <- PackLimitedEdition.createLimitedEditionCollection(minterCap: minterCap)        
        self.account.save(<-LimitedEdition, to: PackLimitedEdition.CollectionStoragePath)         
        self.account.link<&{PackLimitedEdition.LimitedEditionCollectionPublic}>(PackLimitedEdition.CollectionPublicPath, target: PackLimitedEdition.CollectionStoragePath)
    }   
}
