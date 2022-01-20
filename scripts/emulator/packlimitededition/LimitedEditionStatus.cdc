import PackLimitedEdition from 0x01cf0e2f2f715450

pub fun main(address:Address, id: UInt64): PackLimitedEdition.LimitedEditionStatus? {
    let acct = getAccount(address)

    let acctOpenEditionRef = acct.getCapability<&AnyResource{PackLimitedEdition.LimitedEditionCollectionPublic}>(PackLimitedEdition.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow limited edition reference")

    return acctOpenEditionRef.getLimitedEditionStatus(id)
}
