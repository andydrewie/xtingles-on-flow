import {
   testSuiteAuction
} from './auction';
import {
   testSuiteAuction as testSuiteAuctionV2
} from './auctionV2';
import { testSuiteCollectible } from "./collectible"
import { testSuiteEdition } from "./edition"
import {
   testSuiteMarketPlace
} from "./marketplace";

import {
   testSuiteOpenEdition
} from "./openedition";

describe('sequentially run tests', () => {
  testSuiteMarketPlace();

   testSuiteCollectible();

   testSuiteEdition(); 
 //  testSuiteAuction();
   testSuiteAuctionV2();

 // testSuiteOpenEdition();
})
