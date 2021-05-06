import ASMR from 0x9cd9bd78a3826840
import FungibleToken from 0x9a0766d93b6608b7
import FixPrice from 0x9cd9bd78a3826840

transaction(tokenId: UInt64, price: UFix64) {

    prepare(acct: AuthAccount) {
        let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

        let sale <- FixPrice.createSaleCollection(ownerVault: receiver)

        let collectionRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference")  

        let token <- collectionRef.withdraw(withdrawID: tokenId) as! @ASMR.NFT

        sale.listForSale(token: <-token, price: price)

        acct.save(<-sale, to: /storage/NFTSale)

        acct.link<&FixPrice.SaleCollection{FixPrice.SalePublic}>(/public/NFTSale, target: /storage/NFTSale)

        log("Sale Created for account")
    }
}