import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import MarketPlace, Collectible from 0x01cf0e2f2f715450

transaction(
    marketplace: Address,
    tokenId: UInt64,
    ) {
    // reference to the buyer's NFT collection where they
    // will store the bought NFT

    let vaultCap: Capability<&{FungibleToken.Receiver}>
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    // Vault that will hold the tokens that will be used
    // to buy the NFT
    let temporaryVault: @FungibleToken.Vault

    prepare(account: AuthAccount) {
     
        // get the references to the buyer's Vault and NFT Collection receiver
        var collectionCap = account.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            account.save<@NonFungibleToken.Collection>(<- Collectible.createEmptyCollection(), to: Collectible.CollectionStoragePath)

            // publish a capability to the Collection in storage
            account.link<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath, target: Collectible.CollectionStoragePath)
        }

        self.collectionCap = account.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
        
        self.vaultCap = account.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
                   
        let vaultRef = account.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow owner's Vault reference")
        
        let acct = getAccount(marketplace)

        let acctsaleRef = acct.getCapability<&AnyResource{MarketPlace.SalePublic}>(MarketPlace.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow nft sale reference")
        
        let amount = acctsaleRef.idPrice(tokenID: tokenId) ?? panic("Price cannot be nil")

        // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // get the read-only account storage of the seller
        let seller = getAccount(marketplace)

        let marketplace= seller.getCapability(/public/CollectibleSale).borrow<&{MarketPlace.SalePublic}>()
            ?? panic("Could not borrow seller's sale reference")

        marketplace.purchase(
            tokenID: tokenId,
            recipientCap: self.collectionCap,
            buyTokens: <- self.temporaryVault     
        )
    }
}

