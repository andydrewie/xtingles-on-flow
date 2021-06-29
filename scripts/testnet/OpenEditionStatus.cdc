import OpenEdition from 0xfc747df8f5e61fcb

pub fun main(address:Address, id: UInt64): OpenEdition.OpenEditionStatus? {
    let acct = getAccount(address)

    let acctOpenEditionRef = acct.getCapability<&AnyResource{OpenEdition.OpenEditionPublic}>(OpenEdition.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow open edition reference")

    return acctOpenEditionRef.getOpenEditionStatus(id)
}
