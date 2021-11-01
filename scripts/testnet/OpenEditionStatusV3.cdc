import OpenEditionV3 from 0x2695ea898b04f0c0

pub fun main(address:Address, id: UInt64): OpenEditionV3.OpenEditionStatus? {
    let acct = getAccount(address)

    let acctOpenEditionRef = acct.getCapability<&AnyResource{OpenEditionV3.OpenEditionCollectionPublic}>(OpenEditionV3.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow open edition reference")

    return acctOpenEditionRef.getOpenEditionStatus(id)
}
