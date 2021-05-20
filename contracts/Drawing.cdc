import FungibleToken from "./FungibleToken.cdc"
import FlowToken from "./FlowToken.cdc"
import ASMR from "./ASMR.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"
import Royalty from "./Royalty.cdc"

pub contract Drawing {

    priv resource BidStorage {
        // This is block bid value from user
        priv let bidVault: @FungibleToken.Vault

        // User's NFT storage
        priv let collectionCap: Capability<&{ASMR.CollectionPublic}>
        
        // User's Flow vault
        priv let vaultCap: Capability<&{FungibleToken.Receiver}>
        
        init(
           bidTokens: @FungibleToken.Vault,
           collectionCap: Capability<&{ASMR.CollectionPublic}>,
           vaultCap: Capability<&{FungibleToken.Receiver}>
        ) {
            self.bidVault <- FlowToken.createEmptyVault()
            self.bidVault.deposit(from: <-bidTokens)         
            self.collectionCap = collectionCap
            self.vaultCap = vaultCap
        }      
    }

    pub struct DrawingStatus{
        pub let id: UInt64
        pub let price : UFix64    
        pub let bids : UInt64
        pub let active: Bool
        pub let timeRemaining : Fix64
        pub let endTime : Fix64
        pub let startTime : Fix64
        pub let metadata: ASMR.Metadata?
        pub let ASMRId: UInt64?     
        pub let completed: Bool
        pub let expired: Bool
        pub let cancelled: Bool       
     
        init(
            id:UInt64, 
            currentPrice: UFix64, 
            bids:UInt64, 
            active: Bool, 
            timeRemaining:Fix64, 
            metadata: ASMR.Metadata?,
            ASMRId: UInt64?,            
            startTime: Fix64,
            endTime: Fix64,   
            completed: Bool,
            expired:Bool, 
            cancelled: Bool     
        ) {
            self.id = id
            self.price = currentPrice
            self.bids = bids
            self.active = active
            self.timeRemaining = timeRemaining
            self.metadata = metadata
            self.ASMRId = ASMRId        
            self.startTime = startTime
            self.endTime = endTime    
            self.completed = completed
            self.expired = expired
            self.cancelled = cancelled     
        }
    }

    // The total amount of DrawingSales that have been created
    pub var totalDrawings: UInt64

    // Events
    pub event CollectionCreated(owner: Address)
    pub event Created(tokenID: UInt64, owner: Address, startPrice: UFix64, startTime: UFix64)
    pub event Bid(id: UInt64, bidderAddress: Address)
    pub event Settled(tokenID: UInt64, price: UFix64)
    pub event Canceled(tokenID: UInt64)
    pub event MarketplaceEarned(amount:UFix64, owner: Address)  
    pub event TimeRemain(amount:UFix64, owner: Address) 
    pub event Extend(DrawingLengthFrom: UFix64, DrawingLengthTo: UFix64) 

    // DrawingItem contains the Resources and metadata for a single Drawing
    pub resource DrawingItem {
        
        // Number of bids made, that is aggregated to the status struct
        priv var numberOfBids: UInt64
       
        // Bid storage. Save flow tokens, capability to NFT's storage, capability to user's flow vault after bid
        access(account) var BidStorages: @{ Address: BidStorage }    

        // The id of this individual Drawing
        pub let drawingID: UInt64
      
        // The time the drawing should start at
        priv var drawingStartTime: UFix64

        // The length in seconds for this Drawing
        priv var drawingLength: UFix64

        // Status will be changed if drawing is settled
        priv var drawingCompleted: Bool

        // Price of NFT 
        priv var price: UFix64

        // the capability for the platform of the NFT to return the item to if the Drawing is cancelled
        priv let platformCollectionCap: Capability<&{ASMR.CollectionPublic}>

        // the capability to pay the platform when the Drawing is done
        priv let platformVaultCap: Capability<&{FungibleToken.Receiver}>

        // cancel drawing 
        priv var drawingCancelled: Bool

        // address, where contract was deployed
        priv let contractsAccountAddress: Address

        init(   
            price: UFix64,         
            drawingStartTime: UFix64,          
            drawingLength: UFix64,       
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,            
            platformCollectionCap: Capability<&{ASMR.CollectionPublic}>           
        ) {
            Drawing.totalDrawings = Drawing.totalDrawings + (1 as UInt64)            
            self.drawingID = drawing.totalDrawings         
            self.drawingLength = drawingLength
            self.price = price
            self.drawingStartTime = drawingStartTime
            self.drawingCompleted = false   
            self.platformVaultCap = platformVaultCap
            self.numberOfBids = 0
            self.platformCollectionCap = platformCollectionCap
            self.drawingCancelled = false
            self.contractsAccountAddress = 0xf8d6e0586b0a20c7
            self.BidStorages <- {}
        }

        // sendNFT sends the NFT to the Collection belonging to the provided Capability
        access(contract) fun sendNFT(_ capability: Capability<&{ASMR.CollectionPublic}>) {
            if let collectionRef = capability.borrow() {
                let NFT <- self.NFT <- nil
                collectionRef.deposit(token: <-NFT!)
                return
            } 

            if let platformCollection = self.platformCollectionCap.borrow() {
                let NFT <- self.NFT <- nil
                platformCollection.deposit(token: <-NFT!)
                return 
            } 
        }
        
        // sendBidTokens sends the bid tokens to the Vault Receiver belonging to the provided Capability
        access(contract) fun sendBidTokens(_ capability: Capability<&{FungibleToken.Receiver}>) {
            // borrow a reference to the owner's NFT receiver
            if let vaultRef = capability.borrow() {
                let bidVaultRef = &self.bidVault as &FungibleToken.Vault

                if(bidVaultRef.balance > 0.0) {
                    vaultRef.deposit(from: <- bidVaultRef.withdraw(amount: bidVaultRef.balance))
                }
                return
            }

            if let ownerRef = self.platformVaultCap.borrow() {
                let bidVaultRef = &self.bidVault as &FungibleToken.Vault
                if(bidVaultRef.balance > 0.0) {
                    ownerRef.deposit(from: <-bidVaultRef.withdraw(amount: bidVaultRef.balance))
                }
                return
            }
        }

        pub fun getEditionNumber(id: UInt64): UInt64? {             
            return self.NFT?.editionNumber
        }

        //This method should probably use preconditions more 
        pub fun settleDrawing()  {

            pre {
                !self.DrawingCompleted : "The Drawing is already settled"
                self.NFT != nil: "NFT in Drawing does not exist"
                self.isDrawingExpired() : "Drawing has not completed yet"
            }

            // return if there are no bids to settle
            if self.currentPrice == 0.0 {
                self.returnDrawingItemToOwner()
                return
            }       
            
            emit Settled(tokenID: self.DrawingID, price: self.currentPrice)
        }

        //this can be negative if is expired
        pub fun timeRemaining() : Fix64 {
            let DrawingLength = self.DrawingLength

            let startTime = self.DrawingStartTime

            let currentTime = getCurrentBlock().timestamp

            let remaining = Fix64(startTime + DrawingLength) - Fix64(currentTime)

            return remaining
        }

        pub fun isDrawingExpired(): Bool {
            let timeRemaining = self.timeRemaining()
            return timeRemaining < Fix64(0.0)
        }

        pub fun addBid(newBidStorage: @BidStorage, address: Address) {         
            // add the new token to the dictionary which removes the old one
            let oldBid <- self.BidStorages[address] <- newBidStorage
         
            destroy oldBid
        }

        // This method should probably use preconditions more
        pub fun placeBid(
            bidTokens: @FungibleToken.Vault,
            vaultCap: Capability<&{FungibleToken.Receiver}>,
            collectionCap: Capability<&{ASMR.CollectionPublic}>
        ) {

            pre {               
                bidTokens.balance < price: "Bid is less than price"
                !self.DrawingCompleted : "The Drawing is already settled"
                self.NFT != nil: "NFT in Drawing does not exist"
                self.DrawingStartTime < getCurrentBlock().timestamp : "The Drawing has not started yet"
                !self.DrawingCancelled : "Drawing was cancelled"
            }

            let bidderAddress = vaultCap.borrow()!.owner!.address
            let collectionAddress = collectionCap.borrow()!.owner!.address
            
            if bidderAddress != collectionAddress {
                panic("you cannot make a bid and send the ASMR to somebody else collection")
            }

            if !BidStorages.containsKey(bidderAddress) {
                panic("you can make only one bid from one account")
            }

            let newBidStorage <- create BidStorage(
                bidTokens: <- bidTokens,
                collectionCap: collectionCap,
                vaultCap: vaultCap
            )     

            self.addBid(newBidStorage: <- newBidStorage, address: bidderAddress)
      
            self.numberOfBids = self.numberOfBids+(1 as UInt64)

            emit Bid(id: self.drawingID, bidderAddress: bidderAddress)
        }

        pub fun getDrawingStatus() : DrawingStatus {

            var leader : Address? = nil
            if let recipient = self.recipientVaultCap {
                leader = recipient.borrow()!.owner!.address
            }

            return DrawingStatus(
                id: self.DrawingID,
                price: self.price, 
                bids: self.numberOfBids,
                active: !self.DrawingCompleted && !self.isDrawingExpired(),
                timeRemaining: self.timeRemaining(),
                metadata: self.NFT?.metadata,
                ASMRId: self.NFT?.id,
                leader: leader,                      
                startTime: Fix64(self.DrawingStartTime),
                endTime: Fix64(self.DrawingStartTime+self.DrawingLength),
                completed: self.DrawingCompleted,
                expired: self.isDrawingExpired(),
                cancelled: self.DrawingCancelled  
            )
        }

        pub fun cancelDrawing() {
            self.DrawingCancelled = true
        }

        destroy() {
            log("destroy Drawing")
                       
            // if there's a bidder...
            if let vaultCap = self.recipientVaultCap {
                // ...send the bid tokens back to the bidder
                self.sendBidTokens(vaultCap)
            }

            destroy self.NFT
            destroy self.bidVault
        }
    }    

    // DrawingPublic is a resource interface that restricts users to
    // retreiving the Drawing price list and placing bids
    pub resource interface DrawingPublic {

        pub fun createDrawing(   
            price: UFix64,         
            drawingStartTime: UFix64,          
            drawingLength: UFix64,       
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,            
            platformCollectionCap: Capability<&{ASMR.CollectionPublic}>    
        ) 

        pub fun getDrawingStatuses(): {UInt64: DrawingStatus}
        pub fun getDrawingStatus(_ id:UInt64): DrawingStatus
        pub fun getTimeLeft(_ id: UInt64): Fix64
        pub fun cancelDrawing(_ id: UInt64)

        pub fun placeBid(
            id: UInt64, 
            bidTokens: @FungibleToken.Vault, 
            vaultCap: Capability<&{FungibleToken.Receiver}>, 
            collectionCap: Capability<&{ASMR.CollectionPublic}>
        )
    }

    // DrawingCollection contains a dictionary of DrawingItems and provides
    // methods for manipulating the DrawingItems
    pub resource DrawingCollection: DrawingPublic {

        // Drawing Items
        access(account) var DrawingItems: @{UInt64: DrawingItem}             
     
        access(contract) let marketplaceVault: Capability<&{FungibleToken.Receiver}>

        init(
            marketplaceVault: Capability<&{FungibleToken.Receiver}>            
        ) {
            self.marketplaceVault = marketplaceVault
            self.DrawingItems <- {}
        }

        pub fun keys() : [UInt64] {
            return self.DrawingItems.keys
        }

        // addTokenToDrawingItems adds an NFT to the Drawing items and sets the meta data
        // for the Drawing item
        pub fun createDrawing(       
            price: UFix64,         
            drawingStartTime: UFix64,          
            drawingLength: UFix64,       
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,            
            platformCollectionCap: Capability<&{ASMR.CollectionPublic}>    
        ) {

            pre {              
                drawingLength > 0.00 : "Drawing lenght should be more then 0.00"
                drawingStartTime > getCurrentBlock().timestamp : "Drawing start time can't be in the past"
                price > 0.00 : "Start price should be more then 0.00"
            }
            
            // create a new Drawing items resource container
            let item <- <- create DrawingItem(         
                price: price,         
                drawingStartTime: drawingStartTime,          
                drawingLength: drawingLength,       
                platformVaultCap: platformVaultCap,            
                platformCollectionCap: platformCollectionCap       
            )

            let id = item.DrawingID

            // update the Drawing items dictionary with the new resources
            let oldItem <- self.DrawingItems[id] <- item
            
            destroy oldItem

            let owner = platformVaultCap.borrow()!.owner!.address

            emit Created(tokenID: id, owner: owner, startPrice: startPrice, startTime: DrawingStartTime)
        }

        // getDrawingPrices returns a dictionary of available NFT IDs with their current price
        pub fun getDrawingStatuses(): {UInt64: DrawingStatus} {
            pre {
                self.DrawingItems.keys.length > 0: "There are no Drawing items"
            }

            let priceList: {UInt64: DrawingStatus} = {}

            for id in self.DrawingItems.keys {
                let itemRef = &self.DrawingItems[id] as? &DrawingItem
                priceList[id] = itemRef.getDrawingStatus()
            }
            
            return priceList
        }

        pub fun getDrawingStatus(_ id:UInt64): DrawingStatus {
            pre {
                self.DrawingItems[id] != nil:
                    "NFT doesn't exist"
            }

            // Get the Drawing item resources
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            return itemRef.getDrawingStatus()
        }

        pub fun getTimeLeft(_ id: UInt64): Fix64 {
            pre {
                self.DrawingItems[id] != nil:
                    "Drawing doesn't exist"
            }

            // Get the Drawing item resources
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            return itemRef.timeRemaining()
        }

        // settleDrawing sends the Drawing item to the highest bidder
        // and deposits the FungibleTokens into the Drawing owner's account
        pub fun settleDrawing(_ id: UInt64) {
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            itemRef.settleDrawing()
        }

        pub fun cancelDrawing(_ id: UInt64) {
            pre {
                self.DrawingItems[id] != nil:
                    "Drawing does not exist"
            }
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            itemRef.returnDrawingItemToOwner()
            itemRef.cancelDrawing()
            emit Canceled(tokenID: id)
        }

        // placeBid sends the bidder's tokens to the bid vault and updates the
        // currentPrice of the current Drawing item
        pub fun placeBid(
            id: UInt64,
            bidTokens: @FungibleToken.Vault,
            vaultCap: Capability<&{FungibleToken.Receiver}>, 
            collectionCap: Capability<&{ASMR.CollectionPublic}>
        ) {
            pre {
                self.DrawingItems[id] != nil:
                    "Drawing does not exist in this drop"
            }

            // Get the Drawing item resources
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            itemRef.placeBid(
                bidTokens: <- bidTokens, 
                vaultCap : vaultCap, 
                collectionCap:collectionCap
            )
        }

        pub fun addNFT(id: UInt64, NFT: @ASMR.NFT) {
            pre {
                self.DrawingItems[id] != nil:
                    "Drawing does not exist"
            }
            let itemRef = &self.DrawingItems[id] as &DrawingItem

            itemRef.addNFT(NFT: <- NFT)
        }

        destroy() {
            log("destroy Drawing collection")
            // destroy the empty resources
            destroy self.DrawingItems
        }
    }

    // createDrawingCollection returns a new DrawingCollection resource to the caller
    pub fun createDrawingCollection(marketplaceVault: Capability<&{FungibleToken.Receiver}>): @DrawingCollection {
        let DrawingCollection <- create DrawingCollection(
            marketplaceVault: marketplaceVault        
        )

        emit CollectionCreated(owner: marketplaceVault.borrow()!.owner!.address)
        return <- DrawingCollection
    }

    init() {
        self.totalDrawings = (0 as UInt64)
    }   
}