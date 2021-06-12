import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

const EMULATOR_ACCOUNT = '0xf8d6e0586b0a20c7';
const SECOND_ACCOUNT = '0x01cf0e2f2f715450';
const THIRD_ACCOUNT = '0x179b6b1cb6755e31';

import { getAccountAddress } from "flow-js-testing";
import { sendTransaction, executeScript } from "flow-js-testing";

import { init } from "flow-js-testing";
import {
  getFlowBalance,
} from "flow-js-testing";

beforeAll(() => {
  init(path.resolve(__dirname, "../"));
});

describe("Account's FLOW balance", () => {
  test("get account FLOW balance of the emulator account", async () => {
    const EstimatedBalance = 999999999;
    const actualBalance = await getFlowBalance(EMULATOR_ACCOUNT);
    expect(parseFloat(actualBalance)).toBeGreaterThanOrEqual(EstimatedBalance);
  });

  test("get account FLOW balance of the second account", async () => {
    const EstimatedMinBalance = 0;
    const EstimatedMaxBalance = 0.1;
    const account = await getAccountAddress(SECOND_ACCOUNT);
    const actualBalance = await getFlowBalance(account);
    expect(parseFloat(actualBalance)).toBeGreaterThan(EstimatedMinBalance);
    expect(parseFloat(actualBalance)).toBeLessThanOrEqual(EstimatedMaxBalance);
  });

  test("get account FLOW balance of the third account", async () => {
    const EstimatedMinBalance = 0;
    const EstimatedMaxBalance = 0.1;
    const account = await getAccountAddress(THIRD_ACCOUNT);
    const actualBalance = await getFlowBalance(account);
    expect(parseFloat(actualBalance)).toBeGreaterThan(EstimatedMinBalance);
    expect(parseFloat(actualBalance)).toBeLessThanOrEqual(EstimatedMaxBalance);
  });
});

describe("Account's FUSD balance", () => {
  let FUSDBalanceScript;
  beforeAll(async () => {      
    FUSDBalanceScript = fs.readFileSync(
      path.join(
        __dirname,
        `../scripts/emulator/FUSDBalance.cdc`
      ),
      "utf8"    
    );   
  });

  test("get account FUSD balance of the emulator account", async () => {
    try {
      const EstimatedBalance = 5000;
      const actualBalance = await executeScript({
        code: FUSDBalanceScript,
        args: [
          [EMULATOR_ACCOUNT, t.Address]
        ] 
      });

      expect(parseFloat(actualBalance)).toBe(EstimatedBalance);
    } catch(e) {
      console.error(e);
    }
  }); 
  
  test("get account FUSD balance of the second account", async () => {
    try {
      const EstimatedBalance = 1000;
      const actualBalance = await executeScript({
        code: FUSDBalanceScript,
        args: [
          [SECOND_ACCOUNT, t.Address]
        ] 
      });

      expect(parseFloat(actualBalance)).toBe(EstimatedBalance);
    } catch(e) {
      console.error(e);
    }
  }); 

  test("get account FUSD balance of the third account", async () => {
    try {
      const EstimatedBalance = 500;
      const actualBalance = await executeScript({
        code: FUSDBalanceScript,
        args: [
          [THIRD_ACCOUNT, t.Address]
        ] 
      });

      expect(parseFloat(actualBalance)).toBe(EstimatedBalance);
    } catch(e) {
      console.error(e);
    }
  }); 
});

describe("Contracts", () => {
  let  mintCollectibleTransaction, checkCollectibleScript, checkAllCollectibleScript, getNFTIdsScript;

  beforeAll(async () => {
    mintCollectibleTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../transactions/emulator/MintCollectible.cdc`
      ),
      "utf8"    
    );
  
    checkAllCollectibleScript = fs.readFileSync(
      path.join(
        __dirname,
        `../scripts/emulator/CheckAllCollectible.cdc`
      ),
      "utf8"    
    ); 

    getNFTIdsScript = fs.readFileSync(
      path.join(
        __dirname,
        `../scripts/emulator/GetNFTIds.cdc`
      ),
      "utf8"    
    ); 

    checkCollectibleScript = fs.readFileSync(
      path.join(
        __dirname,
        `../scripts/emulator/CheckCollectible.cdc`
      ),
      "utf8"    
    ); 
  
  });

  test("check mint function", async () => { 
    try {
      const result = await sendTransaction({
        code: mintCollectibleTransaction,
        args: [
          ["https://www.ya.ru", t.String],    
          ["Great NFT!", t.String], 
          ["Brad Pitt", t.String], 
          ["Awesome", t.String],         
          [1, t.UInt64],
          [3, t.UInt64],
        ], 
        signers: [EMULATOR_ACCOUNT],
      });
      const { events } = result; 
      expect(events[0].type).toEqual('A.f8d6e0586b0a20c7.Collectible.Created');
      expect(events[0].data).toEqual({ id: 0 });
      expect(events[1].type).toEqual('A.f8d6e0586b0a20c7.Collectible.Deposit');
      expect(events[1].data).toEqual({ id: 0, to: '0xf8d6e0586b0a20c7' });
    } catch (e) {
      console.error(e);
    }    
  }); 

  test("check NFT storages", async () => { 

    const checkCollectibleStorageScript = fs.readFileSync(
      path.join(
        __dirname,
        `../scripts/emulator/CheckCollectibleStorage.cdc`
      ),
      "utf8"    
    );

    const result1 = await executeScript({
      code: checkCollectibleStorageScript,
      args: [
        [EMULATOR_ACCOUNT, t.Address]
      ] 
    });

    const result2 = await executeScript({
      code: checkCollectibleStorageScript,
      args: [
        [SECOND_ACCOUNT, t.Address]
      ] 
    });

    const result3 = await executeScript({
      code: checkCollectibleStorageScript,
      args: [
        [THIRD_ACCOUNT, t.Address]
      ] 
    });

    expect(result1).toBe(true);   
    expect(result2).toBe(true); 
    expect(result3).toBe(true); 
  }); 

  test("check all NFT's keys", async () => {      
    const result = await executeScript({
      code: getNFTIdsScript,
      args: [
        [EMULATOR_ACCOUNT, t.Address]
      ] 
    });
    expect(result).toEqual([0]);   
  }); 

  test("check all collectibles in NFT storage", async () => {  
    const result = await executeScript({
      code: checkAllCollectibleScript,
      args: [
        [EMULATOR_ACCOUNT, t.Address]
      ] 
    });
    expect(result[0].id).toBe(0);
    expect(result[0].metadata).toEqual(
      {
        "link": "https://www.ya.ru", 
        "name": "Great NFT!",
        "author": "Brad Pitt",
        "description": "Awesome",
        "edition": 1,      
        "properties": {}
      })
  }); 

  test("check collectible in NFT storage by id", async () => {  

    const result = await executeScript({
      code: checkCollectibleScript,
      args: [
        [EMULATOR_ACCOUNT, t.Address],
        [0, t.UInt64],
      ] 
    });
    
    expect(result.id).toBe(0);
    expect(result.metadata).toEqual(
      {
        "link": "https://www.ya.ru", 
        "name": "Great NFT!",
        "author": "Brad Pitt",
        "description": "Awesome",
        "edition": 1,      
        "properties": {}
      })
  }); 

  test("Collectible with id doesn't exist in account's NFT storage", async () => {  

    try {
      const result = await executeScript({
        code: checkCollectibleScript,
        args: [
          [EMULATOR_ACCOUNT, t.Address],
          [123, t.UInt64],
        ] 
      });
  
      console.log(result)
      
      expect(result).toThrow("");  
    } catch(e) {
      console.error(e)
    }
    
  }); 

  test("check editionNumber", async () => {    
    const checkEditionNumberNFTScript = fs.readFileSync(
      path.join(
        __dirname,
        `../scripts/emulator/CheckEditionNumberNFT.cdc`
      ),
      "utf8"    
    );  
    const result = await executeScript({
      code: checkEditionNumberNFTScript,
      args: [
        [EMULATOR_ACCOUNT, t.Address],
        [0, t.UInt64],
      ] 
    });
    expect(result).toBe(3);
  }); 

  test("transfer collectible", async () => {    
    const transferCollectibleTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../transactions/emulator/TransferNFT.cdc`
      ),
      "utf8"    
    );
    const result = await sendTransaction({
      code: transferCollectibleTransaction,
      args: [
        [SECOND_ACCOUNT, t.Address],    
        [0, t.UInt64]
      ], 
      signers: [EMULATOR_ACCOUNT],
    });
    const { events } = result;
    expect(events[0].type).toEqual('A.f8d6e0586b0a20c7.Collectible.Withdraw');
    expect(events[0].data).toEqual({ id: 0, from: '0xf8d6e0586b0a20c7' });
    expect(events[1].type).toEqual('A.f8d6e0586b0a20c7.Collectible.Deposit');
    expect(events[1].data).toEqual({ id: 0, to: '0x01cf0e2f2f715450' });
  }); 
});