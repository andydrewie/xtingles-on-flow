transaction {

  prepare(signer: AuthAccount) {
    let x <- signer.load<@AnyResource>(from: /storage/xtinglesEdition)
    destroy x    
  }
}