import NonFungibleToken from "./NonFungibleToken.cdc"

pub contract Pack: NonFungibleToken {
    // Named Paths
    //
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath     
    pub let MinterStoragePath: StoragePath

    // Events
    //
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Created(id: UInt64, metadata: Metadata)

    // totalSupply
    // The total number of NFTs that have been minted
    //
    pub var totalSupply: UInt64

    pub resource interface Public {
        pub let id: UInt64
        pub let metadata: Metadata
    }

    pub struct Metadata {
        pub let url: String
        pub let picturePreview: String
        pub let animation: String
        pub let name: String
        pub let artist: String
        pub let artistAddress:Address
        pub let description: String
        pub let edition: UInt64    
        pub let maxEdition: UInt64    

        init(
            url:String,
            picturePreview:String,
            animation: String,
            name: String, 
            artist: String,
            artistAddress:Address, 
            description: String,        
            edition: UInt64,
            maxEdition: UInt64
        ) {
                self.url=url
                self.animation=animation
                self.picturePreview=picturePreview
                self.name=name
                self.artist=artist
                self.artistAddress=artistAddress
                self.description=description  
                self.edition=edition       
                self.maxEdition=edition         
        }
    }

    // NFT
    // Pack as an NFT
    //
    pub resource NFT: NonFungibleToken.INFT, Public {
        // The token's ID
        pub let id: UInt64      

        pub let metadata: Metadata

        // initializer
        //
        init(initID: UInt64, metadata: Metadata) {
            self.id = initID   
            self.metadata = metadata 
        }
    }

    //Standard NFT collectionPublic interface that can also borrowArt as the correct type
    pub resource interface CollectionPublic {
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT 
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT  
        pub fun borrowPack(id: UInt64): &Pack.NFT? {
            // If the result isn't nil, the id of the returned reference
            // should be the same as the argument to the function
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow collectible reference: The id of the returned reference is incorrect."
            }
        }
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
            let token <- token as! @Pack.NFT

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

        pub fun getNFT(id: UInt64): &Pack.NFT {
            let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
            return ref as! &Pack.NFT     
        }
  
          // borrowNFT
        // Gets a reference to an NFT in the collection
        // so that the caller can read its metadata and call its methods
        //
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        pub fun borrowPack(id: UInt64): &Pack.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
                return ref as! &Pack.NFT
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
  
        pub fun mintNFT(metadata: Metadata): @NFT {
            var newNFT <- create NFT(
                initID: Pack.totalSupply,
                metadata: Metadata(
                    url: metadata.url,
                    picturePreview: metadata.picturePreview,
                    animation: metadata.animation,
                    name: metadata.name, 
                    artist: metadata.artist,
                    artistAddress: metadata.artistAddress, 
                    description: metadata.description,        
                    edition: metadata.edition,
                    maxEdition: metadata.maxEdition                 
                ) 
            )
            emit Created(id: Pack.totalSupply, metadata: newNFT.metadata)

            Pack.totalSupply = Pack.totalSupply + UInt64(1)

            return <- newNFT
        }
    }

    // structure for display NFTs data
    pub struct PackData {
        pub let metadata: Pack.Metadata
        pub let id: UInt64
        init(metadata: Pack.Metadata, id: UInt64) {
            self.metadata = metadata
            self.id=id
        }
    }

    // get info for NFT including metadata
    pub fun getPack(address:Address) : [PackData] {

        var packData: [PackData] = []
        let account = getAccount(address)

        if let PackCollection= account.getCapability(self.CollectionPublicPath).borrow<&{Pack.CollectionPublic}>()  {
            for id in PackCollection.getIDs() {
                var Pack = PackCollection.borrowPack(id: id) 
                packData.append(PackData(
                    metadata: Pack!.metadata,
                    id: id
                ))
            }
        }
        return packData
    } 

    // mint NFT from other contract (auction or fix price)
    access(account) fun mint(metadata: Metadata) : @Pack.NFT {
        var newNFT <- create NFT(
            initID: Pack.totalSupply,
            metadata: Metadata(
                url: metadata.url,
                picturePreview: metadata.picturePreview,
                animation: metadata.animation,
                name: metadata.name, 
                artist: metadata.artist,
                artistAddress: metadata.artistAddress, 
                description: metadata.description,        
                edition: metadata.edition,
                maxEdition: metadata.maxEdition                       
            )
        )
        emit Created(id: Pack.totalSupply, metadata: newNFT.metadata)
        
        Pack.totalSupply = Pack.totalSupply + UInt64(1)
        return <- newNFT
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 0
        self.CollectionPublicPath = /public/PackCollection
        self.CollectionStoragePath = /storage/PackCollection
        self.MinterStoragePath = /storage/PackMinter

        self.account.save<@NonFungibleToken.Collection>(<- Pack.createEmptyCollection(), to: Pack.CollectionStoragePath)
        self.account.link<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath, target: Pack.CollectionStoragePath)
        
 
        let minter <- create NFTMinter()         
        self.account.save(<-minter, to: self.MinterStoragePath)
        self.account.link<&Pack.NFTMinter>(/private/PackMinter, target: self.MinterStoragePath)

        emit ContractInitialized()
	}

}