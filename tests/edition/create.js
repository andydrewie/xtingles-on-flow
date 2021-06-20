import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";

export const testSuiteCreateEdition = () => describe("Create edition", () => {
    let createEditionTransaction, 
        getEditionScript,
        setupFUSDTransaction,
        mintFUSDTransaction;     

    beforeAll(async () => {
        jest.setTimeout(60000);
        init(path.resolve(__dirname, "../"));

        createEditionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/CreateEdition.cdc`
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

    test("createEdition throws error, when firstRoyalty does not equal 100%", async () => { 
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commission = `{
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
                code: createEditionTransaction.replace('RoyaltyVariable', commission),
                args: [[1, t.UInt64]], 
                signers: [admin],
            });  

        } catch (e) {
            expect(e).toMatch(/The first summary sale percent should be 100 %/);
        }    
    }); 

    test("createEdition throws error, when secondRoyalty more 100% during creation", async () => { 
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commission = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 45.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
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

    test("createEdition throws error, when account does not have fusd vault link capability", async () => { 
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commission = `{
                Address(0x2695ea898b04f0c0) : Edition.CommissionStructure(
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

            await sendTransaction({
                code: createEditionTransaction.replace('RoyaltyVariable', commission),
                args: [[1, t.UInt64]], 
                signers: [admin],
            });  

        } catch (e) {
            expect(e).toMatch(/Account 0x2695ea898b04f0c0 does not provide fusd vault capability/);
        }    
    }); 

    test("successfull edition creation", async () => { 
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
                code: createEditionTransaction.replace('RoyaltyVariable', commission),
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
  
});