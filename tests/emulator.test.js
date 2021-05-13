import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

const EMULAGOR_ACCOUNT = '0xf8d6e0586b0a20c7';

import { getAccountAddress } from "flow-js-testing/dist/utils/account";
import { sendTransaction, executeScript } from "flow-js-testing/dist/utils/interaction";

import { init } from "flow-js-testing/dist/utils/init";
import {
  getFlowBalance,
} from "flow-js-testing/dist/utils/flow-token";

beforeAll(() => {
  init(path.resolve(__dirname, "../"));
});

describe("Accounts", () => {
  test("get account FLOW balance of emulator account", async () => {
    const EstimatedBalance = 999999999;
    const actualBalance = await getFlowBalance(EMULAGOR_ACCOUNT);
    expect(parseFloat(actualBalance)).toBeGreaterThanOrEqual(EstimatedBalance);
  });

  test("get account FLOW balance of another account", async () => {
    const EstimatedBalance = 0;
    const account = await getAccountAddress("second-account");
    const actualBalance = await getFlowBalance(account);
    expect(parseFloat(actualBalance)).toBeGreaterThanOrEqual(EstimatedBalance);
  });
});

describe("Contracts", () => {
  let mintASMRTransaction, checkASMRScript;

  beforeAll(async () => {
    mintASMRTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../transactions/MintASMR.cdc`
      ),
      "utf8"    
    );
  
    checkASMRScript = fs.readFileSync(
      path.join(
        __dirname,
        `../scripts/CheckASMR.cdc`
      ),
      "utf8"    
    );
  
    try {
      await sendTransaction({
        code: mintASMRTransaction,
        args: [
          ["xxx", t.String],    
          ["xxx", t.String], 
          ["xxx", t.String], 
          ["xxx", t.String], 
          ["xxx", t.String], 
          [EMULAGOR_ACCOUNT, t.Address], 
          ["xxx", t.String], 
          [1, t.UInt64], 
          [10, t.UInt64], 
        ], 
        signers: [EMULAGOR_ACCOUNT],
      });
    } catch (e) {
      console.log(e);
    }
  });
 
  test("check minted ASMR", async () => {    
    const result = await executeScript({
      code: checkASMRScript,
      args: [
        [EMULAGOR_ACCOUNT, t.Address]
      ] 
    });
    expect(result[0].id).toBe(0);
    expect(result[0].metadata).toEqual(
      {
        "animation": "xxx",
        "artist": "xxx",
        "artistAddress": "0xf8d6e0586b0a20c7",
        "description": "xxx",
        "edition": 1, 
        "maxEdition": 10,
        "name": "xxx",
        "picturePreview": "xxx",
        "url": "xxx"
      })
    }); 
});



