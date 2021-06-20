import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";
import {  DefaultCommission } from './constants';

export const testSuiteEdition = () => describe("Edition", () => {
  let createEditionTransaction, 
      getEditionScript,
      changeCommissionTransaction,
      changeMaxEditionTransaction;     

  beforeAll(async () => {
    init(path.resolve(__dirname, "../"));

    createEditionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateEdition.cdc`
      ),
      "utf8"    
    );  

    changeCommissionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/ChangeCommission.cdc`
      ),
      "utf8"    
    );  

    getEditionScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/GetEdition.cdc`
      ),
      "utf8"    
    );  

    changeMaxEditionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/ChangeMaxEdition.cdc`
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

  test("throw panic when firstRoyalty does not equal 100% during creation", async () => { 
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
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/The first summary sale percent should be 100 %/);
    }    
  }); 

  test("throw panic when secondRoyalty more 100% during creation", async () => { 
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
        args: [[1, t.UInt64]], 
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
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  
      const { events } = result;
      expect(result.errorMessage).toBe('');
      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Edition.CreateEdition`);
    } catch (e) {
      expect(e).toEqual('');
    }    
  }); 


  test("getEditon function returns nil, when edition doesn't exists", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const result = await executeScript({
        code: getEditionScript,
        args: [
          [admin, t.Address],
          [1, t.UInt64]
        ] 
      });

      console.log(result)

    } catch (e) {
      expect(e).toEqual('');
    }    
  }); 


  test("getEditon function successfull case", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', DefaultCommission),
        args: [[0, t.UInt64]], 
        signers: [admin],
      });  

      const result = await executeScript({
        code: getEditionScript,
        args: [
          [admin, t.Address],
          [1, t.UInt64]
        ] 
      });

      expect(result).toEqual({
        royalty: {
          '0xf8d6e0586b0a20c7': {
            firstSalePercent: '1.00000000',
            secondSalePercent: '5.00000000',
            description: 'xxx'
          },
          '0x179b6b1cb6755e31': {
            firstSalePercent: '99.00000000',
            secondSalePercent: '7.00000000',
            description: 'xxx'
          }
        },
        editionId: 1,
        maxEdition: 0
      });
      
    } catch (e) {
      expect(e).toEqual('');
    }    
  }); 

  test("throw panic when edition doesn't exist during changeCommission", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionChange = `{
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
        code: changeCommissionTransaction.replace('RoyaltyVariable', commissionChange),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/Edition doesn't exist/);
    }    
  }); 


  test("throw panic when firstRoalty is not 100% during changeCommission", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionCreate = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      const commissionChange = `{
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
        code: createEditionTransaction.replace('RoyaltyVariable', commissionCreate),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

      await sendTransaction({
        code: changeCommissionTransaction.replace('RoyaltyVariable', commissionChange),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/The first summary sale percent should be 100 %/);
    }    
  }); 

  test("throw panic when secondRoalty is not less 100% during changeCommission", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionCreate = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      const commissionChange = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 92.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 17.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commissionCreate),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

      await sendTransaction({
        code: changeCommissionTransaction.replace('RoyaltyVariable', commissionChange),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/The second summary sale percent should be less than 100 %/);
    }    
  }); 

  test("changeCommission successfull case", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionCreate = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      const commissionChange = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 3.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 17.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commissionCreate),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

      const result = await sendTransaction({
        code: changeCommissionTransaction.replace('RoyaltyVariable', commissionChange),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  

      const { events } = result;
      expect(result.errorMessage).toBe('');
      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Edition.ChangeCommision`);

    } catch (e) {
      expect(e).toEqual('');
    }    
  }); 

  test("throw panic in changeMaxEdition, when edition does not exist", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionChange = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;
           
      await sendTransaction({
        code: changeMaxEditionTransaction .replace('RoyaltyVariable', commissionChange),
        args: [
          [1, t.UInt64],
          [1, t.UInt64]
        ],  
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/Edition doesn't exist/);
    }    
  }); 

  test("throw panic in changeMaxEdition, when firstRoalty is not 100% during changeCommission", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionCreate = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      const commissionChange = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 97.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commissionCreate),
        args: [[0, t.UInt64]], 
        signers: [admin],
      });  
           
      await sendTransaction({
        code: changeMaxEditionTransaction .replace('RoyaltyVariable', commissionChange),
        args: [
          [1, t.UInt64],
          [1, t.UInt64]
        ],    
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/The first summary sale percent should be 100 %/);
    }    
  }); 

  test("throw panic in changeMaxEdition, when secondRoalty is not less 100% during changeCommission", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionCreate = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      const commissionChange = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 3.00,
            secondSalePercent: 99.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 97.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commissionCreate),
        args: [[0, t.UInt64]], 
        signers: [admin],
      });  
           
      await sendTransaction({
        code: changeMaxEditionTransaction .replace('RoyaltyVariable', commissionChange),
        args: [
          [1, t.UInt64],
          [1, t.UInt64]
        ],   
        signers: [admin],
      });  

    } catch (e) {
      expect(e).toMatch(/The second summary sale percent should be less than 100 %/);
    }    
  }); 

  test("throw panic, when the previous maxEdition more than ", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionCreate = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      const commissionChange = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 3.00,
            secondSalePercent: 9.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 97.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commissionCreate),
        args: [[1, t.UInt64]], 
        signers: [admin],
      });  
           
      const result = await sendTransaction({
        code: changeMaxEditionTransaction.replace('RoyaltyVariable', commissionChange),
        args: [
          [1, t.UInt64],
          [10, t.UInt64]
        ],    
        signers: [admin],
      });  

      console.log(result);

    } catch (e) {
      expect(e).toMatch(/You could not change max edition/);
    }    
  }); 

  test("successfull case in changeMaxEdition", async () => { 
    try {
      const admin = await getAccountAddress("admin");

      const commissionCreate = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 5.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      const commissionChange = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 3.00,
            secondSalePercent: 9.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 97.00,
            secondSalePercent: 6.00,
            description: "xxx"
        )          
      }`;

      await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commissionCreate),
        args: [[0, t.UInt64]], 
        signers: [admin],
      });  
           
      const result = await sendTransaction({
        code: changeMaxEditionTransaction.replace('RoyaltyVariable', commissionChange),
        args: [
          [1, t.UInt64],
          [1, t.UInt64]
        ],    
        signers: [admin],
      });  

      console.log(result);

      const { events } = result;
      expect(result.errorMessage).toBe('');
      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Edition.ChangeMaxEdition`);

    } catch (e) {
      expect(e).toEqual('');
    }    
  }); 
});