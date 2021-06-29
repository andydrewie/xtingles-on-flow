import { testSuiteCreateEdition } from "./create";
import { testSuiteGetEdition } from "./get";
import { testSuiteChangeCommission } from "./changeCommission";
import { testSuiteChangeMaxEdition } from "./changeMaxEdition";

export const testSuiteEdition = () => describe("Edition", () => {
   testSuiteCreateEdition();
   testSuiteChangeCommission();
   testSuiteChangeMaxEdition();
   testSuiteGetEdition();
 });