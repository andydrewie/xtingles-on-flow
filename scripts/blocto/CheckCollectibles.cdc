import Collectible, Edition from 0x1bc62b2c04dfd147

pub struct CollectibleFullData {
      pub let metadata: Collectible.Metadata
      pub let id: UInt64
      pub let maxEdition: UInt64
      init(metadata: Collectible.Metadata, id: UInt64, maxEdition: UInt64) {
          self.metadata= metadata
          self.id=id 
          self.maxEdition=maxEdition
      }
  }

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address, editionAccountAddress: Address) : [CollectibleFullData] {

    var collectibleFullData: [CollectibleFullData] = []

    let collectibles = Collectible.getCollectibleDatas(address: address)

    let account = getAccount(editionAccountAddress) 

    let editionCollection = account.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath).borrow() 
        ?? panic("Could not borrow edition public reference")  

    for collectible in collectibles {
        let edition = editionCollection.getEdition(collectible.editionNumber)  
        collectibleFullData.append(CollectibleFullData(
            metadata: collectible!.metadata,
            id: collectible.id,
            maxEdition: edition!.maxEdition
        ))
    }
    
    return collectibleFullData
}