//emulator
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, OpenEdition, Royalty from 0xf8d6e0586b0a20c7

transaction(id: UInt64) {

    let clientOpenEdition: &OpenEdition.OpenEditionCollection
    let clientRoyalty: &Royalty.RoyaltyCollection
    
    prepare(account: AuthAccount) {
        self.clientOpenEdition = account.borrow<&OpenEdition.OpenEditionCollection>(from: /storage/openEditionCollection) ?? panic("could not load admin")
        self.clientRoyalty = account.borrow<&Royalty.RoyaltyCollection>(from: /storage/royaltyCollection) ?? panic("could not load admin")
    }

    execute {
        self.clientOpenEdition.settleOpenEdition(id: id, clientRoyalty: self.clientRoyalty)
    }
}