import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import Auction, Collectible from 0x01cf0e2f2f715450

transaction(       
        id: UInt64,    
        amount: UFix64,
        auction: Address
    ) {

    let auctionCollectionRef: &AnyResource{Auction.AuctionPublic}
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    let vaultCap: Capability<&{FungibleToken.Receiver}>
    let temporaryVault: @FungibleToken.Vault

    prepare(acct: AuthAccount) {
        let auctionOwner = getAccount(auction) 

        self.collectionCap = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        let auctionCap = acct.getCapability<&{Auction.AuctionPublic}>(/public/auctionCollection)

        if !auctionCap.check() {          
            let sale <- Auction.createAuctionCollection()
            acct.save(<-sale, to: /storage/auctionCollection)         
            acct.link<&{Auction.AuctionPublic}>(/public/auctionCollection, target: /storage/auctionCollection)
            log("Auction Collection Created for account")
        }  
        
        self.auctionCollectionRef = auctionOwner.getCapability<&AnyResource{Auction.AuctionPublic}>(/public/auctionCollection)
            .borrow()
            ?? panic("Could not borrow auction reference")        

        self.vaultCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
   
        let vaultRef = acct.borrow<&FungibleToken.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")
        
          // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount)

    }

    execute {    
        self.auctionCollectionRef.placeBid(id: id, bidTokens:  <- self.temporaryVault, vaultCap: self.vaultCap, collectionCap: self.collectionCap)       
        
    }
}