import NonFungibleToken, Pack from 0x01cf0e2f2f715450

transaction(     
        to: Address,
        id: UInt64   
    ) {
        
    let receiverRef: &{Pack.CollectionPublic}
    let senderRef: &NonFungibleToken.Collection

    prepare(
        acctSender: AuthAccount     
    ) {
  
        let acctReceiver = getAccount(to)
       
        self.receiverRef = acctReceiver.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")        

        self.senderRef = acctSender.borrow<&NonFungibleToken.Collection>(from: Pack.CollectionStoragePath)
			?? panic("Could not borrow sender reference")        
     
    }

    execute {
              
        let newPack <- self.senderRef.withdraw(withdrawID: id)
    
        self.receiverRef.deposit(token: <- newPack)

        log("Pack withdrew and deposited")
    }
}