import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import MarketPlace, Collectible, FUSD from 0x01cf0e2f2f715450

transaction(
    marketplace: Address,
    tokenId: UInt64,
    ) {
    // reference to the buyer's NFT collection where they
    // will store the bought NFT

    let collectionCap: Capability<&Collectible.Collection{Collectible.CollectionPublic}> 
    // Vault that will hold the tokens that will be used
    // to buy the NFT
    let temporaryVault: @FUSD.Vault

    prepare(account: AuthAccount) {     
  
        self.collectionCap = account.getCapability<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)        
                    
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

