import NonFungibleToken from 0x631e88ae7f1d7c20

import Collectible from 0x85080f371da20cc1

transaction() {

    prepare(account: AuthAccount) {

        // get the references to the NFT Collection receiver
        var collectionCap = account.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            account.save<@NonFungibleToken.Collection>(<- Collectible.createEmptyCollection(), to: Collectible.CollectionStoragePath)

            // publish a capability to the Collection in storage
            account.link<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath, target: Collectible.CollectionStoragePath)
        }      
    }

    execute {}
}
