import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import Collectible, OpenEdition from 0x01cf0e2f2f715450

transaction() {

    prepare(acct: AuthAccount) {

        let openEditionCap = acct.getCapability<&{OpenEdition.OpenEditionPublic}>(/public/openEditionCollection)

        if !openEditionCap.check() {
            let minterCap = acct.getCapability<&Collectible.NFTMinter>(/private/CollectibleMinter)!    
            let openEdition <- OpenEdition.createOpenEditionCollection(minterCap: minterCap)        
            acct.save( <-openEdition, to: /storage/openEditionCollection)         
            acct.link<&{OpenEdition.OpenEditionPublic}>(/public/openEditionCollection, target: /storage/openEditionCollection)
            log("Open Edition Collection created for account")
        } 
    }

    execute {}
}
