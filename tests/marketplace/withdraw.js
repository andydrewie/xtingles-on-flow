import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";

const editionNumber = 1;

export const testSuiteMarketPlaceWithdraw = () => describe("MarketPlace withdraw", () => {
    let mintCollectibleTransaction,
        checkCollectibleScript,
        checkCollectibleStorageScript,
        checkAllCollectibleScript,
        getNFTIdsScript,
        transferCollectibleTransaction,
        initializeNFTStorageTransaction,
        setupFUSDTransaction,
        mintFUSDTransaction,
        setupSaleStorageTransaction,
        checkSaleStorageScript,   
        getPriceScript,
        getIDsScript,
        saleNFTTransaction,
        cancelSaleTransaction,
        createEditionTransaction;

    beforeAll(async () => {
        jest.setTimeout(30000);

        init(path.resolve(__dirname, "../"));
    
        mintCollectibleTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/MintCollectible.cdc`
            ),
            "utf8"
        );
    
        getNFTIdsScript = fs.readFileSync(
            path.join(
            __dirname,
            `../../scripts/emulator/GetNFTIds.cdc`
            ),
            "utf8"
        );
    
        checkCollectibleScript = fs.readFileSync(
            path.join(
            __dirname,
            `../../scripts/emulator/CheckCollectible.cdc`
            ),
            "utf8"
        );
    
        checkCollectibleStorageScript = fs.readFileSync(
            path.join(
            __dirname,
            `../../scripts/emulator/CheckCollectibleStorage.cdc`
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
            

        checkSaleStorageScript = fs.readFileSync(
            path.join(
            __dirname,
            `../../scripts/emulator/CheckSaleStorage.cdc`
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

        cancelSaleTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/marketplace/CancelSale.cdc`
            ),
            "utf8"
        );

        getIDsScript = fs.readFileSync(
            path.join(
                __dirname,
                `../../scripts/emulator/GetIdsFromMarketPlace.cdc`
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
                // Link to IPFS file
                ["https://www.ya.ru", t.String],
                // Name  
                ["Great NFT!", t.String],
                // Author's name
                ["Brad Pitt", t.String],
                // Description
                ["Awesome", t.String],
                // Number of copy
                [1, t.UInt64],
                // Common number for all copies of the item
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

    test("withdraw throws error, when NFT misses", async () => {
        let error;
        try {
            const second = await getAccountAddress("second");
            const NFTId = 1;
            
            const result = await sendTransaction({
                code: cancelSaleTransaction,
                args: [
                    [NFTId, t.UInt64],     
                ],
                signers: [second],
            })

            expect(result).toEqual('')     

        } catch (e) {  
           error = e;
        }
           expect(error).toMatch(/missing NFT/);
    });  

    test("withdraw function check events", async () => {
        let error;
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const NFTId = 1;
            const initialSalePrice = 10;

            await sendTransaction({
                code: saleNFTTransaction,
                args: [
                    [NFTId, t.UInt64],
                    [initialSalePrice.toFixed(2), t.UFix64]
                ],
                signers: [second],
            });

            //All NFTs on sale
            const saleNFTBefore = await executeScript({
                code: getIDsScript,
                args: [
                    [second, t.Address],
                ]
            });

            // All NFT in storage
            const accountNFTBefore = await executeScript({
                code: getNFTIdsScript,
                args: [
                    [second, t.Address]
                ]
            });
            
            // Cancel sale
            const result = await sendTransaction({
                code: cancelSaleTransaction,
                args: [
                    [NFTId, t.UInt64],     
                ],
                signers: [second],
            })

            // All NFT on sale
            const saleNFTAfter = await executeScript({
                code: getIDsScript,
                args: [
                    [second, t.Address],
                ]
            });

            // All NFT in storage
            const accountNFTAfter = await executeScript({
                code: getNFTIdsScript,
                args: [
                    [second, t.Address]
                ]
            });

            const { events } =  result;

            expect(saleNFTBefore).toContain(NFTId);
            expect(accountNFTBefore).not.toContain(NFTId);

            expect(saleNFTAfter).not.toContain(NFTId);
            expect(accountNFTAfter).toContain(NFTId);

            // Events
            expect(events[0].type).toEqual(`A.${admin.substr(2)}.MarketPlace.SaleWithdrawn`);
            expect(events[0].data.owner).toEqual(second);

        } catch (e) {  
          error = e;
        }

        expect(error).toEqual(undefined);
    });  
});