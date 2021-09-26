import FungibleToken from 0x9a0766d93b6608b7
import FUSD from 0xe223d8a629e49c68
import Collectible, MarketPlace from 0xefb501878aa34730

transaction(tokenId: UInt64, price: UFix64) {

    let collectionRef: &{Collectible.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SaleCollectionPublic}>(MarketPlace.CollectionPublicPath)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver)
            acct.save(<-sale, to: MarketPlace.CollectionStoragePath)
            acct.link<&MarketPlace.SaleCollection{MarketPlace.SaleCollectionPublic}>(MarketPlace.CollectionPublicPath, target: MarketPlace.CollectionStoragePath)
            log("Sale Created for account")
        }  

        self.collectionRef = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")  

        self.saleRef = acct.borrow<&MarketPlace.SaleCollection>(from: MarketPlace.CollectionStoragePath)
            ?? panic("could not borrow minter reference")     
    }

    execute {    

        self.saleRef.changePrice(tokenID: tokenId, newPrice: price)

    }
}
