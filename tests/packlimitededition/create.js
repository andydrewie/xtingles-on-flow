import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuiteCreatePackLimitedEdition = () => describe("Pack Limited Edition create", () => {
    let createPackLimitedEditionTransaction,        
        setupFUSDTransaction,    
        mintFUSDTransaction,
        createPackLimitedEditionWithFakePlatformVault,
        createPackLimitedEditionWithoutCommissionInfo,
        tickTransaction,
        commission;

    beforeAll(async () => {
        jest.setTimeout(90000);
        init(path.resolve(__dirname, "../"));

        createPackLimitedEditionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/CreatePackLimitedEdition.cdc`
            ),
            "utf8"
        );   

        createPackLimitedEditionWithFakePlatformVault = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/CreatePackLimitedEditionWithFakePlatformVault.cdc`
            ),
            "utf8"
        );   

        createPackLimitedEditionWithoutCommissionInfo = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/CreatePackLimitedEditionWithoutCommissionInfo.cdc`
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
            Pack: admin,
            Edition: admin,
            PackLimitedEdition: admin,            
        };

        await deployContractByName({ to: admin, name: "Edition" });
        await deployContractByName({ to: admin, name: "NonFungibleToken" });
        await deployContractByName({ to: admin, name: "FUSD" });
        await deployContractByName({ to: admin, name: "Pack", addressMap });
        await deployContractByName({ to: admin, name: "PackLimitedEdition", addressMap });

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

    test("throw error, when pack limited edition price is 0.00", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

            const limitedEditionParameters = [
                // Price
                ["0.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Price should be more than 0.00/);  
    });

    test("throw error, when pack limited edition price is more than 999999.99", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

            const extraPrice = 1000000;

            const limitedEditionParameters = [
                // Price
                ["1000000.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                [extraPrice.toFixed(2), t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Price should be less than 1 000 000.00/);  
    });   

    test("throw error, when start time is in the past", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

            const limitedEditionParameters = [
                // Initial price
                ["10.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 - 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
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

            const limitedEditionParameters = [
                // Initial price
                ["10.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionWithFakePlatformVault.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
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

            const limitedEditionParameters = [
                // Initial price
                ["10.00", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionWithoutCommissionInfo.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Edition doesn't exist/);  
    });

    test("throw error, when pack limited edition max number is 0", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;

            const limitedEditionParameters = [
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [0, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionWithoutCommissionInfo.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Max amount of packs should be more than 0/);   
    });

    test("there is no error, when limited edition length is 0.00", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");

            const price = 10;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["0.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            const { events } = result;

            const limitedEditionCreateEvents = events.filter(event => event.type === `A.${admin.substr(2)}.PackLimitedEdition.Created`);
            expect(result.errorMessage).toEqual('');
            expect(limitedEditionCreateEvents.length).toEqual(1);
        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("successfull case of creation pack limited edition when maxValue is 100", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            const result  = await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            const { events } = result;

            const limitedEditionCreateEvents = events.filter(event => event.type === `A.${admin.substr(2)}.PackLimitedEdition.Created`);
            expect(result.errorMessage).toEqual('');
            expect(limitedEditionCreateEvents.length).toEqual(1);
            expect(parseFloat(limitedEditionCreateEvents[0].data.price, 10)).toEqual(price);

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    }); 
});