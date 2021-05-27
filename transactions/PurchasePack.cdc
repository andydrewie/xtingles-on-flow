import Pack from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0xf8d6e0586b0a20c7
import PackSale from 0xf8d6e0586b0a20c7

transaction(
        packOwner: Address,
        id: UInt64 
    ) {

    let packSaleCollectionRef: &AnyResource{PackSale.PackSalePublic}
    let collectionCap: Capability<&{Pack.CollectionPublic}> 
    let vaultCap: Capability<&{FungibleToken.Receiver}>
    let temporaryVault: @FungibleToken.Vault

    prepare(acct: AuthAccount) {
       
        let owner = getAccount( packOwner)       
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
        
        self.packSaleCollectionRef = owner.getCapability<&AnyResource{OPackSale.PackSalePublic}>(/public/packSaleCollection)
            .borrow()
            ?? panic("Could not borrow nft sale reference")

        self.vaultCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
   
        let vaultRef = acct.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow owner's Vault reference")

        let amount = self.openEditionCollectionRef.getPrice(id)
        
         // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount)        

    }

    execute {
       
        self.openEditionCollectionRef.purchase(
            id: id, buyerTokens: <- self.temporaryVault, collectionCap: self.collectionCap
        )       
    }
}