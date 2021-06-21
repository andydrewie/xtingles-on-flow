import {
   testSuiteAuction
} from './auction';
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

   //testSuiteCollectible();

   //testSuiteEdition();
  // testSuiteAuction();


   //testSuiteOpenEdition();
})
