import Collectible, OpenEditionV3, Edition from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(      
        id: UInt64
    ) {

    let openEditionCollectionRef: &OpenEditionV3.OpenEditionCollection
    let clientEdition: &Edition.EditionCollection

    prepare(acct: AuthAccount) {
   
        self.openEditionCollectionRef = acct.borrow<&OpenEditionV3.OpenEditionCollection>(from: OpenEditionV3.CollectionStoragePath)
            ?? panic("could not borrow open edition collection reference")  

        self.clientEdition = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath) ?? panic("could not borrow edition reference")
    }

    execute {    
        self.openEditionCollectionRef.cancelOpenEdition(id: id, clientEdition: self.clientEdition)       
    }
}