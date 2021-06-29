import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";

export const testSuiteChangeCommission = () => describe("Edition change commission", () => {
    let createEditionTransaction, 
        getEditionScript,
        changeCommissionTransaction,
        setupFUSDTransaction,
        mintFUSDTransaction;     

    beforeAll(async () => {
        jest.setTimeout(90000);
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

        setupFUSDTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/SetupFUSD.cdc`
            ),
            "utf8"
        );

        mintFUSDTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/MintFUSD.cdc`
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
        const second = await getAccountAddress("second");
        const third = await getAccountAddress("third");

        await mintFlow(admin, "10.0");    
        
        await deployContractByName({ to: admin, name: "Edition" });
        await deployContractByName({ to: admin, name: "FUSD" });

        // Setup FUSD Vault
        await sendTransaction({
            code: setupFUSDTransaction,
            args: [],
            signers: [admin],
        });

        // Mint FUSD for Vault
        await sendTransaction({
            code: mintFUSDTransaction,
            args: [
                ["500.00", t.UFix64], [admin, t.Address]
            ],
            signers: [admin],
        });

        // Setup FUSD Vault for the second account
        await sendTransaction({
            code: setupFUSDTransaction,
            args: [],
            signers: [second],
        });

        // Mint FUSD for Vault and sent to the second account
        await sendTransaction({
            code: mintFUSDTransaction,
            args: [
                ["500.00", t.UFix64], [second, t.Address]
            ],
            signers: [admin],
        });

        // Setup FUSD Vault for the third account
        await sendTransaction({
            code: setupFUSDTransaction,
            args: [],
            signers: [third],
        });

        // Mint FUSD for Vault and sent to the third account
        await sendTransaction({
            code: mintFUSDTransaction,
            args: [
                ["500.00", t.UFix64], [third, t.Address]
            ],
            signers: [admin],
        });
        
        done();
    });

	// Stop emulator, so it could be restarted
	afterEach(async (done) => {
		await emulator.stop();
		done();
	});

    test("changeCommission throws error, when edition does not exist during changeCommission", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commission = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 5.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 6.00,
                    description: "xxx"
                )          
            }`;

            const result = await sendTransaction({
                code: changeCommissionTransaction.replace('RoyaltyVariable', commission),
                args: [[1, t.UInt64]], 
                signers: [admin],
            });  

            expect(result).toEqual('');

        } catch (e) {
            error = e;
        }  
           expect(error).toMatch(/Edition does not exist/);  
    }); 


    test("changeCommission throws error, when summary firstRoalty is not 100%", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commissionCreate = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 5.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 6.00,
                    description: "xxx"
                )          
            }`;

            const commissionChange = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
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

            const result = await sendTransaction({
                code: changeCommissionTransaction.replace('RoyaltyVariable', commissionChange),
                args: [[1, t.UInt64]], 
                signers: [admin],
            });  

            expect(result).toEqual('');

        } catch (e) {
            error = e;            
        } 
        expect(error).toMatch(/The first summary sale percent should be 100 %/);   
    }); 

    test("changeCommission throws error, when summary secondRoalty is not less 100%", async () => {
        let error; 
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commissionCreate = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 5.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 6.00,
                    description: "xxx"
                )          
            }`;

            const commissionChange = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 29.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 77.00,
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

            expect(result).toEqual('');

        } catch (e) {
            error = e;            
        } 
            expect(error).toMatch(/The second summary sale percent should be less than 100 %/);  
    }); 

    test("changeCommission throws error, when account does not have fusd vault link capability", async () => {
        let error; 
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");
            const fourth = await getAccountAddress("fourh");

            const commissionCreate = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 5.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 6.00,
                    description: "xxx"
                )          
            }`;

            const commissionChange = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 29.00,
                    description: "xxx"
                ),
                Address(${fourth}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 77.00,
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

            expect(result).toEqual('');

        } catch (e) {
            error = e;            
        }             
            expect(error).toMatch(/Account 0xe03daebed8ca0615 does not provide fusd vault capability/);  
    }); 

    test("check events changeCommission successfull case", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commissionCreate = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 5.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 6.00,
                    description: "xxx"
                )          
            }`;

            const commissionChange = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 2.00,
                    secondSalePercent: 9.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 98.00,
                    secondSalePercent: 7.00,
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
            error = e;
        }    
        expect(error).toEqual(undefined);
    });  
});