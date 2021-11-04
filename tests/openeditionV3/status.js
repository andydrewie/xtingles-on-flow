import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuiteOpenEditionStatus = () => describe("Open Edition status", () => {
    let createOpenEditionTransaction,
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,        
        openEditionStatusesScript,
        openEditionStatusScript,
        commission,
        multiPurchaseTransaction;    

    beforeAll(async () => {
        jest.setTimeout(90000);
        init(path.resolve(__dirname, "../"));

        createOpenEditionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openeditionV3/CreateOpenEdition.cdc`
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

        multiPurchaseTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openeditionV3/MultiPurchaseOpenEdition.cdc`
            ),
            "utf8"
        );

        openEditionStatusesScript = fs.readFileSync(
            path.join(
              __dirname,
              `../../scripts/emulator/openeditionV3/OpenEditionStatuses.cdc`
            ),
            "utf8"
        );

        openEditionStatusScript = fs.readFileSync(
            path.join(
                __dirname,
                `../../scripts/emulator/openeditionV3/OpenEditionStatus.cdc`
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
        await deployContractByName({ to: admin, name: "OpenEditionV3", addressMap });

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

    test("getOpenEditionStatuses return nil, when open edition resource is empty", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            
            const statuses = await executeScript({
                code: openEditionStatusesScript,
                args: [
                  [admin, t.Address],       
                ]
            }); 
            
            expect(statuses).toEqual(null)
        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("getOpenEditionStatuses return statuses Open Edition", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = '11';

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
                // Initial sale length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [0, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            const statuses = await executeScript({
                code: openEditionStatusesScript,
                args: [
                  [admin, t.Address],       
                ]
            });    

            const status = statuses[auctionId];   
  
            expect(status).toMatchObject({
                id: 11,
                price: '10.00000000',
                active: true,
                metadata: {
                    link: 'https://www.ya.ru',
                    name: 'Great NFT!',
                    author: 'Brad Pitt',
                    description: 'Awesome',
                    edition: 0,
                    properties: {}
                }, 
                completed: false,
                expired: false,
                cancelled: false                   
            });              

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("getOpenEditionStatus return nil, when open edition does not exists", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            
            const status = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],       
                  [1, t.UInt64]
                ]
            }); 
            
            expect(status).toEqual(null)
        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("getOpenEditionStatus return status Open Edition", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = 11;

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
                // Initial sale length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [0, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 

            const status = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [auctionId, t.UInt64]  
                ]
            });    
            
            expect(status).toMatchObject({
                id: auctionId,
                price: '10.00000000',
                active: true,
                metadata: {
                    link: 'https://www.ya.ru',
                    name: 'Great NFT!',
                    author: 'Brad Pitt',
                    description: 'Awesome',
                    edition: 0,
                    properties: {}
                },
                completed: false,
                expired: false,
                cancelled: false
            });              

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("timeRemaining positive and expired is false if open edition has not expired yet", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = 11;

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
                // Initial sale length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [0, t.UInt64],
            ];            
            
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

            const status = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [auctionId, t.UInt64]  
                ]
            });    

            expect(status.expired).toEqual(false);
            expect(parseFloat(status.timeRemaining, 10)).toBeGreaterThan(0); 

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("timeRemaining negative and expired is true if open edition expired", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = 11;

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
                // Initial sale length  
                ["1.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [0, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 
         
            await (new Promise((r) => setTimeout(r, 5000)));

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 
            
            const status = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [auctionId, t.UInt64]  
                ]
            });    

            expect(status.expired).toEqual(true);
            expect(parseFloat(status.timeRemaining, 10)).toBeLessThan(0); 

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("timeRemaining negative and expired is true if open edition has attained max value", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
            const price = 1;
            const auctionId = 11;

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
                ["100000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [3, t.UInt64]
            ];            
            
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
                  [auctionId, t.UInt64]  
                ]
            });   

            await sendTransaction({
                code: multiPurchaseTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Open edtion id
                    [auctionId, t.UInt64],
                    [3, t.UInt64]
                ], 
                signers: [second],
            }); 

            await new Promise((r) => setTimeout(r, 5000));

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            });       

            await new Promise((r) => setTimeout(r, 5000));

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            });     

            const statusAfter = await executeScript({
                code: openEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [auctionId, t.UInt64]  
                ]
            });   
                        
            expect(statusBefore.expired).toEqual(false);
            expect(parseFloat(statusBefore.timeRemaining, 10)).toBeGreaterThan(10000);

            expect(statusAfter.expired).toEqual(true);
            expect(parseFloat(statusAfter.timeRemaining, 10)).toBeLessThan(0); 
           
        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });
});