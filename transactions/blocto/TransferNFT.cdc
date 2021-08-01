import Collectible from 0x01547a7e742007d9
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(     
        to: Address,
        id: UInt64   
    ) {
        
    let receiverRef: &{Collectible.CollectionPublic}
    let senderRef: &NonFungibleToken.Collection

    prepare(
        acctSender: AuthAccount     
    ) {
  
        let acctReceiver = getAccount(to)
       
        self.receiverRef = acctReceiver.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")        

        self.senderRef = acctSender.borrow<&NonFungibleToken.Collection>(from: Collectible.CollectionStoragePath)
			?? panic("Could not borrow sender reference")        
     
    }

    execute {
              
        let newNFT <- self.senderRef.withdraw(withdrawID: id)
    
        self.receiverRef.deposit(token: <-newNFT)

        log("NFT withdrew and deposited")
    }
}