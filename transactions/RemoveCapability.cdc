import Collectible from 0xfc747df8f5e61fcb

transaction {

  prepare(signer: AuthAccount) {
    let x <- signer.load<@Collectible.Collection>(from: /storage/xtinglesNFTCollectibleCollection)
    destroy x    
 
  }
}