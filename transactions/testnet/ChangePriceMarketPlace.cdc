import FungibleToken from 0x9a0766d93b6608b7
import Collectible, MarketPlace from 0xfc747df8f5e61fcb

transaction(tokenId: UInt64, price: UFix64) {

    let collectionRef: &{Collectible.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SalePublic}>(MarketPlace.CollectionPublicPath)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver, )
            acct.save(<-sale, to: MarketPlace.CollectionStoragePath)
            acct.link<&MarketPlace.SaleCollection{MarketPlace.SalePublic}>(MarketPlace.CollectionPublicPath, target: MarketPlace.CollectionStoragePath)
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
