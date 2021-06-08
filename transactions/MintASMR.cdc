import ASMR from 0xf8d6e0586b0a20c7

transaction(
        link: String,          
        name: String, 
        author: String,      
        description: String,        
        edition: UInt64   
    ) {
    let receiverRef: &{ASMR.CollectionPublic}
    let minterRef: &ASMR.NFTMinter
    let metadata: ASMR.Metadata

    prepare(
        acct: AuthAccount     
    ) {
        self.receiverRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference")        
        
        self.minterRef = acct.borrow<&ASMR.NFTMinter>(from: /storage/ASMRMinter)
            ?? panic("could not borrow minter reference")

        self.metadata = ASMR.Metadata(
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