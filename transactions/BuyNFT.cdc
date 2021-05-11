//emulator
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, ASMR, MarketPlace from 0xf8d6e0586b0a20c7

transaction(marketplace: Address, tokenId: UInt64, amount: UFix64) {
    // reference to the buyer's NFT collection where they
    // will store the bought NFT

    let vaultCap: Capability<&{FungibleToken.Receiver}>
    let collectionCap: Capability<&{ASMR.CollectionPublic}> 
    // Vault that will hold the tokens that will be used
    // to buy the NFT
    let temporaryVault: @FungibleToken.Vault

    prepare(account: AuthAccount) {

        // get the references to the buyer's Vault and NFT Collection receiver
        var collectionCap = account.getCapability<&{ASMR.CollectionPublic}>(ASMR.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            account.save<@NonFungibleToken.Collection>(<- ASMR.createEmptyCollection(), to: ASMR.CollectionStoragePath)

            // publish a capability to the Collection in storage
            account.link<&{ASMR.CollectionPublic}>(ASMR.CollectionPublicPath, target: ASMR.CollectionStoragePath)
        }

        self.collectionCap = collectionCap
        
        self.vaultCap = account.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                   
        let vaultRef = account.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow owner's Vault reference")

        // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // get the read-only account storage of the seller
        let seller = getAccount(marketplace)

        let marketplace= seller.getCapability(/public/ASMRSale).borrow<&{MarketPlace.SalePublic}>()
            ?? panic("Could not borrow seller's sale reference")

        marketplace.purchase(tokenID: tokenId, recipientCap:self.collectionCap, buyTokens: <- self.temporaryVault)
    }
}
 