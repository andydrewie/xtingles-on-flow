
//emulator
import NonFungibleToken, ASMR from 0xf8d6e0586b0a20c7

/*
  This script will check an address and print out its ASMR resources
 */
pub fun main(address:Address) : [ASMR.ASMRData] {
    // get the accounts' public address objects
    let account = getAccount(address)

    let status = ASMR.getASMR(address: address)
    
    return status
}