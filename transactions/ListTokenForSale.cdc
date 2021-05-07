import ASMR from 0x175e958cf586f54c
import FungibleToken from 0x9a0766d93b6608b7
import MarketPlace from 0x175e958cf586f54c

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