import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuiteSettleOpenEdition = () => describe("Open Edition settle", () => {
    let createOpenEditionTransaction,     
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,
        cancelTransaction,
        openEditionStatusScript,    
        settleTransaction, 
        createOpenEditionResourceTransaction,
        commission;

    beforeAll(async () => {
        jest.setTimeout(90000);
        init(path.resolve(__dirname, "../"));

        createOpenEditionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/CreateOpenEdition.cdc`
            ),
            "utf8"
        );   

        createOpenEditionResourceTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/CreateOpenEditionResource.cdc`
            ),
            "utf8"
        ); 

        cancelTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/CancelOpenEdition.cdc`
            ),
            "utf8"
        );   
                
        settleTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/SettleOpenEdition.cdc`
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

        tickTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/Tick.cdc`
            ),
            "utf8"
        );  

        openEditionStatusScript = fs.readFileSync(
            path.join(
                __dirname,
                `../../scripts/emulator/openedition/OpenEditionStatus.cdc`
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

        commission = `{
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

        await mintFlow(admin, "10.0");
        await mintFlow(second, "10.0");
        await mintFlow(third, "10.0");

        const addressMap = {
            NonFungibleToken: admin,
            FUSD: admin,
            Collectible: admin,
            Edition: admin,
        };

        await deployContractByName({ to: admin, name: "Edition" });
        await deployContractByName({ to: admin, name: "NonFungibleToken" });
        await deployContractByName({ to: admin, name: "FUSD" });
        await deployContractByName({ to: admin, name: "Collectible", addressMap });
        await deployContractByName({ to: admin, name: "OpenEdition", addressMap });

        // Setup open edition resource
        await sendTransaction({
            code: createOpenEditionResourceTransaction,
            args: [],
            signers: [admin],
        });

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

    test("throw error, when open edition does not exist", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
                      
            const result  = await sendTransaction({
                code: settleTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Open Edition does not exist/);  
    });

    test("settle OpenEdition throws error, because open edition was cancelled", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;

            const openEditionParameters = [
                // Link to IPFS
                ["https://www.ya.ru", t.String],
                // Name
                ["Great NFT!", t.String],
                // Author
                ["Brad Pitt", t.String],
                // Description
                ["Awesome", t.String],
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            // Create Open edition
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            // Cancel Open Edition
            await sendTransaction({
                code: cancelTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            await new Promise((r) => setTimeout(r, 3000));

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 

            const result  = await sendTransaction({
                code: settleTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 
      
            expect(result).toEqual('')         
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Open edition was cancelled/);  
    });

    test("settle OpenEdition throws error, because open edition has been settled earlier", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;

            const openEditionParameters = [
                // Link to IPFS
                ["https://www.ya.ru", t.String],
                // Name
                ["Great NFT!", t.String],
                // Author
                ["Brad Pitt", t.String],
                // Description
                ["Awesome", t.String],
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            // Create Open edition
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            });          

            await new Promise((r) => setTimeout(r, 3000));

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 

            // First settle
            await sendTransaction({
                code: settleTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            // Next settle
            const result = await sendTransaction({
                code: settleTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 
    
            expect(result).toEqual('')         
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/The open edition has already settled/);  
    });

    test("settle OpenEdition throws error, because open edition time has not expired yet", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;

            const openEditionParameters = [
                // Link to IPFS
                ["https://www.ya.ru", t.String],
                // Name
                ["Great NFT!", t.String],
                // Author
                ["Brad Pitt", t.String],
                // Description
                ["Awesome", t.String],
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            // Create Open edition
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            });          

            await new Promise((r) => setTimeout(r, 3000));

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 

            // Next settle
            const result = await sendTransaction({
                code: settleTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 
    
            expect(result).toEqual('')         
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Open edtion time has not expired yet/);  
    });

    test("settle check events in successfull case", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;

            const openEditionParameters = [
                // Link to IPFS
                ["https://www.ya.ru", t.String],
                // Name
                ["Great NFT!", t.String],
                // Author
                ["Brad Pitt", t.String],
                // Description
                ["Awesome", t.String],
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            // Create Open edition
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            });          

            await new Promise((r) => setTimeout(r, 3000));

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 

            const statusBefore = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [1, t.UInt64]  
                ]
            });

            // Settle
            const result = await sendTransaction({
                code: settleTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            });

            const statusAfter = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [1, t.UInt64]  
                ]
            });

            const { events } = result;
            
            // Change final amount of copies event
            expect(events[0].type).toEqual(`A.${admin.substr(2)}.Edition.ChangeMaxEdition`);

            // Settle event
            expect(events[1].type).toEqual(`A.${admin.substr(2)}.OpenEdition.Settled`);
            expect(parseFloat(events[1].data.price, 10)).toEqual(price);

            
            expect(statusBefore.completed).toBe(false);
            expect(statusAfter.completed).toBe(true);

            expect(result.errorMessage).toEqual('')         
        } catch(e) {
            error = e;
        } 

        expect(error).toEqual(undefined);  
    });
});