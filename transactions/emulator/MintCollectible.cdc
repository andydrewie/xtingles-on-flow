import Collectible from 0xf8d6e0586b0a20c7

transaction(
        link: String,          
        name: String, 
        author: String,      
        description: String,        
        edition: UInt64   
    ) {
        
    let receiverRef: &{Collectible.CollectionPublic}
    let minterRef: &Collectible.NFTMinter
    let metadata: Collectible.Metadata

    prepare(
        acct: AuthAccount     
    ) {
        self.receiverRef = acct.getCapability<&{Collectible.CollectionPublic}>(/public/CollectibleCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference")        
        
        self.minterRef = acct.borrow<&Collectible.NFTMinter>(from: /storage/CollectibleMinter)
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
              
        let newNFT <- self.minterRef.mintNFT(metadata: self.metadata, editionNumber: 4)
    
        self.receiverRef.deposit(token: <-newNFT)

        log("NFT Minted and deposited to Account's Collection")
    }
}