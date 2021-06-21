import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";

const editionNumber = 1;

export const testSuiteMarketPlaceCommon = () => describe("MarketPlace Common", () => {
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
    cancelSaleTransaction;

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
          `../../transactions/emulator/ChangePriceMarketPlace.cdc`
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
          `../../transactions/emulator/SaleNFT.cdc`
        ),
        "utf8"
      );

      cancelSaleTransaction = fs.readFileSync(
        path.join(
          __dirname,
          `../../transactions/emulator/CancelSale.cdc`
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

  test("return true that a sale storage exists for the second account", async () => {
    let error;
    try {
      const second = await getAccountAddress("second");

      const saleStorageExist = await executeScript({
        code: checkSaleStorageScript ,
        args: [
            [second, t.Address]  
        ]
      });
    
      expect(saleStorageExist).toBe(true);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(undefined);
  });

  test("return nil for idPrice, when get price of non-existent sale", async () => {
    let error;
    try {
      const second = await getAccountAddress("second");

      const price = await executeScript({
        code: getPriceScript,
        args: [
          [second, t.Address],
          [1, t.UInt64]
        ]
      }); 
      
      console.log(price);

      expect(price).toEqual(null);
    } catch (e) {
      console.log(e);
      error = e;
    }
    expect(error).toEqual(undefined);
  }); 
  
  test("return empty array for getIDs, when sales do not exist on account", async () => {
    let error;
    try {
      const second = await getAccountAddress("second");

      const keys = await executeScript({
        code: getIDsScript,
        args: [
          [second, t.Address],
        ]
      }); 

      expect(keys).toEqual([]);
    } catch (e) {
      console.log(e);
      error = e;
    }
    expect(error).toEqual(undefined);
  });  

  test("return nil, when get reference of non-existent NFT by function borrowCollectible", async () => {
    let error;
    try {
      const second = await getAccountAddress("second");

      const price = await executeScript({
        code: borrowCollectibleFromSaleScript,
        args: [
          [second, t.Address],
          [1, t.UInt64]
        ]
      }); 
      
      expect(price).toEqual(null);
    } catch (e) {
      console.log(e);
      error = e;
    }
    expect(error).toEqual(undefined);
  }); 

  test("return nil, when get edition number of non-existent NFT by function getEditionNumber", async () => {
    let error;
    try {
      const second = await getAccountAddress("second");

      const editionNumber = await executeScript({
        code: getEditionNumberMarketPlaceScript,
        args: [
          [second, t.Address],
          [1, t.UInt64]
        ]
      }); 
      
      expect(editionNumber).toEqual(null);
    } catch (e) {
      console.log(e);
      error = e;
    }
    expect(error).toEqual(undefined);
  }); 

  test("sent NFT to Sale by listForSale", async () => {
    let error;

    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");
      const NFTId = 1;
      const salePrice = 10;

      const result = await sendTransaction({
        code: saleNFTTransaction,
        args: [
          [NFTId, t.UInt64],
          [salePrice.toFixed(2), t.UFix64]
        ],
        signers: [second],
      });

      const { events } = result;

      // Borrrow NFT from sale storage and see NFT's data
      const collectibleData = await executeScript({
        code: borrowCollectibleFromSaleScript,
        args: [
          [second, t.Address],
          [NFTId, t.UInt64]
        ]
      }); 

      //Get sale price 
      const price = await executeScript({
        code: getPriceScript,
        args: [
          [second, t.Address],
          [NFTId, t.UInt64]
        ]
      });

      //All NFTs on sale
      const keys = await executeScript({
        code: getIDsScript,
        args: [
          [second, t.Address],
        ]
      });

      expect(collectibleData).toMatchObject({      
        "id": NFTId,
      });
      expect(parseFloat(price, 10)).toEqual(salePrice);
      expect(keys).toContain(NFTId);

      // Events      
      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Collectible.Withdraw`);
      expect(events[0].data.from).toEqual(second);

      expect(events[1].type).toEqual(`A.${admin.substr(2)}.MarketPlace.ForSale`);
      expect(events[1].data.owner).toEqual(second);
      expect(parseFloat(events[1].data.price, 10)).toEqual(salePrice);

    } catch (e) {
      console.log(e);
      error = e;
    }
    expect(error).toEqual(undefined);
  });   
});