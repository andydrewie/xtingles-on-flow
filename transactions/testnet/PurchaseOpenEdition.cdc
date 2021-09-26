import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import FUSD from 0xe223d8a629e49c68
import Collectible, OpenEditionV2 from 0xefb501878aa34730

transaction(
        openEditionAddress: Address,
        id: UInt64 
    ) {

    let openEditionCollectionRef: &AnyResource{OpenEditionV2.OpenEditionCollectionPublic}
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    let vaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let temporaryVault: @FUSD.Vault

    prepare(acct: AuthAccount) {
       
        let openEditionOwner = getAccount(openEditionAddress)     
          
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
        
        self.openEditionCollectionRef = openEditionOwner.getCapability<&AnyResource{OpenEditionV2.OpenEditionCollectionPublic}>(OpenEditionV2.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")

        self.vaultCap = acct.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
   
        let vaultRef = acct.borrow<&FUSD.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")

        let amount = self.openEditionCollectionRef.getPrice(id)!
        
         // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount) as! @FUSD.Vault
    }

    execute {
       
        self.openEditionCollectionRef.purchase(
            id: id, 
            buyerTokens: <- self.temporaryVault,
            collectionCap: self.collectionCap
        )       
    }
}
