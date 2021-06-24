import FungibleToken from 0x9a0766d93b6608b7
import Collectible, MarketPlace from 0xfc747df8f5e61fcb

transaction(tokenId: UInt64) {

    let receiverRef: &{Collectible.CollectionPublic}
    let saleRef: &MarketPlace.SaleCollection

    prepare(acct: AuthAccount) {
        self.receiverRef = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
            .borrow()
            ?? panic("could not borrow receiver reference")     
            
        self.saleRef = acct.borrow<&MarketPlace.SaleCollection>(from: MarketPlace.CollectionStoragePath)
            ?? panic("could not borrow marketplace reference")     
    }

    execute {    

        let token <- self.saleRef.withdraw(tokenID: tokenId) as! @Collectible.NFT

        self.receiverRef.deposit(token: <- token)

        log("NFT was moved from sale storage to NFT's storage")
    }
}
