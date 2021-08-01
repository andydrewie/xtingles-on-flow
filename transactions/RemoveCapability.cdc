import Collectible from 0x85080f371da20cc1

transaction {

  prepare(signer: AuthAccount) {
    let x <- signer.load<@Collectible.Collection>(from: /storage/xtinglesCollectibleCollection)
    destroy x    
 
  }
}