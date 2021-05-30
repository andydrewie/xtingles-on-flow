//emulator
import NonFungibleToken from 0xf8d6e0586b0a20c7
import Pack from 0xf8d6e0586b0a20c7

/*
  This script will check an address and print out its pack resources
 */
pub fun main(address:Address) : [Pack.PackData] {

    let pack = Pack.getPack(address: address)
    
    return pack
}