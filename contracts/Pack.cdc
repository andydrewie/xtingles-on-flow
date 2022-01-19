import NonFungibleToken from "./NonFungibleToken.cdc"
import Edition from "./Edition.cdc"

pub contract Pack: NonFungibleToken {
    // Named Paths   
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath     
    pub let MinterStoragePath: StoragePath
    pub let MinterPrivatePath: PrivatePath

    // Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Created(id: UInt64)
    pub event Unpack(id: UInt64, from: Address?)

    // totalSupply
    // The total number of NFTs that have been minted
    pub var totalSupply: UInt64

    pub resource interface Public {
        pub let id: UInt64
        // Common number for pack for one purchase
        pub let editionNumber: UInt64
    }

    // Pack as an NFT
    pub resource NFT: NonFungibleToken.INFT, Public {
        // The token's ID
        pub let id: UInt64      

        // Common number for all copies of the item
        pub let editionNumber: UInt64

        // initializer
        init(initID: UInt64, editionNumber: UInt64) {
            self.id = initID    
            self.editionNumber = editionNumber
        }
    }

    //Standard Pack collectionPublic interface that can also borrowArt as the correct type
    pub resource interface CollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        // Common number for all copies of the item
        pub fun getEditionNumber(id: UInt64): UInt64?
    }

    // Collection
    // A collection of NFTs owned by an account
    //
    pub resource Collection: CollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        // dictionary of NFT conforming tokens
        // NFT is a resource type with an `UInt64` ID field
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        // withdraw
        // Removes an NFT from the collection and moves it to the caller
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token 
        }

        // deposit
        // Takes a NFT and adds it to the collections dictionary
        // and adds the ID to the id array
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @Pack.NFT

            let id: UInt64 = token.id

            // add the new token to the dictionary which removes the old one
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        // Unpack and destroy packNFT. Backend application gets unpack event and mint NFT for user
        pub fun unpack(packId: UInt64) {

            let token <- self.ownedNFTs.remove(key: packId) ?? panic("missing pack")

            let id: UInt64 = token.id

            destroy token

            emit Unpack(id: id, from: self.owner?.address)    
        }


        // getIDs
        // Returns an array of the IDs that are in the collection
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        pub fun getPack(id: UInt64): &Pack.NFT {        
            let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
            return ref as! &Pack.NFT     
        }
  
        // Common number for all copies of the item
        pub fun getEditionNumber(id: UInt64): UInt64? {
            if self.ownedNFTs[id] == nil { 
                return nil
            }

            let ref = self.getPack(id: id)

            return ref.editionNumber
        }

        // borrowNFT
        // Gets a reference to an NFT in the collection
        // so that the caller can read its metadata and call its methods
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }
       
        // destructor
        destroy() {
            destroy self.ownedNFTs
        }

        // initializer
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

    pub resource PackMinter {
  
        pub fun mintPack(editionNumber: UInt64): @NFT {
            let editionRef = Pack.account.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath).borrow()! 

            // Check edition info in contract Edition in order to manage commission
            assert(editionRef.getEdition(editionNumber) != nil, message: "Edition does not exist")
        
            var newNFT <- create NFT(
                initID: Pack.totalSupply,
                editionNumber: editionNumber
            )

            emit Created(id: Pack.totalSupply)

            Pack.totalSupply = Pack.totalSupply + UInt64(1)

            return <-newNFT
        }
    }

    // structure for display packs data
    pub struct PackData {
        pub let id: UInt64
        pub let editionNumber: UInt64
        init(id: UInt64, editionNumber: UInt64) {
            self.id=id
            self.editionNumber=editionNumber
        }
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 1
        self.CollectionPublicPath = /public/bloctoXtinglesPackCollection
        self.CollectionStoragePath = /storage/bloctoXtinglesPackCollection
        self.MinterStoragePath = /storage/bloctoXtinglesPackMinter
        self.MinterPrivatePath = /private/bloctoXtinglesPackMinter

        self.account.save<@NonFungibleToken.Collection>(<- Pack.createEmptyCollection(), to: Pack.CollectionStoragePath)
        self.account.link<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath, target: Pack.CollectionStoragePath)
        
        let minter <- create PackMinter()         
        self.account.save(<-minter, to: self.MinterStoragePath)
        self.account.link<&Pack.PackMinter>(self.MinterPrivatePath, target: self.MinterStoragePath)

        emit ContractInitialized()
	}
}