import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import Drawing from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction(
        drawingOwnerAddress: Address,
        id: UInt64
    ) {

    let drawingRef: &AnyResource{Drawing.DrawingPublic}
    let collectionCap: Capability<&{ASMR.CollectionPublic}> 
    let vaultCap: Capability<&{FungibleToken.Receiver}>
    let temporaryVault: @FungibleToken.Vault

    prepare(acct: AuthAccount) {
        let drawingOwner = getAccount(drawingOwnerAddress)       
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
        
        self.drawingRef = drawingOwner.getCapability<&AnyResource{Drawing.DrawingPublic}>(/public/drawingCollection)
            .borrow()
            ?? panic("Could not borrow drawing reference")

        self.vaultCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
   
        let vaultRef = acct.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow owner's Vault reference")
        
        let amount = self.drawingRef.getPrice(id)        

        // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount)
    }

    execute {    
        self.drawingRef.placeBid(id: id, bidTokens: <- self.temporaryVault, vaultCap: self.vaultCap, collectionCap: self.collectionCap)       
    }
}