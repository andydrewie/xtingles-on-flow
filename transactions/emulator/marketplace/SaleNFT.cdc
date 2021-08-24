import FungibleToken from 0xee82856bf20e2aa6
import Collectible, MarketPlace, FUSD from 0x01cf0e2f2f715450

transaction(tokenId: UInt64, price: UFix64) {

    let collectionRef: &Collectible.Collection
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SaleCollectionPublic}>(MarketPlace.CollectionPublicPath)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver, )
            acct.save(<-sale, to: MarketPlace.CollectionStoragePath)
            acct.link<&MarketPlace.SaleCollection{MarketPlace.SaleCollectionPublic}>(MarketPlace.CollectionPublicPath, target: MarketPlace.CollectionStoragePath)
            log("Sale Created for account")
        }  
   
        self.collectionRef = acct.borrow<&Collectible.Collection>(from: Collectible.CollectionStoragePath)
             ?? panic("Could not borrow seller reference")  

        self.saleRef = acct.borrow<&MarketPlace.SaleCollection>(from: MarketPlace.CollectionStoragePath)
            ?? panic("could not borrow sale reference")     
    }

    execute {    

        let token <- self.collectionRef.withdraw(withdrawID: tokenId) as! @Collectible.NFT

        self.saleRef.listForSale(token: <-token, price: price)

    }
}
