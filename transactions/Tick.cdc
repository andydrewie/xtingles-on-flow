import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction() {
    prepare(account: AuthAccount) {    
        let block = getCurrentBlock()      
        log("currentBlock=".concat(block.height.toString()).concat( " currentTime=").concat(block.timestamp.toString()))
    }
}