//emulator
import NonFungibleToken from 0xf8d6e0586b0a20c7
import ASMR from 0xf8d6e0586b0a20c7

/*
  This script will check an address and print out its ASMR resources
 */
pub fun main(address:Address) : [ASMR.ASMRData] {

    let asmr = ASMR.getASMR(address: address)
    
    return asmr
}