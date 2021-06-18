import OpenEdition from 0x01cf0e2f2f715450

pub fun main(address:Address): { UInt64: OpenEdition.OpenEditionStatus }? {
    let acct = getAccount(address)

    let acctOpenEditionRef = acct.getCapability<&AnyResource{OpenEdition.OpenEditionPublic}>(/public/openEditionCollection)
        .borrow()
        ?? panic("Could not borrow open edition reference")

    return acctOpenEditionRef.getOpenEditionStatuses()
}
