import Collectible from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

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
       
        self.receiverRef = acctReceiver.getCapability<&{Collectible.CollectionPublic}>(/public/CollectibleCollection)
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