import NonFungibleToken from 0x01cf0e2f2f715450
import Pack from 0x01cf0e2f2f715450

pub fun main(address:Address) : [UInt64] {

    let acct = getAccount(address)

    let receiverRef = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow receiver reference")    
     
    return receiverRef.getIDs()
}