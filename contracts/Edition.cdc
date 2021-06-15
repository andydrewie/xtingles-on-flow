// Edition is the batch of items with the almost same metadata. This is copies of one item
pub contract Edition {

    // The total amount of editions that have been created
    pub var totalEditions: UInt64

    // Struct to display and handle commissions
    pub struct CommissionStructure {
        pub let firstSalePercent: UFix64
        pub let secondSalePercent: UFix64
        pub let description: String
     
        init(          
            firstSalePercent: UFix64, 
            secondSalePercent: UFix64,
            description: String    
        ) {           
            self.firstSalePercent = firstSalePercent
            self.secondSalePercent = secondSalePercent
            self.description = description
        }
    }

    // Events  
    pub event CreateEdition(editionId: UInt64, royalty: { Address: CommissionStructure }) 
    pub event ChangeCommision(editionId: UInt64, royalty: { Address: CommissionStructure }) 
    pub event ChangeMaxEdition(editionId: UInt64, maxEdition: UInt64) 

    // Info about editions
    pub struct EditionStatus {
        pub let royalty: { Address: CommissionStructure }  
        pub let editionId: UInt64  
        pub let maxEdition: UInt64      

        init(
            royalty: { Address: CommissionStructure },
            editionId: UInt64,
            maxEdition: UInt64      
        ) {
            self.royalty = royalty                    
            self.editionId = editionId
            self.maxEdition = maxEdition
        }
    }

    // Attributes one edition, where stores royalty and count of copies in editions
    pub resource EditionItem {
        pub let editionId: UInt64
        pub var royalty: { Address: CommissionStructure }
        priv var maxEdition: UInt64  

        init(
            royalty: { Address: CommissionStructure },
            maxEdition: UInt64
        ) {
            Edition.totalEditions = Edition.totalEditions + (1 as UInt64)
            self.royalty = royalty                    
            self.editionId = Edition.totalEditions 
            self.maxEdition = maxEdition
        }

        // Get status of edition        
        pub fun getEdition(): EditionStatus {
            return EditionStatus(
                royalty: self.royalty,                      
                editionId: self.editionId,
                maxEdition: self.maxEdition
            )
        }

        // Change commision
        pub fun changeCommission(      
           royalty: { Address: CommissionStructure }     
        ) {
            self.royalty = royalty
            emit ChangeCommision(editionId: self.editionId, royalty: royalty)
        }

        // Change count of copies. This is used for Open Edition, because the eventual amount of copies are unknown        
        pub fun changeMaxEdition (      
           maxEdition: UInt64     
        ) {
            pre {
               // You can change this number only once after Open Edition would be completed
               self.maxEdition < UInt64(1) : "You could not change max edition" 
            }

            self.maxEdition = maxEdition      

            emit ChangeMaxEdition(editionId: self.editionId, maxEdition: maxEdition) 
        }
       
        destroy() {
            log("destroy edition item")            
        }
    }    

    // EditionPublic is a resource interface that restricts users to
    // retreiving the edition information
    pub resource interface EditionPublic {

        pub fun getEdition(_ id: UInt64): EditionStatus
    }

    //EditionCollection contains a dictionary EditionItems and provides
    // methods for manipulating EditionItems
    pub resource EditionCollection: EditionPublic  {

        // Edition Items
        access(account) var editionItems: @{UInt64: EditionItem} 

        init() {    
            self.editionItems <- {}
        }

        // add
        pub fun createEdition(
            royalty: { Address: CommissionStructure },
            maxEdition: UInt64        
        ): UInt64 {
           
            var firstSummaryPercent = 0.00
            var secondSummaryPercent = 0.00          

            for key in royalty.keys {
                firstSummaryPercent = firstSummaryPercent + royalty[key]!.firstSalePercent
                secondSummaryPercent = secondSummaryPercent + royalty[key]!.secondSalePercent
            }      

            if firstSummaryPercent != 100.00 { panic("The first summary sale percent should be 100 %") }

            if secondSummaryPercent >= 100.00 { panic("The second summary sale percent should be less than 100 %") }
           
            let item <- create EditionItem(
                royalty: royalty,
                maxEdition: maxEdition                  
            )

            let id = item.editionId

            // update the auction items dictionary with the new resources
            let oldItem <- self.editionItems[id] <- item
            
            destroy oldItem

            emit CreateEdition(editionId: id, royalty: royalty) 

            return id
        }
     
        pub fun getEdition(_ id: UInt64): EditionStatus {
            pre {
                self.editionItems[id] != nil : "Edition doesn't exist"
            }

            // Get the edition item resources
            let itemRef = &self.editionItems[id] as &EditionItem
            return itemRef.getEdition()
        }

        //Change commission
        pub fun changeCommission(
            id: UInt64,
            royalty: { Address: CommissionStructure }   
        ) {
            pre {
                self.editionItems[id] != nil: "Edition doesn't exist"
            }
          
            var firstSummaryPercent = 0.00
            var secondSummaryPercent = 0.00          

            for key in royalty.keys {
                firstSummaryPercent = firstSummaryPercent + royalty[key]!.firstSalePercent
                secondSummaryPercent = secondSummaryPercent + royalty[key]!.secondSalePercent
            }      

            if firstSummaryPercent != 100.00 { panic("The first summary sale percent should be 100 %") }

            if secondSummaryPercent >= 100.00 { panic("The second summary sale percent should be less than 100 %") }
            
            let itemRef = &self.editionItems[id] as &EditionItem
            
            itemRef.changeCommission(
                royalty: royalty            
            )
        }

        // Change count of copies. This is used for Open Edition, because the eventual amount of copies are unknown 
        pub fun changeMaxEdition(
            id: UInt64,
            maxEdition: UInt64
        ) {
            pre {
                self.editionItems[id] != nil: "Edition doesn't exist"
            }
            let itemRef = &self.editionItems[id] as &EditionItem
            itemRef.changeMaxEdition(
                maxEdition: maxEdition        
            )
        }
    
        destroy() {
            log("destroy edition collection")
            // destroy the empty resources
            destroy self.editionItems
        }
    }   

    // createEditionCollection returns a new createEditionCollection resource to the caller
    pub fun createEditionCollection(): @EditionCollection {
        let editionCollection <- create EditionCollection()

        return <- editionCollection
    }

    init() {
        self.totalEditions = (0 as UInt64)
    }   
}