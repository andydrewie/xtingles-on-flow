import Auction, Collectible from 0x2695ea898b04f0c0
import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(
        auction: Address,
        id: UInt64,    
        amount: UFix64
    ) {

    let auctionCollectionRef: &AnyResource{Auction.AuctionPublic}
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
        
        self.auctionCollectionRef = auctionOwner.getCapability<&AnyResource{Auction.AuctionPublic}>(/public/auctionCollection)
            .borrow()
            ?? panic("Could not borrow nft sale reference")

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