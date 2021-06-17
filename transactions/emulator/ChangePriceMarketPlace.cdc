import FungibleToken from 0xee82856bf20e2aa6
import Collectible, MarketPlace from 0x01cf0e2f2f715450

transaction(tokenId: UInt64, price: UFix64) {

    let collectionRef: &{Collectible.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SalePublic}>(/public/CollectibleSale)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver, )
            acct.save(<-sale, to: /storage/CollectibleSale)
            acct.link<&MarketPlace.SaleCollection{MarketPlace.SalePublic}>(/public/CollectibleSale, target: /storage/CollectibleSale)
            log("Sale Created for account")
        }  

        self.collectionRef = acct.getCapability<&{Collectible.CollectionPublic}>(/public/CollectibleCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference")  

        self.saleRef = acct.borrow<&MarketPlace.SaleCollection>(from: /storage/CollectibleSale)
            ?? panic("could not borrow minter reference")     
    }

    execute {    

        self.saleRef.changePrice(tokenID: tokenId, newPrice: price)

    }
}
