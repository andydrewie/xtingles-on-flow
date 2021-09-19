import OpenEditionV2 from 0xf5b0eb433389ac3f

pub fun main(address:Address, id: UInt64): OpenEditionV2.OpenEditionStatus? {
    let acct = getAccount(address)

    let acctOpenEditionRef = acct.getCapability<&AnyResource{OpenEditionV2.OpenEditionCollectionPublic}>(OpenEditionV2.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow open edition reference")

    return acctOpenEditionRef.getOpenEditionStatus(id)
}
