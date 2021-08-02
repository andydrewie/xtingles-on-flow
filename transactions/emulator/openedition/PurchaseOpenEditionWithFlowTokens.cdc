import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import Collectible, OpenEdition from 0x01cf0e2f2f715450

transaction(
        openEditionAddress: Address,
        id: UInt64 
    ) {

    let openEditionCollectionRef: &AnyResource{OpenEdition.OpenEditionCollectionPublic}
    let collectionCap: Capability<&Collectible.Collection{Collectible.CollectionPublic}> 
    let temporaryVault: @FungibleToken.Vault

    prepare(acct: AuthAccount) {
       
        let openEditionOwner = getAccount(openEditionAddress)     
          
        // get the references to the buyer's Vault and NFT Collection receiver        
        var collectionCap = acct.getCapability<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            acct.save<@NonFungibleToken.Collection>(<- Collectible.createEmptyCollection(), to: Collectible.CollectionStoragePath)

            // publish a capability to the Collection in storage
            acct.link<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath, target: Collectible.CollectionStoragePath)
        }

        self.collectionCap = acct.getCapability<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
        
        self.openEditionCollectionRef = openEditionOwner.getCapability<&AnyResource{OpenEdition.OpenEditionCollectionPublic}>(OpenEdition.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")
       
        let vaultRef = acct.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow owner's Vault reference")

        let amount = self.openEditionCollectionRef.getPrice(id)!
        
         // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount)

    }

    execute {
       
        self.openEditionCollectionRef.purchase(
            id: id, 
            buyerTokens: <- self.temporaryVault,
            collectionCap: self.collectionCap
        )       
    }
}
