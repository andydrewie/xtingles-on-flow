import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import FUSD from 0xe223d8a629e49c68
import Pack, PackLimitedEdition from 0x2695ea898b04f0c0

transaction(
        LimitedEditionAddress: Address,
        id: UInt64,
        amountNfts: UInt64
    ) {

    let LimitedEditionCollectionRef: &AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}
    let collectionCap: Capability<&{Pack.CollectionPublic}> 
    let vaultRef: &FUSD.Vault
    let amount: UFix64

    prepare(acct: AuthAccount) {
       
        let LimitedEditionOwner = getAccount(LimitedEditionAddress)     
          
        // get the references to the buyer's Vault and NFT Collection receiver        
        var collectionCap = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            acct.save<@NonFungibleToken.Collection>(<- Pack.createEmptyCollection(), to: Pack.CollectionStoragePath)

            // publish a capability to the Collection in storage
            acct.link<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath, target: Pack.CollectionStoragePath)
        }

        self.collectionCap = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
        
        self.LimitedEditionCollectionRef = LimitedEditionOwner.getCapability<&AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}>(PackLimitedEdition.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")

        self.vaultRef = acct.borrow<&FUSD.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")

        self.amount = self.LimitedEditionCollectionRef.getPrice(id)!  
       
    }

    execute {
     
        var edition = UInt64(1)

     
        while edition <= amountNfts  {
                   
            // withdraw tokens from the buyer's Vault
            var temporaryVault <- self.vaultRef.withdraw(amount: self.amount) as! @FUSD.Vault

            self.LimitedEditionCollectionRef.purchase(
                id: id, 
                buyerTokens: <- temporaryVault,
                collectionCap: self.collectionCap
            ) 
            
            edition = edition + (1 as UInt64);
        }
       
    }
}
 