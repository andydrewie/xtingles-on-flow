import { testSuiteCreateAuction, testSuiteBidAuction, testSuiteAddNFT } from './auction';
import { testSuiteCollectible } from "./collectible"
import { testSuiteEdition } from "./edition"

describe('sequentially run tests', () => {
   // testSuiteCollectible();
   // testSuiteEdition()
   //  testSuiteCreateAuction();
   // testSuiteAddNFT();
   testSuiteBidAuction();
})
