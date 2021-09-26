transaction {

  prepare(signer: AuthAccount) {
    signer.unlink(/public/bloctoXtinglesCollectibleCollection) 
  }
}