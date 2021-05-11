import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import MarketPlace from 0xf8d6e0586b0a20c7

transaction(tokenId: UInt64) {

    let receiverRef: &{ASMR.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {
        self.receiverRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
            .borrow()
            ?? panic("could not borrow receiver reference")     
            
        self.saleRef = acct.borrow<&MarketPlace.SaleCollection>(from: /storage/ASMRSale)
            ?? panic("could not borrow marketplace reference")     
    }

    execute {    

        let token <- self.saleRef.withdraw(tokenID: tokenId) as! @ASMR.NFT

        self.receiverRef.deposit(token: <- token)

        log("NFT was moved from sale storage to NFT's storage")

    }
}