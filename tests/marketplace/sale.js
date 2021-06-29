import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";

const editionNumber = 1;

export const testSuiteSale = () => describe("MarketPlace list for sale", () => {
  let createEditionTransaction,  
    mintCollectibleTransaction,
    transferCollectibleTransaction,
    initializeNFTStorageTransaction,
    setupFUSDTransaction,
    mintFUSDTransaction,
    setupSaleStorageTransaction,   
    getPriceScript,  
    saleNFTTransaction,
    unlinkFUSDVault;

    beforeAll(async () => {
        jest.setTimeout(120000);

        init(path.resolve(__dirname, "../"));
    
        mintCollectibleTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/MintCollectible.cdc`
            ),
            "utf8"
        );
          
        transferCollectibleTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/TransferNFT.cdc`
            ),
            "utf8"
        );
    
        initializeNFTStorageTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/InitializeNFTStorage.cdc`
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
        
        setupSaleStorageTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/SetupSaleStorage.cdc`
            ),
            "utf8"
        );
            
        getPriceScript = fs.readFileSync(
            path.join(
            __dirname,
            `../../scripts/emulator/GetPriceFromMarketPlace.cdc`
            ),
            "utf8"
        );

        saleNFTTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/marketplace/SaleNFT.cdc`
            ),
            "utf8"
        );

        createEditionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/CreateEdition.cdc`
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
        await deployContractByName({ to: admin, name: "MarketPlace", addressMap });

        // Setup FUSD Vault for the admin account
        await sendTransaction({
            code: setupFUSDTransaction,
            args: [],
            signers: [admin],
        });

        // Mint FUSD for Vault and sent to the admin account
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

        const commission = `{
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
      
        // Create the common edition infromation for all copies of the item
        await sendTransaction({
            code: createEditionTransaction.replace('RoyaltyVariable', commission),
            args: [[1, t.UInt64]], 
            signers: [admin],
        });  

        // Mint NFT
        await sendTransaction({
        code: mintCollectibleTransaction,
        args: [
            ["https://www.ya.ru", t.String],
            ["Great NFT!", t.String],
            ["Brad Pitt", t.String],
            ["Awesome", t.String],
            [1, t.UInt64],
            [editionNumber, t.UInt64],
        ],
            signers: [admin],
        });

        // Initialize NFT storage o the second account
        await sendTransaction({
            code: initializeNFTStorageTransaction,
            args: [],
            signers: [second],
        });

        // Transafer NFT to the second account
        await sendTransaction({
            code: transferCollectibleTransaction,
            args: [
                [second, t.Address],
                [1, t.UInt64]
            ],
            signers: [admin],
        });

        // Transafer NFT to the second account
        await sendTransaction({
            code: setupSaleStorageTransaction,
            args: [],
            signers: [second],
        });  

        await sendTransaction({
            code: initializeNFTStorageTransaction,
            args: [],
            signers: [second],
        });

        done();
    });

    // Stop emulator, so it could be restarted
    afterEach(async (done) => {
        await emulator.stop();
        done();
    });

    test("list for sale throws error, when price is 0", async () => {
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const NFTId = 1;
            const initialSalePrice = 0;
       
            const result = await sendTransaction({
                code: saleNFTTransaction,
                args: [
                    // NFT id
                    [NFTId, t.UInt64],
                    // Price
                    [initialSalePrice.toFixed(2), t.UFix64]
                ],
                signers: [second],
            });                   

            expect(result).toEqual('');
        } catch (e) {     
           error = e;
        }

        expect(error).toMatch(/Price should be more than 0/);
    });  

    test("list for sale throws error, when seller's vault is unreachable", async () => {
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const NFTId = 1;
            const initialSalePrice = 10;

            // Unlink the fourth account FUSD vault to check failed send to sale
            await sendTransaction({
                code: unlinkFUSDVault,
                args: [], 
                signers: [second],
            }); 
       
            const result = await sendTransaction({
                code: saleNFTTransaction,
                args: [
                    // NFT id
                    [NFTId, t.UInt64],
                    // Price
                    [initialSalePrice.toFixed(2), t.UFix64]
                ],
                signers: [second],
            });                   

            expect(result).toEqual('');
        } catch (e) {     
           error = e;
        }

        expect(error).toMatch(/Could not borrow reference to owner token vault/);
    });  

    test("list for sale check events", async () => {
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const NFTId = 1;
            const initialSalePrice = 10;
  
            const result = await sendTransaction({
                code: saleNFTTransaction,
                args: [
                    // NFT id
                    [NFTId, t.UInt64],
                    // Price
                    [initialSalePrice.toFixed(2), t.UFix64]
                ],
                signers: [second],
            });

            //Get sale price 
            const initialPrice = await executeScript({
                code: getPriceScript,
                args: [
                    // Owner of NFT
                    [second, t.Address],
                    // NFT Id
                    [NFTId, t.UInt64]
                ]
            });            
         
            const { events } = result;

            // Check initial price in blockchain
            expect(parseFloat(initialPrice, 10)).toEqual(initialSalePrice);

            // List for sale events
            expect(events[0].type).toEqual(`A.${admin.substr(2)}.Collectible.Withdraw`);
            expect(events[0].data.from).toEqual(second);

            expect(events[1].type).toEqual(`A.${admin.substr(2)}.MarketPlace.ForSale`);
            expect(events[1].data.owner).toEqual(second);     
            expect(parseFloat(events[1].data.price, 10)).toEqual(initialSalePrice);        
        } catch (e) {     
           error = e;
        }

        expect(error).toEqual(undefined);
    });    
});