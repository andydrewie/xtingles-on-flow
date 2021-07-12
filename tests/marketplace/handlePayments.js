import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";

const editionNumber = 1;

export const testSuitePayments = () => describe("MarketPlace Payments", () => {
  let createEditionTransaction, 
    getEditionScript,
    changeCommissionTransaction,
    changeMaxEditionTransaction,
    mintCollectibleTransaction,
    checkCollectibleScript,
    checkCollectibleStorageScript,
    checkAllCollectibleScript,
    getNFTIdsScript,
    checkEditionNumberNFTScript,
    transferCollectibleTransaction,
    initializeNFTStorageTransaction,
    setupFUSDTransaction,
    mintFUSDTransaction,
    setupSaleStorageTransaction,
    checkSaleStorageScript,
    changePriceTransaction,
    getPriceScript,
    getIDsScript,
    borrowCollectibleFromSaleScript,
    getEditionNumberMarketPlaceScript,
    saleNFTTransaction,
    cancelSaleTransaction,
    buyNFTNoOnMarketPlaceTransaction,
    buyNFTWithWrongPriceTransaction,
    buyNFTTransaction,
    unlinkFUSDVault,
    unlinkCollectible,
    buyNFTWithWrongRecepientCap;

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
  
      checkAllCollectibleScript = fs.readFileSync(
        path.join(
          __dirname,
          `../../scripts/emulator/CheckAllCollectible.cdc`
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
  
      checkEditionNumberNFTScript = fs.readFileSync(
        path.join(
          __dirname,
          `../../scripts/emulator/CheckEditionNumberNFT.cdc`
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
          
      changePriceTransaction = fs.readFileSync(
        path.join(
          __dirname,
          `../../transactions/emulator/marketplace/ChangePriceMarketPlace.cdc`
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

      getIDsScript = fs.readFileSync(
        path.join(
          __dirname,
          `../../scripts/emulator/GetIdsFromMarketPlace.cdc`
        ),
        "utf8"
      );

      borrowCollectibleFromSaleScript = fs.readFileSync(
        path.join(
          __dirname,
          `../../scripts/emulator/BorrowCollectibleFromSale.cdc`
        ),
        "utf8"
      );      

      borrowCollectibleFromSaleScript = fs.readFileSync(
        path.join(
          __dirname,
          `../../scripts/emulator/BorrowCollectibleFromSale.cdc`
        ),
        "utf8"
      );    

        getEditionNumberMarketPlaceScript = fs.readFileSync(
            path.join(
            __dirname,
            `../../scripts/emulator/GetEditionNumberMarketPlace.cdc`
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

        cancelSaleTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/marketplace/CancelSale.cdc`
            ),
            "utf8"
        );

        buyNFTNoOnMarketPlaceTransaction = fs.readFileSync(
            path.join(
            __dirname,
            `../../transactions/emulator/marketplace/BuyNFTNoOnMarketPlace.cdc`
            ),
            "utf8"
        );

        buyNFTWithWrongPriceTransaction = fs.readFileSync(
          path.join(
          __dirname,
          `../../transactions/emulator/marketplace/BuyNFTWithWrongPrice.cdc`
          ),
          "utf8"
        );

        buyNFTTransaction = fs.readFileSync(
          path.join(
          __dirname,
          `../../transactions/emulator/marketplace/BuyNFT.cdc`
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

        unlinkCollectible = fs.readFileSync(
          path.join(
              __dirname,
              `../../transactions/emulator/UnlinkCollectible.cdc`
          ),
          "utf8"
        ); 

        buyNFTWithWrongRecepientCap = fs.readFileSync(
          path.join(
              __dirname,
              `../../transactions/emulator/marketplace/BuyNFTWithWrongRecepientCap.cdc`
          ),
          "utf8"
        ); 

        getEditionScript = fs.readFileSync(
          path.join(
              __dirname,
              `../../scripts/emulator/GetEdition.cdc`
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
    const fourth = await getAccountAddress("fourth");

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

    // Setup FUSD Vault for the fourth account
    await sendTransaction({
        code: setupFUSDTransaction,
        args: [],
        signers: [fourth],
    });

    // Mint FUSD for Vault and sent to the fourth account
    await sendTransaction({
        code: mintFUSDTransaction,
        args: [
            ["500.00", t.UFix64], [fourth, t.Address]
        ],
        signers: [admin],
    });

    const commission = `{
      Address(${second}) : Edition.CommissionStructure(
          firstSalePercent: 1.00,
          secondSalePercent: 5.00,
          description: "AUTHOR"
      ),
      Address(${third}) : Edition.CommissionStructure(
          firstSalePercent: 99.00,
          secondSalePercent: 6.00,
          description: "PLATFORM"
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

  test("handle payments check events", async () => {
    let error;
    try {
        const admin = await getAccountAddress("admin");
        const second = await getAccountAddress("second");
        const third = await getAccountAddress("third");
        const fourth = await getAccountAddress("fourth");
        const typePayment1 = "AUTHOR";
        const typePayment2 = "PLATFORM";

        const NFTId = 1;
        const initialSalePrice = 15;

        // Sell NFT
        await sendTransaction({
          code: saleNFTTransaction,
          args: [
            [NFTId, t.UInt64],
            [initialSalePrice.toFixed(2), t.UFix64]
          ],
          signers: [second],
        });

        // Buy NFT
        const result = await sendTransaction({
            code: buyNFTTransaction,
            args: [
                // owner NFT
                [second, t.Address],  
                // NFT id
                [NFTId, t.UInt64],     
            ],
            signers: [fourth],
        })     
       
        // Common information for all copies 
        const editionInfo = await executeScript({
          code: getEditionScript,
              args: [
              [admin, t.Address],
              [editionNumber, t.UInt64]
          ] 
        });

        const { royalty } = editionInfo;

        const thirdAccountPercent = parseFloat(royalty[third.toString()].secondSalePercent, 10);
        const secondAccountPercent = parseFloat(royalty[second.toString()].secondSalePercent, 10);

        const { events } = result;

        console.log(events);

        const FUSDDepositedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.FUSD.TokensDeposited`);
        const marketPlaceEarnedEvents = events.filter(event => event.type === `A.${admin.substr(2)}.MarketPlace.Earned`);
       
        // Commission payments events
        // the first commission recepient
        expect(parseFloat(marketPlaceEarnedEvents[0].data.amount, 10)).toEqual(initialSalePrice * secondAccountPercent / 100);
        expect(marketPlaceEarnedEvents[0].data.owner).toEqual(second);
        expect(marketPlaceEarnedEvents[0].data.type).toEqual(typePayment1);
        // the second commission recepient
        expect(parseFloat(marketPlaceEarnedEvents[1].data.amount, 10)).toEqual(initialSalePrice * thirdAccountPercent / 100);
        expect(marketPlaceEarnedEvents[1].data.owner).toEqual(third);
        expect(marketPlaceEarnedEvents[1].data.type).toEqual(typePayment2);

        // FUSD deposit events
        // the first commission recepient
        expect(parseFloat(FUSDDepositedEvents[0].data.amount, 10)).toEqual(initialSalePrice * secondAccountPercent / 100);
        expect(FUSDDepositedEvents[0].data.to).toEqual(second);
        // the second commission recepient
        expect(parseFloat(FUSDDepositedEvents[1].data.amount, 10)).toEqual(initialSalePrice * thirdAccountPercent / 100);
        expect(FUSDDepositedEvents[1].data.to).toEqual(third);
        // FUSD tokens to seller
        expect(parseFloat(FUSDDepositedEvents[2].data.amount, 10)).toEqual(initialSalePrice * (100 - secondAccountPercent - thirdAccountPercent) / 100);
        expect(FUSDDepositedEvents[2].data.to).toEqual(second);
       
    } catch (e) {  
      error = e;
    }

    expect(error).toEqual(undefined);
  });  
  
});