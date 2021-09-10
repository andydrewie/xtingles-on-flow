import Auction, Collectible from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(id: UInt64, recipient: Address) {

    let client: &Auction.AuctionCollection
    let collectionCap: Capability<&{Collectible.CollectionPublic}> 
    
    prepare(acct: AuthAccount) {
        let recipientAcct = getAccount(recipient)    
        self.collectionCap = recipientAcct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
        self.client = acct.borrow<&Auction.AuctionCollection>(from:Auction.CollectionStoragePath) ?? panic("could not load admin storage for auction")
    }

    execute {
        self.client.reclaimSendNFT(id: id, collectionCap: self.collectionCap)
    }
}