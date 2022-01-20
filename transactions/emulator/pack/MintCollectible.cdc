import Pack from 0x01cf0e2f2f715450

transaction(      
        editionNumber: UInt64
    ) {
        
    let receiverRef: &{Pack.CollectionPublic}
    let minterRef: &Pack.PackMinter

    prepare(
        acct: AuthAccount     
    ) {
        self.receiverRef = acct.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")        
        
        self.minterRef = acct.borrow<&Pack.NFTMinter>(from: Pack.MinterStoragePath)
            ?? panic("could not borrow minter reference")       
    }

    execute {
              
        let newPack <- self.minterRef.mintNFT(editionNumber: editionNumber)
    
        self.receiverRef.deposit(token: <- newPack)

        log("Pack Minted and deposited to Account's Collection")
    }
}