import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import FUSD from 0xe223d8a629e49c68
import Pack, PackLimitedEdition from 0x2695ea898b04f0c0

transaction(
        openEditionAddress: Address,
        id: UInt64 
    ) {

    let limitedEditionCollectionRef: &AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}
    let collectionCap: Capability<&{Pack.CollectionPublic}> 
    let temporaryVault: @FUSD.Vault

    prepare(acct: AuthAccount) {
       
        let limitedEditionOwner = getAccount(openEditionAddress)     
          
        // get the references to the buyer's Vault and pack Collection receiver        
        var collectionCap = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            acct.save<@NonFungibleToken.Collection>(<- Pack.createEmptyCollection(), to: Pack.CollectionStoragePath)

            // publish a capability to the Collection in storage
            acct.link<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath, target: Pack.CollectionStoragePath)
        }

        self.collectionCap = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
        
        self.limitedEditionCollectionRef = limitedEditionOwner.getCapability<&AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}>(PackLimitedEdition.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow pack sale reference")
   
        let vaultRef = acct.borrow<&FUSD.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")

        let amount = self.limitedEditionCollectionRef.getPrice(id)!
        
         // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount) as! @FUSD.Vault

    }

    execute {
       
        self.limitedEditionCollectionRef.purchase(
            id: id, 
            buyerTokens: <- self.temporaryVault,
            collectionCap: self.collectionCap
        )       
    }
}
