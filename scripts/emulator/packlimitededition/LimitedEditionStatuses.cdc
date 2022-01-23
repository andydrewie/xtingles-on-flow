import PackLimitedEdition from 0x01cf0e2f2f715450

pub fun main(address:Address): { UInt64: PackLimitedEdition.LimitedEditionStatus }? {
    let acct = getAccount(address)

    let acctLimitedEditionRef = acct.getCapability<&AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}>(PackLimitedEdition.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow limited edition reference")

    return acctLimitedEditionRef.getLimitedEditionStatuses()
}
