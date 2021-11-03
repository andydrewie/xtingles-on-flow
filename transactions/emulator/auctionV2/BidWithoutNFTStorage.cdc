import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import AuctionV2, Collectible from 0x01cf0e2f2f715450

transaction(       
        id: UInt64,    
        amount: UFix64,
        auction: Address
    ) {

    let auctionCollectionRef: &AnyResource{AuctionV2.AuctionCollectionPublic}
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    let vaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let temporaryVault: @FUSD.Vault

    prepare(acct: AuthAccount) {
        let auctionOwner = getAccount(auction) 

        self.collectionCap = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        self.auctionCollectionRef = auctionOwner.getCapability<&AnyResource{AuctionV2.AuctionCollectionPublic}>(AuctionV2.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow auction reference")        

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