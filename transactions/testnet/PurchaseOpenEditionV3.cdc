import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import FUSD from 0xe223d8a629e49c68
import Collectible, OpenEditionV3 from 0x2695ea898b04f0c0

transaction(
        openEditionAddress: Address,
        id: UInt64,
        amountNfts: UInt64
    ) {

    let openEditionCollectionRef: &AnyResource{OpenEditionV3.OpenEditionCollectionPublic}
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    let vaultRef: &FUSD.Vault
    let amount: UFix64

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
        
        self.openEditionCollectionRef = openEditionOwner.getCapability<&AnyResource{OpenEditionV3.OpenEditionCollectionPublic}>(OpenEditionV3.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")

        self.vaultRef = acct.borrow<&FUSD.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")

        self.amount = self.openEditionCollectionRef.getPrice(id)!  
       
    }

    execute {
     
        var edition = UInt64(1)

     
        while edition <= amountNfts  {
                   
            // withdraw tokens from the buyer's Vault
            var temporaryVault <- self.vaultRef.withdraw(amount: self.amount) as! @FUSD.Vault

            self.openEditionCollectionRef.purchase(
                id: id, 
                buyerTokens: <- temporaryVault,
                collectionCap: self.collectionCap
            ) 
            
            edition = edition + 1;
        }
       
    }
}
