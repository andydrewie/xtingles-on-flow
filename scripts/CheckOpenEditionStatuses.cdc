import OpenEdition from 0xf8d6e0586b0a20c7

pub fun main(address:Address): {UInt64: OpenEdition.OpenEditionStatus} {
    let acct = getAccount(address)

    let acctOpenEditionRef = acct.getCapability<&AnyResource{OpenEdition.OpenEditionPublic}>(/public/openEditionCollection)
        .borrow()
        ?? panic("Could not borrow open edition reference")

    return acctOpenEditionRef.getOpenEditionStatuses()
}
