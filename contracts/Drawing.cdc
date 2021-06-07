import FungibleToken from "./FungibleToken.cdc"
import FlowToken from "./FlowToken.cdc"
import ASMR from "./ASMR.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"
import Royalty from "./Royalty.cdc"

pub contract Drawing {

    pub resource BidStorage {
        // This is block bid value from user
        pub var bidVault: @FungibleToken.Vault

        // User's NFT storage
        pub let collectionCap: Capability<&{ASMR.CollectionPublic}>
        
        // User's Flow vault
        pub let vaultCap: Capability<&{FungibleToken.Receiver}>
        
        init(
           bidTokens: @FungibleToken.Vault,
           collectionCap: Capability<&{ASMR.CollectionPublic}>,
           vaultCap: Capability<&{FungibleToken.Receiver}>
        ) {
            self.bidVault <- FlowToken.createEmptyVault()
            self.bidVault.deposit(from: <- bidTokens)         
            self.collectionCap = collectionCap
            self.vaultCap = vaultCap
        } 

        pub fun withdrawBidsTokens(): @FungibleToken.Vault {
            var otherbidVault <- FlowToken.createEmptyVault()
            self.bidVault <-> otherbidVault
            return <- otherbidVault
        }

        pub fun borrowNFT(): &BidStorage {
            return &self as &BidStorage
        }

       
        destroy() {
            log("destroy BidStorage")
            destroy self.bidVault
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
        pub let completed: Bool
        pub let expired: Bool
        pub let cancelled: Bool       
     
        init(
            id:UInt64, 
            price: UFix64, 
            bids:UInt64, 
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
            self.bids = bids
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

    // The total amount of DrawingSales that have been created
    pub var totalDrawings: UInt64

    // Events
    pub event CollectionCreated()
    pub event Created(tokenID: UInt64, price: UFix64, startTime: UFix64)
    pub event Bid(id: UInt64, bidderAddress: Address)
    pub event Settled(tokenID: UInt64, price: UFix64)
    pub event Canceled(tokenID: UInt64)
    pub event TimeRemain(amount:UFix64, owner: Address)    
    pub event Refund(address: Address, amount: UFix64) 
    pub event Earned(amount:UFix64, owner: Address, description: String)

    // DrawingItem contains the Resources and metadata for a single Drawing
    pub resource DrawingItem {
        
        // Number of bids made, that is aggregated to the status struct
        priv var numberOfBids: UInt64
       
        // Bid storage. Save flow tokens, capability to NFT's storage, capability to user's flow vault after bid
        access(account) var BidStorages: @{ Address: BidStorage }    

        // The id of this individual Drawing
        pub let drawingID: UInt64
      
        // The time the drawing should start at
        priv var startTime: UFix64

        // The length in seconds for this Drawing
        priv var drawingLength: UFix64

        // Status will be changed if drawing is settled
        priv var drawingCompleted: Bool

        // Price of NFT 
        priv var price: UFix64

        // the capability to pay the platform when the Drawing is done
        priv let platformVaultCap: Capability<&{FungibleToken.Receiver}>

        // cancel drawing 
        priv var drawingCancelled: Bool

        // address, where contract was deployed
        priv let contractsAccountAddress: Address

        priv let metadata: ASMR.Metadata

        priv let editionNumber: UInt64

        init(   
            price: UFix64,         
            startTime: UFix64,          
            drawingLength: UFix64,       
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,
            metadata: ASMR.Metadata,
            editionNumber: UInt64           
        ) {
            Drawing.totalDrawings = Drawing.totalDrawings + (1 as UInt64)            
            self.drawingID = Drawing.totalDrawings         
            self.drawingLength = drawingLength
            self.price = price
            self.startTime = startTime
            self.drawingCompleted = false   
            self.platformVaultCap = platformVaultCap
            self.numberOfBids = 0      
            self.drawingCancelled = false
            self.contractsAccountAddress = 0xf8d6e0586b0a20c7
            self.BidStorages <- {}
            self.metadata = metadata
            self.editionNumber = editionNumber
        }

        // sendNFT sends the NFT to the Collection belonging to the provided Capability
        access(contract) fun sendNFT(capability: Capability<&{ASMR.CollectionPublic}>, bidTokens: @FungibleToken.Vault) {
            let collectionRef = capability.borrow() ?? panic("can't borrow collection ASMR reference") 

            collectionRef.deposit(token: <- ASMR.mint(metadata: self.metadata, editionNumber: self.editionNumber))
            
            let contractsAccountAddress = Address(0xf8d6e0586b0a20c7)

            let contractsAccount = getAccount(contractsAccountAddress)

            let royaltyRef = contractsAccount.getCapability<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection).borrow() 
                ?? panic("Could not borrow royalty reference")     

            let royaltyStatus = royaltyRef.getRoyalty(self.editionNumber)

            for key in royaltyStatus.royalty.keys {
                let commission = self.price * royaltyStatus.royalty[key]!.firstSalePercent * 0.01

                let account = getAccount(key) 

                let vaultCap = account.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver).borrow() ?? panic("Could not borrow vault reference")     

                vaultCap.deposit(from: <- bidTokens.withdraw(amount: commission))

                emit Earned(amount: commission, owner: vaultCap.owner!.address, description: royaltyStatus.royalty[key]!.description)
            }   

            let platformCap = self.platformVaultCap.borrow() ?? panic("Could not borrow vault reference")      

            platformCap.deposit(from: <- bidTokens)
        }

        pub fun borrowBidStorage(address: Address): &BidStorage {
            return &self.BidStorages[address] as &BidStorage
        }
        
        // sendBidTokens sends the bid tokens to the Vault Receiver belonging to the provided Capability
        access(contract) fun sendBidTokens(
            bidTokens: @FungibleToken.Vault,
            vaultCap: Capability<&{FungibleToken.Receiver}>
        ) {
            // borrow a reference to the owner's NFT receiver
            let vaultRef = vaultCap.borrow() ?? panic("can't borrow vaultCap reference")
            vaultRef.deposit(from: <- bidTokens) 
        }

        pub fun getEditionNumber(id: UInt64): UInt64? {             
            return self.editionNumber
        }

        //This method should probably use preconditions more 
        pub fun settleDrawing(lotterryWinners: [Address])  {

            pre {
                !self.drawingCompleted : "The Drawing is already settled"
                self.metadata != nil: "NFT can be minted, because metadata is omitted"
                self.isDrawingExpired() : "Drawing has not completed yet"
                !self.drawingCompleted : "The Drawing is already settled"
            }

            for address in self.BidStorages.keys {
                if(lotterryWinners.contains(address)) {
                    let bidStorage = self.borrowBidStorage(address: address)     
                    let balance = bidStorage.bidVault.balance       

                    self.sendNFT(
                        capability: bidStorage.collectionCap,
                        bidTokens: <- bidStorage.withdrawBidsTokens()                
                    )                    

                } else {
                    let bidStorage = self.borrowBidStorage(address: address)     
                    let balance = bidStorage.bidVault.balance       

                    self.sendBidTokens(
                        bidTokens: <- bidStorage.withdrawBidsTokens(),
                        vaultCap: bidStorage.vaultCap
                    )

                    emit Refund(address: address, amount: balance) 
                }
            }

            self.drawingCompleted = true
            
            emit Settled(tokenID: self.drawingID, price: self.price)
        }

        //this can be negative if is expired
        pub fun timeRemaining() : Fix64 {
            let DrawingLength = self.drawingLength

            let startTime = self.startTime

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
                bidTokens.balance == self.price: "Bid is not equal price"
                !self.drawingCompleted : "The Drawing is already settled"
                self.startTime < getCurrentBlock().timestamp : "The Drawing has not started yet"
                self.startTime + self.drawingLength > getCurrentBlock().timestamp : "The Drawing has already finished"
                !self.drawingCancelled : "Drawing was cancelled"
            }

            let bidderAddress = vaultCap.borrow()!.owner!.address
            let collectionAddress = collectionCap.borrow()!.owner!.address
            
            if bidderAddress != collectionAddress {
                panic("you cannot make a bid and send the ASMR to somebody else collection")
            }

            if self.BidStorages.containsKey(bidderAddress) {
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

            return DrawingStatus(
                id: self.drawingID, 
                price: self.price, 
                bids: self.numberOfBids, 
                active: !self.drawingCompleted && !self.isDrawingExpired(), 
                timeRemaining: self.timeRemaining(), 
                metadata: self.metadata,                 
                startTime: Fix64(self.startTime),
                endTime: Fix64(self.startTime + self.drawingLength),   
                completed: self.drawingCompleted,
                expired: self.isDrawingExpired(), 
                cancelled: self.drawingCancelled   
            )
        }

        pub fun cancelDrawing() {
            self.drawingCancelled = true
        }

        pub fun getPrice(): UFix64  {
            return self.price
        }


        pub fun getBidsAddresses() : [Address] {       

            return self.BidStorages.keys
        }

        destroy() {
            log("destroy Drawing")
                       
            destroy self.BidStorages        
        }
    }    

    // DrawingPublic is a resource interface that restricts users to
    // retreiving the Drawing price list and placing bids
    pub resource interface DrawingPublic {

        pub fun createDrawing(   
            price: UFix64,         
            startTime: UFix64,          
            drawingLength: UFix64,       
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,          
            metadata: ASMR.Metadata,
            editionNumber: UInt64      
        ) 

        pub fun getDrawingStatuses(): {UInt64: DrawingStatus}
        pub fun getDrawingStatus(_ id:UInt64): DrawingStatus
        pub fun getTimeLeft(_ id: UInt64): Fix64
        pub fun cancelDrawing(_ id: UInt64)
        pub fun getPrice(_ id:UInt64): UFix64 
        pub fun getBidsAddresses(_ id:UInt64) : [Address]

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
     
        init() {          
            self.DrawingItems <- {}
        }

        pub fun keys() : [UInt64] {
            return self.DrawingItems.keys
        }

        // addTokenToDrawingItems adds an NFT to the Drawing items and sets the meta data
        // for the Drawing item
        pub fun createDrawing(       
            price: UFix64,         
            startTime: UFix64,          
            drawingLength: UFix64,       
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,         
            metadata: ASMR.Metadata,
            editionNumber: UInt64    
        ) {

            pre {              
                drawingLength > 0.00 : "Drawing lenght should be more then 0.00"
                startTime > getCurrentBlock().timestamp : "Drawing start time can't be in the past"
                price > 0.00 : "Start price should be more then 0.00"
            }
            
            // create a new Drawing items resource container
            let item <- create DrawingItem(         
                price: price,         
                startTime: startTime,          
                drawingLength: drawingLength,       
                platformVaultCap: platformVaultCap,              
                metadata: metadata,
                editionNumber:  editionNumber
            )

            let id = item.drawingID

            // update the Drawing items dictionary with the new resources
            let oldItem <- self.DrawingItems[id] <- item
            
            destroy oldItem

            let owner = platformVaultCap.borrow()!.owner!.address

            emit Created(tokenID: id, price: price, startTime: startTime)
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
        pub fun settleDrawing(id: UInt64, lotterryWinners: [Address]) {
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            itemRef.settleDrawing(lotterryWinners: lotterryWinners)
        }

        pub fun cancelDrawing(_ id: UInt64) {
            pre {
                self.DrawingItems[id] != nil:
                    "Drawing does not exist"
            }
            let itemRef = &self.DrawingItems[id] as &DrawingItem
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

        pub fun getPrice(_ id:UInt64): UFix64  {
            pre {
                self.DrawingItems[id] != nil:
                    "Drawing doesn't exist"
            }

            // Get the drawing item resources
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            return itemRef.getPrice()
        }


        pub fun getBidsAddresses(_ id:UInt64) : [Address] {       
            pre {
                self.DrawingItems[id] != nil:
                    "Drawing doesn't exist"
            }

            // Get the drawing item resources
            let itemRef = &self.DrawingItems[id] as &DrawingItem
            return itemRef.getBidsAddresses()
        }

        destroy() {
            log("destroy Drawing collection")
            // destroy the empty resources
            destroy self.DrawingItems
        }
    }

    // createDrawingCollection returns a new DrawingCollection resource to the caller
    pub fun createDrawingCollection(): @DrawingCollection {
        let DrawingCollection <- create DrawingCollection()

        emit CollectionCreated()
        return <- DrawingCollection
    }

    init() {
        self.totalDrawings = (0 as UInt64)
    }   
}