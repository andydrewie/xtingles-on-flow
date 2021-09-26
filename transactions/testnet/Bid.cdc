import Auction, Collectible from 0xefb501878aa34730
import FungibleToken from 0x9a0766d93b6608b7
import FUSD from 0xe223d8a629e49c68
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(
        // auction owner address
        address: Address,
        // auction id
        id: UInt64,    
        // bid amount
        amount: UFix64
    ) {

    let auctionCollectionRef: &AnyResource{Auction.AuctionCollectionPublic}
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    let vaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let temporaryVault: @FUSD.Vault

    prepare(acct: AuthAccount) {
        let auctionOwner = getAccount(address)       
        // get the references to the buyer's Vault and NFT Collection receiver
        var collectionCap = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            acct.save<@NonFungibleToken.Collection>(<- Collectible.createEmptyCollection(), to: Collectible.CollectionStoragePath)

            // publish a capability to the Collection in storage
            acct.link<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath, target: Collectible.CollectionStoragePath)
        }

        self.collectionCap = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
        
        self.auctionCollectionRef = auctionOwner.getCapability<&AnyResource{Auction.AuctionCollectionPublic}>(Auction.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")

        // capability to vault of bidder
        self.vaultCap = acct.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
   
        let vaultRef = acct.borrow<&FUSD.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")
        
        // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount) as! @FUSD.Vault

    }

    execute {    
        self.auctionCollectionRef.placeBid(id: id, bidTokens:  <- self.temporaryVault, vaultCap: self.vaultCap, collectionCap: self.collectionCap)       
      
    }
}