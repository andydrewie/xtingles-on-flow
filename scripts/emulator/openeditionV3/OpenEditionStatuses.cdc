import OpenEditionV3 from 0x01cf0e2f2f715450

pub fun main(address:Address): { UInt64: OpenEditionV3.OpenEditionStatus }? {
    let acct = getAccount(address)

    let acctOpenEditionRef = acct.getCapability<&AnyResource{OpenEditionV3.OpenEditionCollectionPublic}>(OpenEditionV3.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow open edition reference")

    return acctOpenEditionRef.getOpenEditionStatuses()
}
