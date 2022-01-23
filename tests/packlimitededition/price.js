import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";

export const testSuitePackLimitedPrice = () => describe("Pack LImited Edition price", () => {
    let createPackLimitedEditionTransaction,
        setupFUSDTransaction,
        mintFUSDTransaction,   
        packLimitedEditionPriceScript,
        commission;

    beforeAll(async () => {
        jest.setTimeout(60000);
        init(path.resolve(__dirname, "../"));

        createPackLimitedEditionTransaction = fs.readFileSync(
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

        packLimitedEditionPriceScript = fs.readFileSync(
            path.join(
                __dirname,
                `../../scripts/emulator/packlimitededition/PackLimitedEditionPrice.cdc`
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

    test("getPrice return nil, when open edition does not exists", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            
            const status = await executeScript({
                code: packLimitedEditionPriceScript,
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

    test("getPrice return price Open Edition", async () => { 
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const initialPrice = 10;
            const auctionId = 11;

            const limitedEditionParameters = [
                // Initial price
                [initialPrice.toFixed(2), t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Initial auction length  
                ["1000.00", t.UFix64],
                // Platftom address
                [admin, t.Address],
                // Max value
                [10, t.UInt64],
            ];            
            
            await sendTransaction({
                code: createPackLimitedEditionTransaction.replace('RoyaltyVariable', commission),
                args: limitedEditionParameters, 
                signers: [admin],
            }); 

            const limitedEditionPrice = await executeScript({
                code: packLimitedEditionPriceScript,
                args: [
                  [admin, t.Address],     
                  [auctionId, t.UInt64]  
                ]
            });    
            
            expect(parseFloat(limitedEditionPrice, 10)).toEqual(initialPrice);              

        } catch(e) {
            error = e;
        } 
        expect(error).toEqual(undefined);  
    });
});