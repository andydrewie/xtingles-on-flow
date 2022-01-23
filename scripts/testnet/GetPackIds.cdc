import NonFungibleToken from 0x631e88ae7f1d7c20
import Pack from 0x2695ea898b04f0c0

pub fun main(address:Address) : [UInt64] {

    let acct = getAccount(address)

    let receiverRef = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow receiver reference")    
     
    return receiverRef.getIDs()
}