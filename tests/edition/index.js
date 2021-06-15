import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";
import {  DefaultCommission } from './constants';

export const testSuiteEdition = () => describe("Edition", () => {
  let createEditionTransaction;     

  beforeAll(async () => {
    init(path.resolve(__dirname, "../"));

    createEditionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateEdition.cdc`
      ),
      "utf8"    
    );   
  });

  beforeEach(async (done) => {
    const basePath = path.resolve(__dirname, "../../");
    const port = 8081;
    init(basePath, port);

  	await emulator.start(port, false);
    const admin = await getAccountAddress("admin");

    await mintFlow(admin, "10.0");    
    await deployContractByName({ to: admin, name: "Edition" });
		done();
	});

	// Stop emulator, so it could be restarted
	afterEach(async (done) => {
		await emulator.stop();
		done();
	});

  test("throw panic when firstRoyalty does not equal 100%", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commission = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 2.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 9.00,
            secondSalePercent: 7.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commission),
        args: [], 
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/The first summary sale percent should be 100 %/);
    }    
  }); 

  test("throw panic when secondRoyalty more 100%", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commission = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 45.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 76.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commission),
        args: [], 
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/The second summary sale percent should be less than 100 %/);
    }    
  }); 

  test("successfull edition creation", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const result = await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', DefaultCommission),
        args: [], 
        signers: [admin],
      });  
      console.log(result)
      const { events } = result;
      expect(result.errorMessage).toBe('');
      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Edition.CreateEdition`);
    } catch (e) {
      console.log(e) 
      expect(e).toEqual('');
    }    
  }); 

  test("getEditon function", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', DefaultCommission),
        args: [], 
        signers: [admin],
      });  
   
      
    } catch (e) {
      expect(e).toEqual('');
    }    
  }); 
}); 