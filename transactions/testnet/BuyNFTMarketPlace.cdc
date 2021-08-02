import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import FUSD from 0xe223d8a629e49c68
import Collectible, MarketPlace from 0xfc747df8f5e61fcb

transaction(
    marketplace: Address,
    tokenId: UInt64,
    ) {
    // reference to the buyer's NFT collection where they
    // will store the bought NFT

    let vaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let collectionCap: Capability<&Collectible.Collection{Collectible.CollectionPublic}> 
    // Vault that will hold the tokens that will be used
    // to buy the NFT
    let temporaryVault: @FUSD.Vault

    prepare(account: AuthAccount) {

        // get the references to the buyer's Vault and NFT Collection receiver
        var collectionCap = account.getCapability<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            account.save<@NonFungibleToken.Collection>(<- Collectible.createEmptyCollection(), to: Collectible.CollectionStoragePath)

            // publish a capability to the Collection in storage
            account.link<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath, target: Collectible.CollectionStoragePath)
        }

        self.collectionCap = collectionCap
        
        self.vaultCap = account.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
                   
        let vaultRef = account.borrow<&FUSD.Vault>(from: /storage/fusdVault)
            ?? panic("Could not borrow owner's Vault reference")
        
        let acct = getAccount(marketplace)

        let acctsaleRef = acct.getCapability<&AnyResource{MarketPlace.SaleCollectionPublic}>(MarketPlace.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")
        
        let amount = acctsaleRef.idPrice(tokenID: tokenId) ?? panic("Price cannot be nil")

        // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount) as! @FUSD.Vault
    }

    execute {
        // get the read-only account storage of the seller
        let seller = getAccount(marketplace)

        let marketplace= seller.getCapability(MarketPlace.CollectionPublicPath).borrow<&{MarketPlace.SaleCollectionPublic}>()
            ?? panic("Could not borrow seller's sale reference")

        marketplace.purchase(
            tokenID: tokenId,
            recipientCap: self.collectionCap,
            buyTokens: <- self.temporaryVault     
        )
    }
}
