import NonFungibleToken from "./NonFungibleToken.cdc"

pub contract Collectible: NonFungibleToken {
    // Named Paths   
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath     
    pub let MinterStoragePath: StoragePath

    // Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Created(id: UInt64)

    // totalSupply
    // The total number of NFTs that have been minted
    //
    pub var totalSupply: UInt64

    pub resource interface Public {
        pub let id: UInt64
        pub let metadata: Metadata
        pub let editionNumber: UInt64
        pub fun getEditionNumber(): UInt64
    }

    pub struct Metadata {
        pub let link: String     
        pub let name: String
        pub let author: String
        pub let description: String
        pub (set) var edition: UInt64  
        pub let properties: AnyStruct     

        init(
            link:String,          
            name: String, 
            author: String,      
            description: String,        
            edition: UInt64, 
            properties: AnyStruct
    )  {
            self.link = link             
            self.name = name
            self.author = author            
            self.description = description  
            self.edition = edition 
            self.properties = properties             
        }
    }

    // NFT
    // Collectible as an NFT
    pub resource NFT: NonFungibleToken.INFT, Public {
        // The token's ID
        pub let id: UInt64      

        pub let metadata: Metadata

        pub let editionNumber: UInt64

        // initializer
        //
        init(initID: UInt64, metadata: Metadata, editionNumber: UInt64) {
            self.id = initID   
            self.metadata = metadata     
            self.editionNumber = editionNumber
        }

        pub fun getEditionNumber(): UInt64 {
            return self.editionNumber;
        }
    }

    //Standard NFT collectionPublic interface that can also borrowArt as the correct type
    pub resource interface CollectionPublic {
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT 
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT  
        pub fun borrowCollectible(id: UInt64): &Collectible.NFT? {
            // If the result isn't nil, the id of the returned reference
            // should be the same as the argument to the function
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow collectible reference: The id of the returned reference is incorrect."
            }
        }
        pub fun getEditionNumber(id: UInt64): UInt64
    }

    // Collection
    // A collection of NFTs owned by an account
    //
    pub resource Collection: CollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        // dictionary of NFT conforming tokens
        // NFT is a resource type with an `UInt64` ID field
        //
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        // withdraw
        // Removes an NFT from the collection and moves it to the caller
        //
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token 
        }

        // deposit
        // Takes a NFT and adds it to the collections dictionary
        // and adds the ID to the id array
        //
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @Collectible.NFT

            let id: UInt64 = token.id

            // add the new token to the dictionary which removes the old one
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        // getIDs
        // Returns an array of the IDs that are in the collection
        //
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        pub fun getNFT(id: UInt64): &Collectible.NFT {
            let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
            return ref as! &Collectible.NFT     
        }
  
        pub fun getEditionNumber(id: UInt64): UInt64 {
            let ref = self.getNFT(id: id)

            return ref.getEditionNumber()
        }

        // borrowNFT
        // Gets a reference to an NFT in the collection
        // so that the caller can read its metadata and call its methods
        //
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        pub fun borrowCollectible(id: UInt64): &Collectible.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
                return ref as! &Collectible.NFT
            } else {
                return nil
            }
        }
        
        // destructor
        destroy() {
            destroy self.ownedNFTs
        }

        // initializer
        //
        init () {
            self.ownedNFTs <- {}
        }
    }

    // createEmptyCollection
    // public function that anyone can call to create a new empty collection
    //
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    // mint NFTs for test purposes
    pub resource NFTMinter {
  
        pub fun mintNFT(metadata: Metadata, editionNumber: UInt64): @NFT {
            var newNFT <- create NFT(
                initID: Collectible.totalSupply,
                metadata: Metadata(
                    link: metadata.link,          
                    name: metadata.name, 
                    author: metadata.name,      
                    description: metadata.description,        
                    edition: metadata.edition, 
                    properties: metadata.properties           
                ),
                editionNumber: editionNumber
            )
            emit Created(id: Collectible.totalSupply)

            Collectible.totalSupply = Collectible.totalSupply + UInt64(1)

            return <-newNFT
        }
    }

    // structure for display NFTs data
    pub struct CollectibleData {
        pub let metadata: Collectible.Metadata
        pub let id: UInt64
        init(metadata: Collectible.Metadata, id: UInt64) {
            self.metadata= metadata
            self.id=id
        }
    }

    // get info for NFT including metadata
    pub fun getCollectible(address:Address) : [CollectibleData] {

        var collectibleData: [CollectibleData] = []
        let account = getAccount(address)

        if let CollectibleCollection = account.getCapability(self.CollectionPublicPath).borrow<&{Collectible.CollectionPublic}>()  {
            for id in CollectibleCollection.getIDs() {
                var collectible = CollectibleCollection.borrowCollectible(id: id) 
                collectibleData.append(CollectibleData(
                    metadata: collectible!.metadata,
                    id: id
                ))
            }
        }
        return collectibleData
    } 

    // mint NFT from other contract (auction or fix price)
    access(account) fun mint(metadata: Metadata, editionNumber: UInt64) : @Collectible.NFT {
        var newNFT <- create NFT(
            initID: Collectible.totalSupply,
            metadata: Metadata(
                link: metadata.link,          
                name: metadata.name, 
                author: metadata.name,      
                description: metadata.description,        
                edition: metadata.edition, 
                properties: metadata.properties            
            ),
            editionNumber: editionNumber
        )
        emit Created(id: Collectible.totalSupply)
        
        Collectible.totalSupply = Collectible.totalSupply + UInt64(1)
        return <- newNFT
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 1
        self.CollectionPublicPath = /public/CollectibleCollection
        self.CollectionStoragePath = /storage/CollectibleCollection
        self.MinterStoragePath = /storage/CollectibleMinter

        self.account.save<@NonFungibleToken.Collection>(<- Collectible.createEmptyCollection(), to: Collectible.CollectionStoragePath)
        self.account.link<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath, target: Collectible.CollectionStoragePath)
        
        let minter <- create NFTMinter()         
        self.account.save(<-minter, to: self.MinterStoragePath)
        self.account.link<&Collectible.NFTMinter>(/private/CollectibleMinter, target: self.MinterStoragePath)

        emit ContractInitialized()
	}

}