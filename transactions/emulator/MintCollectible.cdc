import Collectible from 0x01cf0e2f2f715450

transaction(
        link: String,          
        name: String, 
        author: String,      
        description: String,        
        edition: UInt64,
        editionNumber: UInt64
    ) {
        
    let receiverRef: &{Collectible.CollectionPublic}
    let minterRef: &Collectible.NFTMinter
    let metadata: Collectible.Metadata

    prepare(
        acct: AuthAccount     
    ) {
        self.receiverRef = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")        
        
        self.minterRef = acct.borrow<&Collectible.NFTMinter>(from: Collectible.MinterStoragePath)
            ?? panic("could not borrow minter reference")

        self.metadata = Collectible.Metadata(
            link: link,
            name: name,           
            author: author, 
            description: description,     
            edition: edition,
            properties: {}
        )
    }

    execute {
              
        let newNFT <- self.minterRef.mintNFT(metadata: self.metadata, editionNumber: editionNumber)
    
        self.receiverRef.deposit(token: <-newNFT)

        log("NFT Minted and deposited to Account's Collection")
    }
}