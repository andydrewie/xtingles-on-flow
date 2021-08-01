import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import Collectible, MarketPlace from 0x01cf0e2f2f715450

transaction() {

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SaleCollectionPublic}>(MarketPlace.CollectionPublicPath)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver)
            acct.save(<-sale, to: MarketPlace.CollectionStoragePath)
            acct.link<&MarketPlace.SaleCollection{MarketPlace.SaleCollectionPublic}>(MarketPlace.CollectionPublicPath, target: MarketPlace.CollectionStoragePath)
            log("Sale Created for account")
        }  
    }

    execute {}
}
