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

import {
   testSuiteOpenEdition as testSuiteOpenEditionV3
} from "./openeditionV3";

import {
   testSuitePackLimitedEdition as testSuitePackLimitedEdition
} from "./packlimitededition";

describe('sequentially run tests', () => {
   //testSuiteMarketPlace();

   testSuiteCollectible();

  /* testSuiteEdition(); 
   testSuiteAuction();
   testSuiteAuctionV2();
   testSuiteOpenEditionV3();
   testSuiteOpenEdition();  */
 // testSuitePackLimitedEdition();


})
