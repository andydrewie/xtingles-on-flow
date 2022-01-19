import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import Collectible, OpenEditionV3 from 0x01cf0e2f2f715450

transaction(
        openEditionAddress: Address,
        id: UInt64 
    ) {

    let openEditionCollectionRef: &AnyResource{OpenEditionV3.OpenEditionCollectionPublic}
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    let temporaryVault: @FUSD.Vault

    prepare(acct: AuthAccount) {
       
        let openEditionOwner = getAccount(openEditionAddress)     
          
        // get the references to the buyer's Vault and NFT Collection receiver        
        self.collectionCap = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
      
        self.openEditionCollectionRef = openEditionOwner.getCapability<&AnyResource{OpenEditionV3.OpenEditionCollectionPublic}>(OpenEditionV3.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")
   
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