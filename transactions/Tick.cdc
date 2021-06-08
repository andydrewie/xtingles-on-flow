
transaction() {
    prepare(account: AuthAccount) {    
        let block = getCurrentBlock()      
        log("currentBlock=".concat(block.height.toString()).concat( " currentTime=").concat(block.timestamp.toString()))
    }
}