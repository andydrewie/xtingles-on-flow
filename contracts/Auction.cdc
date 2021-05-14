import FungibleToken from "./FungibleToken.cdc"
import FlowToken from "./FlowToken.cdc"
import ASMR from "./ASMR.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"

pub contract Auction {

    pub struct AuctionStatus{
        pub let id: UInt64
        pub let price : UFix64
        pub let bidIncrement : UFix64
        pub let bids : UInt64
        pub let active: Bool
        pub let timeRemaining : Fix64
        pub let endTime : Fix64
        pub let startTime : Fix64
        pub let metadata: ASMR.Metadata?
        pub let ASMRId: UInt64?
        pub let author: Address
        pub let leader: Address?
        pub let minNextBid: UFix64
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
            leader:Address?, 
            bidIncrement: UFix64,
            author: Address, 
            startTime: Fix64,
            endTime: Fix64,
            minNextBid:UFix64,
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
            self.leader = leader
            self.bidIncrement = bidIncrement
            self.author = author
            self.startTime = startTime
            self.endTime = endTime
            self.minNextBid = minNextBid
            self.completed = completed
            self.expired = expired
            self.cancelled = cancelled
        }
    }

    // The total amount of AuctionItems that have been created
    pub var totalAuctions: UInt64

    // Events
    pub event CollectionCreated(owner: Address)
    pub event Created(tokenID: UInt64, owner: Address, startPrice: UFix64, startTime: UFix64)
    pub event Bid(tokenID: UInt64, bidderAddress: Address, bidPrice: UFix64)
    pub event Settled(tokenID: UInt64, price: UFix64)
    pub event Canceled(tokenID: UInt64)
    pub event MarketplaceEarned(amount:UFix64, owner: Address)  
    pub event TimeRemain(amount:UFix64, owner: Address) 

    // AuctionItem contains the Resources and metadata for a single auction
    pub resource AuctionItem {
        
        //Number of bids made, that is aggregated to the status struct
        priv var numberOfBids: UInt64

        //The Item that is sold at this auction
        //It would be really easy to extend this auction with using a NFTCollection here to be able to auction of several NFTs as a single
        //Lets say if you want to auction of a pack of TopShot moments
        priv var NFT: @ASMR.NFT?

        //This is the escrow vault that holds the tokens for the current largest bid
        priv let bidVault: @FungibleToken.Vault

        //The id of this individual auction
        pub let auctionID: UInt64

        //The minimum increment for a bid. This is an english auction style system where bids increase
        priv let minimumBidIncrement: UFix64

        //the time the acution should start at
        priv var auctionStartTime: UFix64

        //The length in seconds for this auction
        priv var auctionLength: UFix64

        //The max length in seconds for this auction
        priv var maxAuctionLength: UFix64

        //The period of time to extend auction 
        priv var extendedLength: UFix64

        //The period of time of rest to extend
        priv var remainLengthToExtend: UFix64

        //Right now the dropitem is not moved from the collection when it ends, it is just marked here that it has ended 
        priv var auctionCompleted: Bool

        // Auction State
        access(account) var startPrice: UFix64

        priv var currentPrice: UFix64

        //the capability that points to the resource where you want the NFT transfered to if you win this bid. 
        priv var recipientCollectionCap: Capability<&{ASMR.CollectionPublic}>?

        //the capablity to send the escrow bidVault to if you are outbid
        priv var recipientVaultCap: Capability<&{FungibleToken.Receiver}>?

        //the capability for the platform of the NFT to return the item to if the auction is cancelled
        priv let platformCollectionCap: Capability<&{ASMR.CollectionPublic}>

        //the capability to pay the owner of the item when the auction is done
        priv let platformVaultCap: Capability<&{FungibleToken.Receiver}>

        //the capability to pay the author of the item when the auction is done
        priv let authorVaultCap: Capability<&{FungibleToken.Receiver}>

        //the time the acution should start at
        priv var platformCommission: UFix64

        //The length in seconds for this auction
        priv var authorCommission: UFix64

        //This action was cncelled
        priv var auctionCancelled: Bool

        init(
            NFT: @ASMR.NFT,
            minimumBidIncrement: UFix64,
            auctionStartTime: UFix64,
            startPrice: UFix64, 
            auctionLength: UFix64,
            maxAuctionLength: UFix64,  
            extendedLength: UFix64, 
            remainLengthToExtend: UFix64, 
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,            
            platformCollectionCap: Capability<&{ASMR.CollectionPublic}>,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformCommission: UFix64,
            authorCommission: UFix64,            
        ) {
            Auction.totalAuctions = Auction.totalAuctions + (1 as UInt64)
            self.NFT <- NFT
            self.bidVault <- FlowToken.createEmptyVault()
            self.auctionID = Auction.totalAuctions
            self.minimumBidIncrement = minimumBidIncrement
            self.auctionLength = auctionLength
            self.maxAuctionLength = maxAuctionLength
            self.extendedLength = extendedLength
            self.remainLengthToExtend = remainLengthToExtend
            self.startPrice = startPrice
            self.currentPrice = 0.0
            self.auctionStartTime = auctionStartTime
            self.auctionCompleted = false
            self.recipientCollectionCap = nil
            self.recipientVaultCap = nil         
            self.platformVaultCap = platformVaultCap
            self.numberOfBids = 0
            self.authorVaultCap = authorVaultCap
            self.platformCommission = platformCommission
            self.authorCommission = authorCommission
            self.platformCollectionCap = platformCollectionCap
            self.auctionCancelled = false
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

        pub fun releasePreviousBid() {
            if let vaultCap = self.recipientVaultCap {
                self.sendBidTokens(self.recipientVaultCap!)
                return
            } 
        }

        //This method should probably use preconditions more 
        pub fun settleAuction()  {

            pre {
                !self.auctionCompleted : "The auction is already settled"
                self.NFT != nil: "NFT in auction does not exist"
                self.isAuctionExpired() : "Auction has not completed yet"
            }

            // return if there are no bids to settle
            if self.currentPrice == 0.0 {
                self.returnAuctionItemToOwner()
                return
            }            

            //Withdraw royalty to author and put it in their vault
            let amount = self.currentPrice * self.authorCommission * 0.01

            let authorCut <- self.bidVault.withdraw(amount:amount)

            let authorVaultCap = self.authorVaultCap.borrow()!

            emit MarketplaceEarned(amount: amount, owner: authorVaultCap.owner!.address)

            authorVaultCap.deposit(from: <- authorCut)
            
            self.sendNFT(self.recipientCollectionCap!)

            self.sendBidTokens(self.platformVaultCap)

            self.auctionCompleted = true
            
            emit Settled(tokenID: self.auctionID, price: self.currentPrice)
        }

        pub fun returnAuctionItemToOwner() {

            // release the bidder's tokens
            self.releasePreviousBid()    

            self.sendNFT(self.platformCollectionCap!)       
        }

        //this can be negative if is expired
        pub fun timeRemaining() : Fix64 {
            let auctionLength = self.auctionLength

            let startTime = self.auctionStartTime

            let currentTime = getCurrentBlock().timestamp

            let remaining = Fix64(startTime + auctionLength) - Fix64(currentTime)

            return remaining
        }

        pub fun isAuctionExpired(): Bool {
            let timeRemaining = self.timeRemaining()
            return timeRemaining < Fix64(0.0)
        }

        pub fun minNextBid() :UFix64 {
            //If there are bids then the next min bid is the current price plus the increment
            if self.currentPrice != 0.0 {
                return self.currentPrice + self.minimumBidIncrement
            }
            //else stASMR price
            return self.startPrice
        }

        //Extend an auction with a given set of blocks
        pub fun extendWith() {
            self.auctionLength = self.auctionLength + self.extendedLength
        }

        pub fun bidder() : Address? {
            if let vaultCap = self.recipientVaultCap {
                return vaultCap.borrow()!.owner!.address
            }
            return nil
        }

        pub fun currentBidForUser(address:Address): UFix64 {
             if(self.bidder() == address) {
                return self.bidVault.balance
            }
            return 0.0
        }

        // This method should probably use preconditions more
        pub fun placeBid(bidTokens: @FungibleToken.Vault, vaultCap: Capability<&{FungibleToken.Receiver}>, collectionCap: Capability<&{ASMR.CollectionPublic}>) {

            pre {
                !self.auctionCompleted : "The auction is already settled"
                self.NFT != nil: "NFT in auction does not exist"
                self.auctionStartTime < getCurrentBlock().timestamp : "The auction has not started yet"
                !self.auctionCancelled : "Auction was cancelled"
            }

            let bidderAddress=vaultCap.borrow()!.owner!.address
            let collectionAddress=collectionCap.borrow()!.owner!.address

            if bidderAddress != collectionAddress {
              panic("you cannot make a bid and send the ASMR to somebody elses collection")
            }

            let amountYouAreBidding= bidTokens.balance + self.currentBidForUser(address: bidderAddress)
            let minNextBid=self.minNextBid()
            if amountYouAreBidding < minNextBid {
                panic("bid amount + (your current bid) must be larger or equal to the current price + minimum bid increment ".concat(amountYouAreBidding.toString()).concat(" < ").concat(minNextBid.toString()))
            }

            if self.bidder() != bidderAddress {
              if self.bidVault.balance != 0.0 {
                self.sendBidTokens(self.recipientVaultCap!)
              }
            }

            // Update the auction item
            self.bidVault.deposit(from: <-bidTokens)

            //update the capability of the wallet for the address with the current highest bid
            self.recipientVaultCap = vaultCap

            // Update the current price of the token
            self.currentPrice = self.bidVault.balance

            // Add the bidder's Vault and NFT receiver references
            self.recipientCollectionCap = collectionCap
            self.numberOfBids=self.numberOfBids+(1 as UInt64)

            emit Bid(tokenID: self.auctionID, bidderAddress: bidderAddress, bidPrice: self.currentPrice)
        }

        pub fun getAuctionStatus() : AuctionStatus {

            var leader : Address? = nil
            if let recipient = self.recipientVaultCap {
                leader = recipient.borrow()!.owner!.address
            }

            return AuctionStatus(
                id: self.auctionID,
                currentPrice: self.currentPrice, 
                bids: self.numberOfBids,
                active: !self.auctionCompleted && !self.isAuctionExpired(),
                timeRemaining: self.timeRemaining(),
                metadata: self.NFT?.metadata,
                ASMRId: self.NFT?.id,
                leader: leader,
                bidIncrement: self.minimumBidIncrement,
                author: self.authorVaultCap.borrow()!.owner!.address,
                startTime: Fix64(self.auctionStartTime),
                endTime: Fix64(self.auctionStartTime+self.auctionLength),
                minNextBid: self.minNextBid(),
                completed: self.auctionCompleted,
                expired: self.isAuctionExpired(),
                cancelled: self.auctionCancelled
            )
        }

        pub fun cancelAuction() {
            self.auctionCancelled = true
        }

        destroy() {
            log("destroy auction")
                       
            // if there's a bidder...
            if let vaultCap = self.recipientVaultCap {
                // ...send the bid tokens back to the bidder
                self.sendBidTokens(vaultCap)
            }

            destroy self.NFT
            destroy self.bidVault
        }
    }    

    // AuctionPublic is a resource interface that restricts users to
    // retreiving the auction price list and placing bids
    pub resource interface AuctionPublic {

        pub fun createAuction(
            token: @ASMR.NFT, 
            minimumBidIncrement: UFix64, 
            auctionLength: UFix64, 
            maxAuctionLength: UFix64,  
            extendedLength: UFix64,  
            remainLengthToExtend: UFix64,
            auctionStartTime: UFix64,
            startPrice: UFix64, 
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformCollectionCap: Capability<&{ASMR.CollectionPublic}>,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformCommission: UFix64,
            authorCommission: UFix64) 

        pub fun getAuctionStatuses(): {UInt64: AuctionStatus}
        pub fun getAuctionStatus(_ id:UInt64): AuctionStatus
        pub fun getTimeLeft(_ id: UInt64): Fix64
        pub fun cancelAuction(_ id: UInt64)

        pub fun placeBid(
            id: UInt64, 
            bidTokens: @FungibleToken.Vault, 
            vaultCap: Capability<&{FungibleToken.Receiver}>, 
            collectionCap: Capability<&{ASMR.CollectionPublic}>
        )
    }

    // AuctionCollection contains a dictionary of AuctionItems and provides
    // methods for manipulating the AuctionItems
    pub resource AuctionCollection: AuctionPublic {

        // Auction Items
        access(account) var auctionItems: @{UInt64: AuctionItem}             
     
        access(contract) let marketplaceVault: Capability<&{FungibleToken.Receiver}>

        init(
            marketplaceVault: Capability<&{FungibleToken.Receiver}>            
        ) {
            self.marketplaceVault = marketplaceVault
            self.auctionItems <- {}
        }

        pub fun keys() : [UInt64] {
            return self.auctionItems.keys
        }

        // addTokenToauctionItems adds an NFT to the auction items and sets the meta data
        // for the auction item
        pub fun createAuction(
            token: @ASMR.NFT, 
            minimumBidIncrement: UFix64, 
            auctionLength: UFix64, 
            maxAuctionLength: UFix64,
            extendedLength: UFix64, 
            remainLengthToExtend: UFix64,
            auctionStartTime: UFix64,
            startPrice: UFix64,           
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformCollectionCap: Capability<&{ASMR.CollectionPublic}>,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformCommission: UFix64,
            authorCommission: UFix64) {

            pre {              
                auctionLength > 0.00 : "Auction lenght should be more then 0.00"
                auctionStartTime > getCurrentBlock().timestamp : "Auction start time can't be in the past"
                startPrice > 0.00 : "Start price should be more then 0.00"
            }
            
            // create a new auction items resource container
            let item <- Auction.createStandaloneAuction(
                token: <-token,
                minimumBidIncrement: minimumBidIncrement,
                auctionLength: auctionLength,                
                maxAuctionLength: maxAuctionLength,
                extendedLength: extendedLength, 
                remainLengthToExtend:  remainLengthToExtend,
                auctionStartTime: auctionStartTime,
                startPrice: startPrice,             
                platformVaultCap: platformVaultCap,
                authorVaultCap: authorVaultCap,
                platformCollectionCap: platformCollectionCap,
                platformCommission: platformCommission,
                authorCommission: authorCommission,
            )

            let id = item.auctionID

            // update the auction items dictionary with the new resources
            let oldItem <- self.auctionItems[id] <- item
            
            destroy oldItem

            let owner = platformVaultCap.borrow()!.owner!.address

            emit Created(tokenID: id, owner: owner, startPrice: startPrice, startTime: auctionStartTime)
        }

        // getAuctionPrices returns a dictionary of available NFT IDs with their current price
        pub fun getAuctionStatuses(): {UInt64: AuctionStatus} {
            pre {
                self.auctionItems.keys.length > 0: "There are no auction items"
            }

            let priceList: {UInt64: AuctionStatus} = {}

            for id in self.auctionItems.keys {
                let itemRef = &self.auctionItems[id] as? &AuctionItem
                priceList[id] = itemRef.getAuctionStatus()
            }
            
            return priceList
        }

        pub fun getAuctionStatus(_ id:UInt64): AuctionStatus {
            pre {
                self.auctionItems[id] != nil:
                    "NFT doesn't exist"
            }

            // Get the auction item resources
            let itemRef = &self.auctionItems[id] as &AuctionItem
            return itemRef.getAuctionStatus()
        }

        pub fun getTimeLeft(_ id: UInt64): Fix64 {
            pre {
                self.auctionItems[id] != nil:
                    "Auction doesn't exist"
            }

            // Get the auction item resources
            let itemRef = &self.auctionItems[id] as &AuctionItem
            return itemRef.timeRemaining()
        }

        // settleAuction sends the auction item to the highest bidder
        // and deposits the FungibleTokens into the auction owner's account
        pub fun settleAuction(_ id: UInt64) {
            let itemRef = &self.auctionItems[id] as &AuctionItem
            itemRef.settleAuction()
        }

        pub fun cancelAuction(_ id: UInt64) {
            pre {
                self.auctionItems[id] != nil:
                    "Auction does not exist"
            }
            let itemRef = &self.auctionItems[id] as &AuctionItem
            itemRef.returnAuctionItemToOwner()
            itemRef.cancelAuction()
            emit Canceled(tokenID: id)
        }

        // placeBid sends the bidder's tokens to the bid vault and updates the
        // currentPrice of the current auction item
        pub fun placeBid(id: UInt64, bidTokens: @FungibleToken.Vault, vaultCap: Capability<&{FungibleToken.Receiver}>, collectionCap: Capability<&{ASMR.CollectionPublic}>) {
            pre {
                self.auctionItems[id] != nil:
                    "Auction does not exist in this drop"
            }

            // Get the auction item resources
            let itemRef = &self.auctionItems[id] as &AuctionItem
            itemRef.placeBid(
                bidTokens: <- bidTokens, 
                vaultCap : vaultCap, 
                collectionCap:collectionCap
            )
        }

        destroy() {
            log("destroy auction collection")
            // destroy the empty resources
            destroy self.auctionItems
        }
    }

    pub fun createStandaloneAuction(
            token: @ASMR.NFT, 
            minimumBidIncrement: UFix64, 
            auctionLength: UFix64,
            maxAuctionLength: UFix64,
            extendedLength: UFix64, 
            remainLengthToExtend: UFix64,
            auctionStartTime: UFix64,
            startPrice: UFix64,          
            platformVaultCap: Capability<&{FungibleToken.Receiver}>,
            authorVaultCap: Capability<&{FungibleToken.Receiver}>,
            platformCollectionCap: Capability<&{ASMR.CollectionPublic}>,
            platformCommission: UFix64,
            authorCommission: UFix64,
        ) : @AuctionItem {
        
        // create a new auction items resource container
        return <- create AuctionItem(
            NFT: <-token,
            minimumBidIncrement: minimumBidIncrement,
            auctionStartTime: auctionStartTime,
            startPrice: startPrice,
            auctionLength: auctionLength,  
            maxAuctionLength: maxAuctionLength,  
            extendedLength: extendedLength,    
            remainLengthToExtend:  remainLengthToExtend,                
            platformVaultCap: platformVaultCap,
            platformCollectionCap: platformCollectionCap,    
            authorVaultCap: authorVaultCap,            
            platformCommission: platformCommission,
            authorCommission: authorCommission,
        )
    }

    // createAuctionCollection returns a new AuctionCollection resource to the caller
    pub fun createAuctionCollection(marketplaceVault: Capability<&{FungibleToken.Receiver}>): @AuctionCollection {
        let auctionCollection <- create AuctionCollection(
            marketplaceVault: marketplaceVault        
        )

        emit CollectionCreated(owner: marketplaceVault.borrow()!.owner!.address)
        return <- auctionCollection
    }

    init() {
        self.totalAuctions = (0 as UInt64)
    }   
}