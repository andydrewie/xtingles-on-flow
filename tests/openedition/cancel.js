import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuiteCancelOpenEdition = () => describe("Cancel open edition", () => {
    let createOpenEditionTransaction,      
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,
        cancelTransaction,
        settleTransaction,
        openEditionStatusScript, 
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
                code: cancelTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Open Edition does not exist/);  
    });

    test("cancel OpenEdition throws error, because open edition has been cancelled earlier", async () => { 
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

            // Cancel Open Edition the second time
            const result = await sendTransaction({
                code: cancelTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            expect(result).toEqual('')         
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Open edition has been cancelled earlier/);  
    });

    test("cancel OpenEdition throws error, because open edition has been settled", async () => { 
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

            // Settle Open Edition
            await sendTransaction({
                code: settleTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            // Cancel Open Edition
            const result = await sendTransaction({
                code: cancelTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            expect(result).toEqual('')         
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/The open edition has already settled/);  
    });

    test("successfull case of cancel open edition", async () => { 
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

            const statusBefore = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [1, t.UInt64]  
                ]
            });

            // Cancel Open Edition
            const result  = await sendTransaction({
                code: cancelTransaction,
                args: [[1, t.UInt64]], 
                signers: [admin],
            }); 

            const { events } = result;

            const statusAfter = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [1, t.UInt64]  
                ]
            });
            
            expect(events[0].type).toEqual(`A.${admin.substr(2)}.Edition.ChangeMaxEdition`);
            expect(events[1].type).toEqual(`A.${admin.substr(2)}.OpenEdition.Canceled`);
            expect(statusBefore.cancelled).toBe(false);
            expect(statusAfter.cancelled).toBe(true);
        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });
});