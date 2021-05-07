//emulator
import NonFungibleToken from 0x631e88ae7f1d7c20
import MarketPlace from  0x175e958cf586f54c

/*
  This script will check an address and print out its ASMR resources
 */
pub fun main(address:Address) : [MarketPlace.SaleData] {
    // get the accounts' public address objects
    let account = getAccount(address)

    let status = MarketPlace.getASMR(address: address)
    
    return status
}