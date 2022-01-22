import NonFungibleToken from 0x01cf0e2f2f715450
import Pack from 0x01cf0e2f2f715450

pub fun main(address:Address) : Bool {

    let account = getAccount(address)
    let packCap = account.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
    
    return packCap.check()
}