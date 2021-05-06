import ASMR from 0x9cd9bd78a3826840
import FungibleToken from 0x9a0766d93b6608b7
import FixPrice from 0x9cd9bd78a3826840

transaction(tokenId: UInt64, price: UFix64) {

    prepare(acct: AuthAccount) {
        let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

        let sale <- FixPrice.createSaleCollection(ownerVault: receiver)

        let collectionRef = acct.borrow<&ASMR.Collection>(from: /storage/ASMRCollection)
            ?? panic("Could not borrow owner's nft collection reference")

        let token <- collectionRef.withdraw(withdrawID: tokenId) 

        sale.listForSale(token: <-token, price: price)

        acct.save(<-sale, to: /storage/NFTSale)

        acct.link<&FixPrice.SaleCollection{FixPrice.SalePublic}>(/public/NFTSale, target: /storage/NFTSale)

        log("Sale Created for account")
    }
}