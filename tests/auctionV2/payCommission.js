import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import {
    sendTransaction, mintFlow, getAccountAddress,
    init, emulator, deployContractByName, executeScript
} from "flow-js-testing";

export const testSuitePayCommission = () => describe("Auction pay commissions", () => {
    let placeBidTransaction,
        createAuctionTransactionWithNFT,
        setupFUSDTransaction,
        tickTransaction,
        mintFUSDTransaction,
        cancelAuctionTransaction,
        createAuctionTransaction,
        checkAuctionStatusScript,
        settleAuctionTransaction,
        unlinkFUSDVault;

    beforeAll(async () => {
        jest.setTimeout(120000);
        init(path.resolve(__dirname, "../"));

        createAuctionTransactionWithNFT = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/auctionV2/CreateAuctionWithNFT.cdc`
            ),
            "utf8"
        );

        placeBidTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/auctionV2/Bid.cdc`
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

        cancelAuctionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/auctionV2/CancelAuction.cdc`
            ),
            "utf8"
        );

        settleAuctionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/auctionV2/SettleAuction.cdc`
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

        createAuctionTransaction = fs.readFileSync(
            path.join(
                __dirname,
                `../../transactions/emulator/auctionV2/CreateAuction.cdc`
            ),
            "utf8"
        );

        checkAuctionStatusScript = fs.readFileSync(
            path.join(
                __dirname,
                `../../scripts/emulator/auctionV2/CheckAuctionStatus.cdc`
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
        await deployContractByName({ to: admin, name: "AuctionV2", addressMap });

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

        // Setup FUSD Vault for the third account
        await sendTransaction({
            code: setupFUSDTransaction,
            args: [],
            signers: [fourth],
        });

        // Mint FUSD for Vault and sent to the third account
        await sendTransaction({
            code: mintFUSDTransaction,
            args: [
                ["500.00", t.UFix64], [fourth, t.Address]
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

    test("check commission events, when auction was settled and all vault are reachable", async () => {
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");

            const commission = `{
                Address(${second}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 7.00,
                    description: "xxx"
                )
            }`;

            const auctionParameters = [
                // Min bid increment in percent
                ["10.00", t.UFix64],
                // Initial auction length  
                ["4.00", t.UFix64],
                // Time until finish, when auction could be extended
                ["0.01", t.UFix64],
                // Time lenght to extend auction
                ["0.01", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Start bid time
                ["0.00", t.UFix64],   
                // Initial price
                ["50.00", t.UFix64],
                // Platform vault address
                ["0x01cf0e2f2f715450", t.Address]
            ];

            const createdAuctionWithNFT = await sendTransaction({
                code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
                args: [
                    ...auctionParameters,
                    // Link to NFT
                    ["xxx", t.String],
                    // name
                    ["xxx", t.String],
                    // author
                    ["xxx", t.String],
                    // description
                    ["xxx", t.String],
                    // Number of copy in one edition
                    [1, t.UInt64],
                ],
                signers: [admin],
            });

            const { events } = createdAuctionWithNFT;

            // Id of created auction
            const auctionId = events[0].data.auctionID;

            // timeout to start auction
            await new Promise((r) => setTimeout(r, 2000));

            // Sample transaction to change last block time
            await sendTransaction({
                code: tickTransaction,
                args: [],
                signers: [admin],
            });

            // Bid from the second account
            await sendTransaction({
                code: placeBidTransaction,
                args: [
                    // Auction id     
                    [auctionId, t.UInt64],
                    // Bid amount
                    ["50.00", t.UFix64],
                    // Platform address
                    [admin, t.Address],
                ],
                signers: [second],
            });

            await new Promise((r) => setTimeout(r, 3000));

            // Sample transaction to change last block time
            await sendTransaction({
                code: tickTransaction,
                args: [],
                signers: [admin],
            });

            // Settle
            const result = await sendTransaction({
                code: settleAuctionTransaction,
                args: [
                    [auctionId, t.UInt64]
                ],
                signers: [admin],
            });

            const { events: setlleEvents } = result;

            const auction = await executeScript({
                code: checkAuctionStatusScript,
                args: [
                    [admin, t.Address],
                    [events[0].data.auctionID, t.UInt64],
                ]
            });

            const earnedAuctionEvents = setlleEvents.filter(event => event.type === `A.${admin.substr(2)}.AuctionV2.Earned`);

            // Count of earned events is 2, because in commission object we have 2 recipient of commission
            expect(earnedAuctionEvents.length).toBe(2);

            expect(parseFloat(earnedAuctionEvents[0].data.amount, 10)).toEqual(0.5);
            expect(parseFloat(earnedAuctionEvents[1].data.amount, 10)).toEqual(49.5);
            expect(earnedAuctionEvents[0].data.owner).toEqual(second);
            expect(earnedAuctionEvents[1].data.owner).toEqual(third);
        } catch (e) {
            expect(e).toEqual('');
        }
    });

    test("check commission events, when auction was settled and one vault is unreachable. the platform gets this commision", async () => {
        try {
            const admin = await getAccountAddress("admin");
            const second = await getAccountAddress("second");
            const third = await getAccountAddress("third");
            const fourth = await getAccountAddress("fourth");
          
            const commission = `{
                Address(${fourth}) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(${third}) : Edition.CommissionStructure(
                    firstSalePercent: 99.00,
                    secondSalePercent: 7.00,
                    description: "xxx"
                )
            }`;

            const auctionParameters = [
                // Min bid increment in percent
                ["10.00", t.UFix64],
                // Initial auction length  
                ["4.00", t.UFix64],
                // Time until finish, when auction could be extended
                ["0.01", t.UFix64],
                // Time lenght to extend auction
                ["0.01", t.UFix64],
                // Start time
                [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
                // Start bid time
                ["0.00", t.UFix64],  
                // Initial price
                ["50.00", t.UFix64],
                // Platform vault address
                [admin, t.Address]
            ];

            const createdAuctionWithNFT = await sendTransaction({
                code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
                args: [
                    ...auctionParameters,
                    // Link to NFT
                    ["xxx", t.String],
                    // name
                    ["xxx", t.String],
                    // author
                    ["xxx", t.String],
                    // description
                    ["xxx", t.String],
                    // Number of copy in one edition
                    [1, t.UInt64],
                ],
                signers: [admin],
            });

            const { events } = createdAuctionWithNFT;

            // Id of created auction
            const auctionId = events[0].data.auctionID;

            // timeout to start auction
            await new Promise((r) => setTimeout(r, 2000));

            // Sample transaction to change last block time
            await sendTransaction({
                code: tickTransaction,
                args: [],
                signers: [admin],
            });

            // Bid from the second account
            await sendTransaction({
                code: placeBidTransaction,
                args: [
                    // Auction id     
                    [auctionId, t.UInt64],
                    // Bid amount
                    ["50.00", t.UFix64],
                    // Platform address
                    [admin, t.Address],
                ],
                signers: [second],
            });

            await new Promise((r) => setTimeout(r, 3000));

            // Sample transaction to change last block time
            await sendTransaction({
                code: tickTransaction,
                args: [],
                signers: [admin],
            });

            // Unlink the fourth account FUSD vault to check failed payment events
            await sendTransaction({
                code: unlinkFUSDVault,
                args: [], 
                signers: [fourth],
            }); 

            // Settle
            const result = await sendTransaction({
                code: settleAuctionTransaction,
                args: [
                    [auctionId, t.UInt64]
                ],
                signers: [admin],
            });

            const { events: setlleEvents } = result;

            const auction = await executeScript({
                code: checkAuctionStatusScript,
                args: [
                    [admin, t.Address],
                    [events[0].data.auctionID, t.UInt64],
                ]
            });

            const earnedAuctionEvents = setlleEvents.filter(event => event.type === `A.${admin.substr(2)}.AuctionV2.Earned`);

            // Count of earned events is 2, because in commission object we have 2 recipient of commission
            expect(earnedAuctionEvents.length).toBe(2);

            expect(parseFloat(earnedAuctionEvents[0].data.amount, 10)).toEqual(49.5);
            expect(parseFloat(earnedAuctionEvents[1].data.amount, 10)).toEqual(0.5);

            // The platform gets FUSD, because the one form commission vault is unreachable
            expect(earnedAuctionEvents[0].data.owner).toEqual(third);
            expect(earnedAuctionEvents[1].data.owner).toEqual(admin);
        } catch (e) {
            expect(e).toEqual('');
        }
    });
})
