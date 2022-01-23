import Pack from 0x2695ea898b04f0c0

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
        
        self.minterRef = acct.borrow<&Pack.PackMinter>(from: Pack.MinterStoragePath)
            ?? panic("could not borrow minter reference")       
    }

    execute {
              
        let newPack <- self.minterRef.mintPack(editionNumber: editionNumber)
    
        self.receiverRef.deposit(token: <- newPack)

        log("Pack Minted and deposited to Account's Collection")
    }
}