import Collectible from 0xf8d6e0586b0a20c7

pub fun main(address:Address, id: UInt64) : UInt64 {
    let acct = getAccount(address)

    let receiverRef = acct.getCapability<&{Collectible.CollectionPublic}>(/public/CollectibleCollection)
        .borrow()
        ?? panic("Could not borrow receiver reference")    
     
    return receiverRef.getEditionNumber(id: id)
}
