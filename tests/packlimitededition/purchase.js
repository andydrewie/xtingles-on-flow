import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuitePurchaseLimitedEdition = () => describe("Limited Edition purchase", () => {
    let createPackLimitedEditionTransaction,     
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,       
        purchaseTransaction,
        purchaseFlowTokensTransaction,     
        purchaseLimitedEditionWithoutPackCollectionCapability,
        cancelTransaction,
        purchaseWithSetPriceTransaction,
        commission,
        multiPurchaseTransaction;

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

        purchaseTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/PurchaseLimitedEdition.cdc`
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

       /* purchaseFlowTokensTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openeditionV3/PurchaseOpenEditionWithFlowTokens.cdc`
            ),
            "utf8"
        );   */

        purchaseWithSetPriceTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/PurchaseLimitedEditionWithSetPrice.cdc`
            ),
            "utf8"
        );

        purchaseLimitedEditionWithoutPackCollectionCapability = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/PurchaseLimitedEditionWithoutNFTCollectionCapability.cdc`
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
                
        cancelTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/packlimitededition/CancelLimitedEdition.cdc`
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

    test("purchase throws error, when limited edition does not exist", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");       
            
            const result  = await sendTransaction({
                code: purchaseWithSetPriceTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Open edtion id
                    [1, t.UInt64]
                ], 
                signers: [second],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Limited Edition does not exist/);  
    });

    test("purchase throws error, because limited edition has not started yet", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
            const price = 10;
            const auctionId = 11;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1000).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 
            
            const result  = await sendTransaction({
                code: purchaseTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Open edtion id
                    [auctionId, t.UInt64]
                ], 
                signers: [second],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/The limited edition has not started yet/);  
    }); 

    test("purchase throws error, because pack collection capability is not provided", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
            const price = 10;
            const auctionId = 11;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1000).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],               
                // Max value
                [100, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 
            
            const result  = await sendTransaction({
                code: purchaseLimitedEditionWithoutPackCollectionCapability,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Open edtion id
                    [auctionId, t.UInt64]
                ], 
                signers: [second],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Pack storage does not exist on the account/);  
    }); 

    test("purchase throws error, because limited editon is expired", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
            const price = 10;
            const auctionId = 11;

            const limitedEditionParameters = [
                // Initial price
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
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
            
            const result  = await sendTransaction({
                code: purchaseTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Limited edtion id
                    [auctionId, t.UInt64]
                ], 
                signers: [second],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/The limited edition time expired/);  
    }); 
   
    test("purchase throws error, because limited editon was cancelled", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
            const price = 10;
            const auctionId = 11;

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
            
            await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
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

            // Cancel Limited Edition
            await sendTransaction({
                code: cancelTransaction,
                args: [[auctionId, t.UInt64]], 
                signers: [admin],
            }); 
            
            const result  = await sendTransaction({
                code: purchaseTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Limited edtion id
                    [auctionId, t.UInt64]
                ], 
                signers: [second],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/The limited edition was cancelled/);  
    }); 

    test("purchase throws error, because purchase balance is less than price", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            const third = await getAccountAddress("third");    
            
            const price = 15;
            const auctionId = 11;

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
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
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
            
            const result  = await sendTransaction({
                code: purchaseWithSetPriceTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Open edtion id
                    [auctionId, t.UInt64]
                ], 
                signers: [second],
            });        

            expect(result.errorMessage).toEqual("");

        } catch(e) {
            error = e;
        } 

        expect(error).toMatch(/Not exact amount tokens to buy the pack/);  
    });    

    test("purchase check events during succesfull case", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            const third = await getAccountAddress("third");    
            
            const price = 10;
            const auctionId = 11;

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
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
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
            
            const result  = await sendTransaction({
                code: purchaseTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Limited edtion id
                    [auctionId, t.UInt64]
                ], 
                signers: [second],
            }); 

            const { events } = result;

            const sentNFTevents = events.filter(event => event.type === `A.${admin.substr(2)}.Pack.Deposit`);
            const limitedEditionEarnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.PackLimitedEdition.Earned`);
            const limitedEditionPurchaseEvents = events.filter(event => event.type === `A.${admin.substr(2)}.PackLimitedEdition.Purchase`);

            // NFT sent to buyer events
            expect(sentNFTevents[0].data.to).toEqual(second);
        
            // Commission payments events
            expect(limitedEditionEarnedEvents[0].data.owner).toEqual(third);
            expect(limitedEditionEarnedEvents[1].data.owner).toEqual(admin);

            // Purchase events
            expect(limitedEditionPurchaseEvents[0].data.buyer).toEqual(second);
            expect(parseFloat(limitedEditionPurchaseEvents[0].data.price, 10)).toEqual(price);  
            

        } catch(e) {
            error = e;
        } 

        expect(error).toEqual(undefined);  
    });    
     
    test("purchase throws error, because limited edition exceedes max value", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
            const price = 1;
            const auctionId = 11;

            const limitedEditionParameters = [
                [price.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [2, t.UInt64]
            ];            
            
            await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
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
                    [3, t.UInt64]
                ], 
                signers: [second],
            }); 

           
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Number of minted packs have reached max value/);  
    }); 

    test("multipurchase check events during succesfull case", async () => { 
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
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
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
            
            const result = await sendTransaction({
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
    
            const { events } = result;
    
            const sentNFTevents = events.filter(event => event.type === `A.${admin.substr(2)}.Pack.Deposit`);
            const openEditionPurchaseEvents = events.filter(event => event.type === `A.${admin.substr(2)}.PackLimitedEdition.Purchase`);
    
            // NFT sent to buyer events
            expect(sentNFTevents.length).toEqual(purchasedAmount);    
            
            // Purchase events
            expect(openEditionPurchaseEvents.length).toEqual(purchasedAmount);
    
        } catch(e) {
            error = e;
        } 
    
        expect(error).toEqual(undefined);  
    });
});

