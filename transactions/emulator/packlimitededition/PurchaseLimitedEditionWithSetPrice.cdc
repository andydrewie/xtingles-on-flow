import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import Pack, PackLimitedEdition from 0x01cf0e2f2f715450

transaction(
        openEditionAddress: Address,
        id: UInt64 
    ) {

    let limitedEditionCollectionRef: &AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}
    let collectionCap: Capability<&{Pack.CollectionPublic}> 
    let temporaryVault: @FUSD.Vault

    prepare(acct: AuthAccount) {
       
        let limitedEditionOwner = getAccount(openEditionAddress)     
          
        // get the references to the buyer's Vault and Pack Collection receiver        
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
            ?? panic("Could not borrow nft sale reference")
   
        let vaultRef = acct.borrow<&FUSD.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")
        
         // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: 10.00) as! @FUSD.Vault 
    }

    execute {
       
        self.limitedEditionCollectionRef.purchase(
            id: id, 
            buyerTokens: <- self.temporaryVault,
            collectionCap: self.collectionCap
        )       
    }
}
