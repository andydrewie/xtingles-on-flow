import Collectible from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import MarketPlace from 0xf8d6e0586b0a20c7

transaction(tokenId: UInt64, price: UFix64) {

    let collectionRef: &{Collectible.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SalePublic}>(/public/CollectibleSale)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver)
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

        let token <- self.collectionRef.withdraw(withdrawID: tokenId) as! @Collectible.NFT

        self.saleRef.listForSale(token: <-token, price: price)

    }
}
