import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuitePurchaseOpenEdition = () => describe("Open Edition purchase", () => {
    let createOpenEditionTransaction,     
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,       
        purchaseTransaction,
        purchaseFlowTokensTransaction,     
        purchaseOpenEditionWithoutNFTCollectionCapability,
        cancelTransaction,
        purchaseWithSetPriceTransaction,
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

        purchaseTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openeditionV3/PurchaseOpenEdition.cdc`
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

        purchaseFlowTokensTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openeditionV3/PurchaseOpenEditionWithFlowTokens.cdc`
            ),
            "utf8"
        );   

        purchaseWithSetPriceTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openeditionV3/PurchaseOpenEditionWithSetPrice.cdc`
            ),
            "utf8"
        );

        purchaseOpenEditionWithoutNFTCollectionCapability = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openeditionV3/PurchaseOpenEditionWithoutNFTCollectionCapability.cdc`
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
                `../../transactions/emulator/openeditionV3/CancelOpenEdition.cdc`
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

    test("purchase throws error, when open edition does not exist", async () => { 
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
        expect(error).toMatch(/Open Edition does not exist/);  
    }); 

    test("purchase throws error, because open edition has not started yet", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
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
                [(new Date().getTime() / 1000 + 1000).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
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
        expect(error).toMatch(/The open edition has not started yet/);  
    }); 

    test("purchase throws error, because NFT collection capability is not provided", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
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
                [(new Date().getTime() / 1000 + 1000).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],               
                // Max value
                [100, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createOpenEditionTransaction.replace('RoyaltyVariable', commission),
                args: openEditionParameters, 
                signers: [admin],
            }); 
            
            const result  = await sendTransaction({
                code: purchaseOpenEditionWithoutNFTCollectionCapability,
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
        expect(error).toMatch(/NFT storage does not exist on the account/);  
    }); 

    test("purchase throws error, because open editon is expired", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
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
                // Initial auction length  
                ["1.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64],
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
        expect(error).toMatch(/The open edition time expired/);  
    }); 
   
    test("purchase throws error, because open editon was cancelled", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            
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
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [100, t.UInt64]
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

            // Cancel Open Edition
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
                    // Open edtion id
                    [auctionId, t.UInt64]
                ], 
                signers: [second],
            }); 

            expect(result).toEqual('')
        } catch(e) {
            error = e;
        } 
        expect(error).toMatch(/Open edition was cancelled/);  
    }); 

    test("purchase throws error, because purchase balance is less than price", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            const third = await getAccountAddress("third");    
            
            const price = 15;
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

        expect(error).toMatch(/Not exact amount tokens to buy the NFT/);  
    });    

    test("purchase check events during succesfull case", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            const third = await getAccountAddress("third");    
            
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

            const { events } = result;

            const sentNFTevents = events.filter(event => event.type === `A.${admin.substr(2)}.Collectible.Deposit`);
            const openEditionEarnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEditionV3.Earned`);
            const openEditionPurchaseEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEditionV3.Purchase`);

            // NFT sent to buyer events
            expect(sentNFTevents[0].data.to).toEqual(second);

            // Commission payments events
            expect(openEditionEarnedEvents[0].data.owner).toEqual(third);
            expect(openEditionEarnedEvents[1].data.owner).toEqual(admin);

            // Purchase events
            expect(openEditionPurchaseEvents[0].data.buyer).toEqual(second);
            expect(parseFloat(openEditionPurchaseEvents[0].data.price, 10)).toEqual(price);  

        } catch(e) {
            error = e;
        } 

        expect(error).toEqual(undefined);  
    });    
     
    test("purchase throws error, because open edition exceedes max value", async () => { 
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
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [2, t.UInt64]
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
        expect(error).toMatch(/Number of minted nfts have reached max value/);  
    }); 

    test("purchase succedes any amount, because open edition max value is 0", async () => { 
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
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [0, t.UInt64]
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
        expect(error).toEqual(undefined);   
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
    
            const sentNFTevents = events.filter(event => event.type === `A.${admin.substr(2)}.Collectible.Deposit`);
            const openEditionEarnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEditionV3.Earned`);
            const openEditionPurchaseEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEditionV3.Purchase`);
    
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

