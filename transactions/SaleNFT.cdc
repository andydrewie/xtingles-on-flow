import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import MarketPlace from 0xf8d6e0586b0a20c7

transaction(tokenId: UInt64, price: UFix64) {

    let collectionRef: &{ASMR.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {

        let marketplaceCap = acct.getCapability<&{MarketPlace.SalePublic}>(/public/ASMRSale)

        if !marketplaceCap.check() {
            let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            let sale <- MarketPlace.createSaleCollection(ownerVault: receiver)
            acct.save(<-sale, to: /storage/ASMRSale)
            acct.link<&MarketPlace.SaleCollection{MarketPlace.SalePublic}>(/public/ASMRSale, target: /storage/ASMRSale)
            log("Sale Created for account")
        }  

        self.collectionRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference")  

        self.saleRef = acct.borrow<&MarketPlace.SaleCollection>(from: /storage/ASMRSale)
            ?? panic("could not borrow minter reference")     
    }

    execute {    

        let token <- self.collectionRef.withdraw(withdrawID: tokenId) as! @ASMR.NFT

        self.saleRef.listForSale(token: <-token, price: price)

    }
}