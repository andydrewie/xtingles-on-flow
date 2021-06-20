import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuiteCreateOpenEdition = () => describe("Create open edition", () => {
    let createOpenEditionTransaction,        
        setupFUSDTransaction,    
        mintFUSDTransaction,
        createOpenEditionWithFakePlatformVault,
        createOpenEditionWithoutCommissionInfo,
        tickTransaction,
        commission;

    beforeAll(async () => {
        jest.setTimeout(60000);
        init(path.resolve(__dirname, "../"));

        createOpenEditionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/CreateOpenEdition.cdc`
            ),
            "utf8"
        );   

        createOpenEditionWithFakePlatformVault = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/CreateOpenEditionWithFakePlatformVault.cdc`
            ),
            "utf8"
        );   

        createOpenEditionWithoutCommissionInfo = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/CreateOpenEditionWithoutCommissionInfo.cdc`
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

    test("throw error, when open edition price is 0.00", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

            const openEditionParameters = [
                // Link to IPFS
                ["https://www.ya.ru", t.String],
                // Name
                ["Great NFT!", t.String],
                // Author
                ["Brad Pitt", t.String],
                // Description
                ["Awesome", t.String],
                // Price
                ["0.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            const result  = await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Price should be more than 0.00/);  
    });

    test("throw error, when open edition length is 0.00", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

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
                ["10.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["0.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            const result  = await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Sale lenght should be more than 0.00/);  
    });

    test("throw error, when start time is in the past", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

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
                ["10.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 - 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            const result  = await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Start time can't be in the past/);  
    });

    test("throw error, when platform vault is unreachable", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

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
                ["10.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            const result  = await sendTransaction({
                code: createOpenEditionWithFakePlatformVault.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Platform vault should be reachable/);  
    });

    test("throw error, when editionNumber does not point to actual resource", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

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
                ["10.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address]
            ];            
            
            const result  = await sendTransaction({
                code: createOpenEditionWithoutCommissionInfo.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Edition doesn't exist/);  
    });

    test("successfull case of creation open edition", async () => { 
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
            
            const result  = await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            const { events } = result;

            const openEditionCreateEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEdition.Created`);
            expect(result.errorMessage).toEqual('');
            expect(openEditionCreateEvents.length).toEqual(1);
            expect(parseFloat(openEditionCreateEvents[0].data.price, 10)).toEqual(price);

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });
});