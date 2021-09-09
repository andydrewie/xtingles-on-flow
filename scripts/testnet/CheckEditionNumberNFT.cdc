import Collectible from  0xfc747df8f5e61fcb

pub fun main(address:Address, id: UInt64) : UInt64? {
    let acct = getAccount(address)

    let receiverRef = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow collectible collection reference")    
     
    return receiverRef.getEditionNumber(id: id)
}
