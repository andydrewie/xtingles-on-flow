import Collectible from 0x01cf0e2f2f715450

pub fun main(address:Address, id: UInt64) : UInt64 {
    let acct = getAccount(address)

    let receiverRef = acct.getCapability<&{Collectible.CollectionPublic}>(/public/CollectibleCollection)
        .borrow()
        ?? panic("Could not borrow collectible collection reference")    
     
    return receiverRef.getEditionNumber(id: id)
}
