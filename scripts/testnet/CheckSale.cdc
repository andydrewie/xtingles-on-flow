import MarketPlace from 0xfc747df8f5e61fcb

pub fun main(address:Address): [MarketPlace.SaleData] {

    let status = MarketPlace.getCollectible(address: address)

    return status
}