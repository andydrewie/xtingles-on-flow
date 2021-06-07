import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import Auction from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7
import OpenEdition from 0xf8d6e0586b0a20c7

transaction(
        openEditionOwner: Address,
        id: UInt64 
    ) {

    let openEditionCollectionRef: &AnyResource{OpenEdition.OpenEditionPublic}
    let collectionCap: Capability<&{ASMR.CollectionPublic}> 
    let vaultCap: Capability<&{FungibleToken.Receiver}>
    let temporaryVault: @FungibleToken.Vault

    prepare(acct: AuthAccount) {
       
        let openEditionOwner = getAccount(openEditionOwner)       
        // get the references to the buyer's Vault and NFT Collection receiver        
        var collectionCap = acct.getCapability<&{ASMR.CollectionPublic}>(ASMR.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            acct.save<@NonFungibleToken.Collection>(<- ASMR.createEmptyCollection(), to: ASMR.CollectionStoragePath)

            // publish a capability to the Collection in storage
            acct.link<&{ASMR.CollectionPublic}>(ASMR.CollectionPublicPath, target: ASMR.CollectionStoragePath)
        }

        self.collectionCap = acct.getCapability<&{ASMR.CollectionPublic}>(ASMR.CollectionPublicPath)
        
        self.openEditionCollectionRef = openEditionOwner.getCapability<&AnyResource{OpenEdition.OpenEditionPublic}>(/public/openEditionCollection)
            .borrow()
            ?? panic("Could not borrow nft sale reference")

        self.vaultCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
   
        let vaultRef = acct.borrow<&FungibleToken.Vault>(from: /storage/fusdVault)
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