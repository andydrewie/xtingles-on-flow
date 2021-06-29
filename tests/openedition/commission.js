import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuiteCommissionPaymentsOpenEdition = () => describe("Open Edition commission", () => {
    let createOpenEditionTransaction,     
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,      
        purchaseTransaction,
        createOpenEditionResourceTransaction,
        purchaseOpenEditionWithoutNFTCollectionCapability,
        unlinkFUSDVault;
    
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

        purchaseTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/PurchaseOpenEdition.cdc`
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

        purchaseOpenEditionWithoutNFTCollectionCapability = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/openedition/PurchaseOpenEditionWithoutNFTCollectionCapability.cdc`
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
                
        unlinkFUSDVault = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/UnlinkFUSDVault.cdc`
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

    test("commission payments check events during failed pay commission", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            const third = await getAccountAddress("third");    
            
            const price = 10;
            const authorPercent = 1;
            const platformPercent = 99;

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
            
            const commission = `{
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: ${authorPercent.toFixed(2)},
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(${admin}) : Edition.CommissionStructure(
                    firstSalePercent: ${platformPercent.toFixed(2)},
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

            // Unlink third account FUSD vault to check failed payment events
            await sendTransaction({
                code: unlinkFUSDVault,
                args: [], 
                signers: [third],
            }); 
            
            const result  = await sendTransaction({
                code: purchaseTransaction,
                args: [
                    // Platftom address
                    [admin, t.Address],
                    // Open edtion id
                    [1, t.UInt64]
                ], 
                signers: [second],
            }); 

            const { events } = result;

            const earnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEdition.Earned`);     

            const failEarnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEdition.FailEarned`);    

            const tokensDepositedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.FUSD.TokensDeposited`);     
            
            // Earned events. All tokens are sent to platform vault
            expect(earnedEvents.length).toEqual(1);
            expect(earnedEvents[0].data.owner).toEqual(admin);
         
            // Failt earned events
            expect(failEarnedEvents[0].data.owner).toEqual(third);       
            
            // Token deposited events. All tokens are sent to platform vault
            expect(tokensDepositedEvents.length).toEqual(1);
            expect(tokensDepositedEvents[0].data.to).toEqual(admin);
            expect(parseFloat(tokensDepositedEvents[0].data.amount, 10)).toEqual(price);
          
        } catch(e) {
            error = e;
        } 

        expect(error).toEqual(undefined);  
    });    

    test("commission payments check events during succesfull case", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");    
            const second = await getAccountAddress("second");    
            const third = await getAccountAddress("third");    
            
            const price = 10;
            const authorPercent = 1;
            const platformPercent = 99;

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
            
            const commission = `{
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: ${authorPercent.toFixed(2)},
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(${admin}) : Edition.CommissionStructure(
                    firstSalePercent: ${platformPercent.toFixed(2)},
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
                    [1, t.UInt64]
                ], 
                signers: [second],
            }); 

            const { events } = result;

            const earnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEdition.Earned`);     

            const failEarnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.OpenEdition.FailEarned`);  

            const tokensDepositedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.FUSD.TokensDeposited`);     
            
            // Earned events
            expect(earnedEvents[0].data.owner).toEqual(third);
            expect(earnedEvents[1].data.owner).toEqual(admin);  

            // Fail earned events
            expect(failEarnedEvents.length).toEqual(0);
            
            // Token deposited events
            expect(tokensDepositedEvents[0].data.to).toEqual(third);
            expect(parseFloat(tokensDepositedEvents[0].data.amount, 10)).toEqual(price * authorPercent * 0.01);
            expect(tokensDepositedEvents[1].data.to).toEqual(admin);   
            expect(parseFloat(tokensDepositedEvents[1].data.amount, 10)).toEqual(price * platformPercent * 0.01);

        } catch(e) {
            error = e;
        } 

        expect(error).toEqual(undefined);  
    });    
});