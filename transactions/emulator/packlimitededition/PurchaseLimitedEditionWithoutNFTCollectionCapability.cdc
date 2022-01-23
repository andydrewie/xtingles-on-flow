import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import Pack, PackLimitedEdition from 0x01cf0e2f2f715450

transaction(
        limitedEditionAddress: Address,
        id: UInt64 
    ) {

    let limitedEditionCollectionRef: &AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}
    let collectionCap: Capability<&{Pack.CollectionPublic}> 
    let temporaryVault: @FUSD.Vault

    prepare(acct: AuthAccount) {
       
        let openEditionOwner = getAccount(limitedEditionAddress)     
          
        // get the references to the buyer's Vault and NFT Collection receiver        
        self.collectionCap = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
      
        self.limitedEditionCollectionRef = openEditionOwner.getCapability<&AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}>(PackLimitedEdition.CollectionPublicPath)
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
