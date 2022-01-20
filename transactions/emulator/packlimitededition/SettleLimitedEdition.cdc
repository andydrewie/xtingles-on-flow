import PackLimitedEdition, Edition from 0x01cf0e2f2f715450
import FungibleToken  from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(id: UInt64) {
    let clientLimitedEdition: &PackLimitedEdition.LimitedEditionCollection
    
    prepare(acct: AuthAccount) {
  
        self.clientLimitedEdition = acct.borrow<&PackLimitedEdition.LimitedEditionCollection>(from: PackLimitedEdition.CollectionStoragePath) ?? panic("could not borrow limited edition reference")   
    }

    execute {
        self.clientLimitedEdition.settleLimitedEdition(id: id)
    }
}
