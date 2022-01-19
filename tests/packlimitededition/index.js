import { testSuiteCreatePackLimitedEdition } from "./create";
import { testSuitePackLimitedPrice } from "./price";

export const testSuitePackLimitedEdition = () => describe("Pack limited edition", () => {
  //testSuiteCreatePackLimitedEdition();
  testSuitePackLimitedPrice();
});