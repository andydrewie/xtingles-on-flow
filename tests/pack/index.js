import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName } from "flow-js-testing";

// Common number for all copies of the item
const editionNumber = 1;

export const testSuitePack = () => describe("Pack", () => {
  let mintPackTransaction,
    checkPackStorageScript,
    getPackIdsScript,
    checkEditionNumberPackScript,
    transferPackTransaction,
    initializePackStorageTransaction,
    createEditionTransaction,
    setupFUSDTransaction,
    mintFUSDTransaction;

  beforeAll(async () => {
    jest.setTimeout(120000);
    init(path.resolve(__dirname, "../"));

    mintPackTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/pack/MintPack.cdc`
      ),
      "utf8"
    );

    getPackIdsScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/pack/GetPackIds.cdc`
      ),
      "utf8"
    );

    checkPackStorageScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/pack/CheckPackStorage.cdc`
      ),
      "utf8"
    );

    checkEditionNumberPackScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/pack/CheckEditionNumberPack.cdc`
      ),
      "utf8"
    );

    transferPackTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/pack/TransferPack.cdc`
      ),
      "utf8"
    );

    initializePackStorageTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/pack/InitializePackStorage.cdc`
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

    const addressMap = { NonFungibleToken: admin, Edition: admin, FUSD: admin };

    await deployContractByName({ to: admin, name: "NonFungibleToken" });
    await deployContractByName({ to: admin, name: "Edition" });
    await deployContractByName({ to: admin, name: "FUSD" });
    await deployContractByName({ to: admin, name: "Pack", addressMap });

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
    
    done();
  });

  // Stop emulator, so it could be restarted
  afterEach(async (done) => {
    await emulator.stop();
    done();
  });

  test("check pack capability", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const result = await executeScript({
        code: checkPackStorageScript,
        args: [
          [admin, t.Address]
        ]
      });

      expect(result).toBe(true);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(undefined);
  });

  test("mint function throws error, when edition does not exist", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const nonExistentEditionNumber = 100;
      const result = await sendTransaction({
        code: mintPackTransaction,
        args: [
          // Common number for all copies of the item
          [nonExistentEditionNumber, t.UInt64],
        ],
        signers: [admin],
      });
      expect(result).toEqual('');
    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/Edition does not exist/);
  });

  test("mint function check events", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const result = await sendTransaction({
        code: mintPackTransaction,
        args: [        
          // Common number for all copies of the item
          [editionNumber, t.UInt64],
        ],
        signers: [admin],
      });
      const { events } = result;

      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Pack.Created`);
      expect(events[1].type).toEqual(`A.${admin.substr(2)}.Pack.Deposit`);
      expect(events[1].data).toEqual({ id: 1, to: admin });
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(undefined);
  });

  test("check getIDs function", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");

      const resultBefore = await executeScript({
        code: getPackIdsScript,
        args: [
          [admin, t.Address]
        ]
      });
  
      const mintedNFT = await sendTransaction({
        code: mintPackTransaction,
        args: [
          // Common number for all copies of the item
          [editionNumber, t.UInt64],
        ],
        signers: [admin],
      });
  
      const { events } = mintedNFT;
  
      const resultAfter = await executeScript({
        code: getPackIdsScript,
        args: [
          [admin, t.Address]
        ]
      });
  
      // Thre are not NFTs on this account
      expect(resultBefore).toEqual([]);
  
      // Check previously minted and transfer NFT
      expect(resultAfter).toEqual([events[1].data.id]);
    } catch(e) {
      error = e;
    }

    expect(error).toEqual(undefined);  
  });

  test("getEditionNumber returns nil, when pack does not exist on the account", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");  

      await sendTransaction({
        code: mintPackTransaction,
        args: [
            // Common number for all copies of the item
            [editionNumber, t.UInt64],
        ],
        signers: [admin],
      });

      const result = await executeScript({
        code: checkEditionNumberPackScript,
        args: [
          // NFT's owner address
          [admin, t.Address],
          // Non-existent pack id
          [100, t.UInt64],
        ]
      });
      expect(result).toBe(null);
      
    } catch(e) {
      error = e;
    }
      expect(error).toEqual(undefined);
  });

  test("getEditionNumber returns edition number", async () => {
    let error;
    try {
    const admin = await getAccountAddress("admin");

    await sendTransaction({
      code: mintPackTransaction,
      args: [
          // Common number for all copies of the item
          [editionNumber, t.UInt64],
      ],
      signers: [admin],
    });

    const result = await executeScript({
      code: checkEditionNumberPackScript,
      args: [
        // NFT's owner address
        [admin, t.Address],
        // NFT id
        [1, t.UInt64],
      ]
    });

    expect(result).toBe(editionNumber);

    } catch(e) {
      error = e;
    }
      expect(error).toEqual(undefined);   
  });

  test("throw error, because withdraw pack from account", async () => {
    let error;
    try {
    const admin = await getAccountAddress("admin");

    await sendTransaction({
      code: mintPackTransaction,
      args: [
        // Common number for all copies of the item
        [editionNumber, t.UInt64],
      ],
      signers: [admin],
    });

    const second = await getAccountAddress("second");

    // Create resource to store pack on the second account
    await sendTransaction({
      code: initializePackStorageTransaction,
      args: [],
      signers: [second],
    });

    // Transfer pack from the admin to the second account
    await sendTransaction({
      code: transferPackTransaction,
      args: [
        // Recepient
        [second, t.Address],
        // Pack id
        [1, t.UInt64]
      ],
      signers: [admin],
    });

  } catch(e) {
    error = e;
  }
  expect(error).toMatch(/The pack is non transferable from account/);  
  });
});