import Edition from 0xfc747df8f5e61fcb

pub fun main(address: Address, id: UInt64 ): Edition.EditionStatus? {
    let acct = getAccount(address)

    let editionCollection = acct.getCapability<&{Edition.EditionPublic}>(Edition.CollectionPublicPath).borrow() 
        ?? panic("Could not borrow edition public reference")  

    return editionCollection.getEdition(id)
}