import Edition from 0xf5b0eb433389ac3f

pub fun main(address: Address, id: UInt64 ): Edition.EditionStatus? {
    let acct = getAccount(address)

    let editionCollection = acct.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath).borrow() 
        ?? panic("Could not borrow edition public reference")  

    return editionCollection.getEdition(id)
}