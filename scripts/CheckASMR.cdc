
//emulator
import NonFungibleToken from 0x631e88ae7f1d7c20
import ASMR from  0x9cd9bd78a3826840

/*
  This script will check an address and print out its ASMR resources
 */
pub fun main(address:Address) : [ASMR.ASMRData] {
    // get the accounts' public address objects
    let account = getAccount(address)

    let status = ASMR.getASMR(address: address)
    
    return status
}