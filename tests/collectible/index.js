import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName } from "flow-js-testing";

const editionNumber = 3;

export const testSuiteCollectible = () => describe("Collectible", () => {
  let mintCollectibleTransaction,
    checkCollectibleScript,
    checkCollectibleStorageScript,
    checkAllCollectibleScript,
    getNFTIdsScript,
    checkEditionNumberNFTScript,
    transferCollectibleTransaction,
    initializeNFTStorageTransaction;

  beforeAll(async () => {
    jest.setTimeout(60000);
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
  });

  beforeEach(async (done) => {
    const basePath = path.resolve(__dirname, "../../");
    const port = 8081;
    init(basePath, port);

    await emulator.start(port, false);
    const admin = await getAccountAddress("admin");
    await mintFlow(admin, "10.0");

    const addressMap = { NonFungibleToken: admin };

    await deployContractByName({ to: admin, name: "NonFungibleToken" });
    await deployContractByName({ to: admin, name: "Collectible", addressMap });
    done();
  });

  // Stop emulator, so it could be restarted
  afterEach(async (done) => {
    await emulator.stop();
    done();
  });

  test("check NFT storage. check collection capability", async () => {
    const admin = await getAccountAddress("admin");
    const result = await executeScript({
      code: checkCollectibleStorageScript,
      args: [
        [admin, t.Address]
      ]
    });

    expect(result).toBe(true);
  });

  test("check mint function", async () => {
    try {
      const admin = await getAccountAddress("admin");
      const result = await sendTransaction({
        code: mintCollectibleTransaction,
        args: [
          ["https://www.ya.ru", t.String],
          ["Great NFT!", t.String],
          ["Brad Pitt", t.String],
          ["Awesome", t.String],
          [1, t.UInt64],
          [3, t.UInt64],
        ],
        signers: [admin],
      });
      const { events } = result;
      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Collectible.Created`);
      expect(events[1].type).toEqual(`A.${admin.substr(2)}.Collectible.Deposit`);
      expect(events[1].data).toEqual({ id: 1, to: admin });
    } catch (e) {
      console.error(e);
    }
  });

  test("check getIDs function", async () => {
    const admin = await getAccountAddress("admin");
    await sendTransaction({
      code: mintCollectibleTransaction,
      args: [
        ["https://www.ya.ru", t.String],
        ["Great NFT!", t.String],
        ["Brad Pitt", t.String],
        ["Awesome", t.String],
        [1, t.UInt64],
        [3, t.UInt64],
      ],
      signers: [admin],
    });
    const result = await executeScript({
      code: getNFTIdsScript,
      args: [
        [admin, t.Address]
      ]
    });
    expect(result).toEqual([1]);
  });

  test("check getAllCollectible function", async () => {
    const admin = await getAccountAddress("admin");
    await sendTransaction({
      code: mintCollectibleTransaction,
      args: [
        ["https://www.ya.ru", t.String],
        ["Great NFT!", t.String],
        ["Brad Pitt", t.String],
        ["Awesome", t.String],
        [1, t.UInt64],
        [3, t.UInt64],
      ],
      signers: [admin],
    });
    const result = await executeScript({
      code: checkAllCollectibleScript,
      args: [
        [admin, t.Address]
      ]
    });
    expect(result[0].metadata).toEqual(
      {
        "link": "https://www.ya.ru",
        "name": "Great NFT!",
        "author": "Brad Pitt",
        "description": "Awesome",
        "edition": 1,
        "properties": {}
      })
  });

  test("check getCollectible function. check metadata", async () => {
    const admin = await getAccountAddress("admin");
    await sendTransaction({
      code: mintCollectibleTransaction,
      args: [
        ["https://www.ya.ru", t.String],
        ["Great NFT!", t.String],
        ["Brad Pitt", t.String],
        ["Awesome", t.String],
        [1, t.UInt64],
        [3, t.UInt64],
      ],
      signers: [admin],
    });
    const result = await executeScript({
      code: checkCollectibleScript,
      args: [
        [admin, t.Address],
        [1, t.UInt64],
      ]
    });

    expect(result.id).toBe(1);

    expect(result.metadata).toEqual(
      {
        "link": "https://www.ya.ru",
        "name": "Great NFT!",
        "author": "Brad Pitt",
        "description": "Awesome",
        "edition": 1,
        "properties": {}
      })
  });

  test("check getEditionNumber", async () => {
    const editionNumber = 3;
    const admin = await getAccountAddress("admin");
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
    const result = await executeScript({
      code: checkEditionNumberNFTScript,
      args: [
        [admin, t.Address],
        [1, t.UInt64],
      ]
    });
    expect(result).toBe(editionNumber);
  });

  test("transfer collectible", async () => {
    const admin = await getAccountAddress("admin");

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

    const secondAccount = await getAccountAddress("secondAccount");

    await sendTransaction({
      code: initializeNFTStorageTransaction,
      args: [],
      signers: [secondAccount],
    });

    const result = await sendTransaction({
      code: transferCollectibleTransaction,
      args: [
        [secondAccount, t.Address],
        [1, t.UInt64]
      ],
      signers: [admin],
    });

    const { events } = result;
    expect(events[0].type).toEqual(`A.${admin.substr(2)}.Collectible.Withdraw`);
    expect(events[0].data).toEqual({ id: 1, from: admin });
    expect(events[1].type).toEqual(`A.${admin.substr(2)}.Collectible.Deposit`);
    expect(events[1].data).toEqual({ id: 1, to: secondAccount });
  });
});