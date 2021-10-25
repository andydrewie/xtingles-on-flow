import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import AuctionV2 from 0x1bc62b2c04dfd147

transaction(id: UInt64) {

    let client: &AuctionV2.AuctionCollection
    
    prepare(account: AuthAccount) {
        self.client = account.borrow<&AuctionV2.AuctionCollection>(from:AuctionV2.CollectionStoragePath) ?? panic("could not load admin auction reference")
    }

    execute {
        self.client.settleAuction(id)
    }
}