import Collectible, OpenEdition, Edition from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(      
        id: UInt64
    ) {

    let openEditionCollectionRef: &OpenEdition.OpenEditionCollection
    let clientEdition: &Edition.EditionCollection

    prepare(acct: AuthAccount) {

        let editionCap = acct.getCapability<&{Edition.EditionPublic}>(Edition.CollectionPublicPath)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: Edition.CollectionStoragePath)         
            acct.link<&{Edition.EditionPublic}>(Edition.CollectionPublicPath, target: Edition.CollectionStoragePath)
            log("Edition Collection Created for account")
        }  

        let openEditionCap = acct.getCapability<&{OpenEdition.OpenEditionPublic}>(OpenEdition.CollectionPublicPath)

        if !openEditionCap.check() {
            let minterCap = acct.getCapability<&Collectible.NFTMinter>(Collectible.MinterPrivatePath)!    
            let openEdition <- OpenEdition.createOpenEditionCollection(minterCap: minterCap)        
            acct.save( <-openEdition, to: OpenEdition.CollectionStoragePath)         
            acct.link<&{OpenEdition.OpenEditionPublic}>(OpenEdition.CollectionPublicPath, target: OpenEdition.CollectionStoragePath)
            log("Open Edition Collection created for account")
        } 

        self.openEditionCollectionRef = acct.borrow<&OpenEdition.OpenEditionCollection>(from: OpenEdition.CollectionStoragePath)
            ?? panic("could not borrow open edition collection reference")  

        self.clientEdition = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath) ?? panic("could not borrow edition reference")
    }

    execute {    
        self.openEditionCollectionRef.cancelOpenEdition(id: id, clientEdition: self.clientEdition)       
    }
}