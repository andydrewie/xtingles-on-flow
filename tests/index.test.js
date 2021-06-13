import { testSuiteCreateAuction, testSuiteBidAuction, testSuiteAddNFT } from './auction';
import { testSuiteCollectible } from "./collectible"

describe('sequentially run tests', () => {
    testSuiteCollectible();
    testSuiteCreateAuction();
    testSuiteAddNFT();
    testSuiteBidAuction();
})
