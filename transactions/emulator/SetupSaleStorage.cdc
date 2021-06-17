import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import Collectible, MarketPlace from 0x01cf0e2f2f715450

transaction() {

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SalePublic}>(/public/CollectibleSale)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver)
            acct.save(<-sale, to: /storage/CollectibleSale)
            acct.link<&MarketPlace.SaleCollection{MarketPlace.SalePublic}>(/public/CollectibleSale, target: /storage/CollectibleSale)
            log("Sale Created for account")
        }  
    }

    execute {}
}
