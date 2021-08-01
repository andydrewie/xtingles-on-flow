import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import Auction, Collectible from 0x01cf0e2f2f715450

transaction(       
        id: UInt64,    
        amount: UFix64,
        auction: Address
    ) {

    let auctionCollectionRef: &AnyResource{Auction.AuctionCollectionPublic}
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    let vaultCap: Capability<&{FungibleToken.Receiver}>
    let temporaryVault: @FungibleToken.Vault

    prepare(acct: AuthAccount) {
        let auctionOwner = getAccount(auction)       
        // get the references to the buyer's Vault and NFT Collection receiver
        var collectionCap = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            acct.save<@NonFungibleToken.Collection>(<- Collectible.createEmptyCollection(), to: Collectible.CollectionStoragePath)

            // publish a capability to the Collection in storage
            acct.link<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath, target: Collectible.CollectionStoragePath)
        }

        self.collectionCap = collectionCap 

        let auctionCap = acct.getCapability<&{Auction.AuctionCollectionPublic}>(Auction.CollectionPublicPath)

        if !auctionCap.check() {          
            let sale <- Auction.createAuctionCollection()
            acct.save(<-sale, to:Auction.CollectionStoragePath)         
            acct.link<&{Auction.AuctionCollectionPublic}>(Auction.CollectionPublicPath, target:Auction.CollectionStoragePath)
            log("Auction Collection Created for account")
        }  
        
        self.auctionCollectionRef = auctionOwner.getCapability<&AnyResource{Auction.AuctionCollectionPublic}>(Auction.CollectionPublicPath)
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