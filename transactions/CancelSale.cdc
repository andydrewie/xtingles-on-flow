import ASMR from 0x175e958cf586f54c
import FungibleToken from 0x9a0766d93b6608b7
import MarketPlace from 0x175e958cf586f54c

transaction(tokenId: UInt64) {

    let receiverRef: &{ASMR.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {
        self.receiverRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference")     
            
        self.saleRef = acct.borrow<&MarketPlace.SaleCollection>(from: /storage/ASMRSale)
            ?? panic("could not borrow minter reference")     
    }

    execute {    

        let token <- self.saleRef.withdraw(tokenID: tokenId) as! @ASMR.NFT

        self.receiverRef.deposit(token: <- token)

        log("NFT Minted and deposited to Account 2's Collection")

    }
}