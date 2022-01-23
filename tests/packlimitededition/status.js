import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuiteLimitedEditionStatus = () => describe("Limited Edition status", () => {
    let createLimitedEditionTransaction,
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,        
        limitedEditionStatusesScript,
        limitedEditionStatusScript,
        commission,
        multiPurchaseTransaction;    

    beforeAll(async () => {
        jest.setTimeout(90000);
        init(path.resolve(__dirname, "../"));

        createLimitedEditionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/CreatePackLimitedEdition.cdc`
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
                `../../transactions/emulator/packlimitededition/MultiPurchaseLimitedEdition.cdc`
            ),
            "utf8"
        );

        limitedEditionStatusesScript = fs.readFileSync(
            path.join(
              __dirname,
              `../../scripts/emulator/packlimitededition/LimitedEditionStatuses.cdc`
            ),
            "utf8"
        );

        limitedEditionStatusScript = fs.readFileSync(
            path.join(
                __dirname,
                `../../scripts/emulator/packlimitededition/LimitedEditionStatus.cdc`
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

    test("getLimitedEditionStatuses return nil, when limited edition resource is empty", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            
            const statuses = await executeScript({
                code: limitedEditionStatusesScript,
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

    test("getLimitedEditionStatuses return statuses limited edition", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = '11';

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial sale length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [10, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            const statuses = await executeScript({
                code: limitedEditionStatusesScript,
                args: [
                  [admin, t.Address],       
                ]
            });    

            const status = statuses[auctionId];   
  
            expect(status).toMatchObject({
                id: 11,
                price: '10.00000000',
                active: true,
                completed: false,
                expired: false,
                cancelled: false, 
                numberOfMinted: 0                
            });              

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("getLimitedEditionStatus return nil, when limited edition does not exists", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            
            const status = await executeScript({
                code: limitedEditionStatusScript,
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

    test("getLimitedEditionStatus return status limited edition", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = 11;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial sale length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [10, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            const status = await executeScript({
                code: limitedEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [auctionId, t.UInt64]  
                ]
            });    
            
            expect(status).toMatchObject({
                id: auctionId,
                price: '10.00000000',
                active: true,
                expired: false,
                cancelled: false
            });              

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });

    test("timeRemaining positive and expired is false if limited edition has not expired yet", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = 11;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial sale length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [10, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
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
                code: limitedEditionStatusScript,
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

    test("timeRemaining negative and expired is true if limited edition expired", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const price = 10;
            const auctionId = 11;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial sale length  
                ["1.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [10, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
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
                code: limitedEditionStatusScript,
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

    test("timeRemaining negative and expired is true if limited edition has attained max value", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
            const price = 1;
            const auctionId = 11;

            const limitedEditionParameters = [
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
                code: createLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
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
                code: limitedEditionStatusScript,
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
                code: limitedEditionStatusScript,
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

    test("check status after multipurchase", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            const third = await getAccountAddress("third");    
            
            const price = 1;
            const auctionId = 11;
            const purchasedAmount = 3;
    
            const limitedEditionParameters = [             
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64]
            ];     
            
            const commission = `{
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(${admin}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 7.00,
                    description: "xxx"
                )
            }`;
            
            await sendTransaction({
                code: createLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 
    
            await new Promise((r) => setTimeout(r, 3000));
    
            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 
            
            await sendTransaction({
                code: multiPurchaseTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Open edtion id
                    [auctionId, t.UInt64],
                    [purchasedAmount, t.UInt64]
                ], 
                signers: [second],
            }); 

            // The transaction to change add block with the last timestamp
            await sendTransaction({
                code: tickTransaction,
                args: [], 
                signers: [admin],
            }); 
    
            const status = await executeScript({
                code: limitedEditionStatusScript,
                args: [
                  [admin, t.Address],     
                  [auctionId, t.UInt64]  
                ]
            });    
            
            expect(status).toMatchObject({
                id: auctionId,
                price: '1.00000000',
                active: true,
                expired: false,
                cancelled: false,
                numberOfMinted: purchasedAmount
            });              
    
        } catch(e) {
            error = e;
        } 
    
        expect(error).toEqual(undefined);  
    });
});