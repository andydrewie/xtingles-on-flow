import Pack from 0x01cf0e2f2f715450

pub fun main(address:Address, id: UInt64) : UInt64? {
    let acct = getAccount(address)

    let receiverRef = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow pack collection reference")    
     
    return receiverRef.getEditionNumber(id: id)
}
