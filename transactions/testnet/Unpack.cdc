import Pack from 0x2695ea898b04f0c0

transaction(      
        packId: UInt64
    ) {
        
   let ownerRef: &Pack.Collection

    prepare(
        acct: AuthAccount     
    ) {    
        self.ownerRef = acct.borrow<&Pack.Collection>(from: Pack.CollectionStoragePath)
			?? panic("Could not borrow owner pack reference")         
    }

    execute {              
        self.ownerRef.unpack(packId: packId)          
    }
}