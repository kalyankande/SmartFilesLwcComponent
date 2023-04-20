/*****************************************************************************************************
* 
* @ Name        : SD_ClassDownloadAll
* @ Purpose     : Controller for retreivng attachments
* @ Author      : Pradeep Chary
* @ Test Class  : SD_ClassDownloadAllTest
*
* Date          | Developer Name              | Version   | Changes
* ====================================================================================================
* 17-04-2020    | pradeep.chary@absyz.com     | 1.0       | Initial Version
*
*****************************************************************************************************/

public with sharing class SD_ClassDownloadAll {
    
/****************************************************************************************************
* @desc     	: Returns the attachments under a generic object
* @param    	: stRecordId
* @return   	: LIST<detailsClass> wrapper object
****************************************************************************************************/
    
    @AuraEnabled
    public static List<detailsClass> getAttachments(String stRecordId) {
        
            String theme = UserInfo.getUiThemeDisplayed();
        String CLSFD0001 = System.Label.CLSFD0001;  // No Files
        String CLSFD0002 = System.Label.CLSFD0002;  // Record does not exist
        String CLSFD0003 = System.Label.CLSFD0003;  // Please check record Id and object
        String CLSFD0004 = System.Label.CLSFD0004;  // Please check the custom metadata SD_Setting
        
        // return variable
        List<detailsClass> returnList = new List<detailsClass>();
        
        List<sfds__Setting__mdt> mdtSettingList = [SELECT DeveloperName, sfds__Value__c FROM sfds__Setting__mdt WHERE sfds__Active__c = true];
        Map<String, String> mdtSettingMap = new Map<String, String>();
        
        if(!mdtSettingList.isEmpty()) {
            
            for(sfds__Setting__mdt setting : mdtSettingList) {
                mdtSettingMap.put(setting.DeveloperName, setting.sfds__Value__c);
            }
            
            // checking for null and whitespaces
            if(String.isNotBlank(stRecordId)) {
                
                try {
                    // retriving the object reference
                    Id recordId = stRecordId;
                    Schema.SObjectType objectType = recordId.getSObjectType();
                    
                    // dynamic query to retrieve the object Id
                    String stQuery = mdtSettingMap.get('MDT0001') + ' ' + objectType + ' ' + mdtSettingMap.get('MDT0002');
                    
                    List<sObject> recordList = Database.query(stQuery);
                    
                    // checking if the record exists
                    if(!recordList.isEmpty()) {
                        
                        // the record exists, retrieve the queried Id
                        String stActualId = String.valueOf(recordList[0].get(mdtSettingMap.get('MDT0004')));
                        
                        // variables declaration
                        Set<Id> idsSet = new Set<Id>();
                        List<attachmentClass> fileList = new List<attachmentClass>();
                        
                        // Query to retrieve Content Document Link records with parent Id equal to stActualId
                        List<ContentDocumentLink> contentDocLinkList = [SELECT ContentDocumentId 
                                                                        FROM ContentDocumentLink 
                                                                        WHERE LinkedEntityId = :stActualId];
                        
                        for(ContentDocumentLink conDocLink : contentDocLinkList) {
                            idsSet.add(conDocLink.ContentDocumentId);
                        }
                        
                        // Based on the Content Document Link Ids retrieve the Content Version records
                        List<ContentVersion> versionList = [SELECT Id, ContentDocumentId, ContentSize, FileExtension, Owner.Name, 
                                                            OwnerId, LastModifiedDate, Title
                                                            FROM ContentVersion 
                                                            WHERE ContentDocumentId = :idsSet
                                                            AND IsLatest = true];
                        
                        // Mapping Content Version to wrapper object
                        if(!versionList.isEmpty()) {
                            for(ContentVersion record : versionList) {
                                attachmentClass file = new attachmentClass();
                                file.stRecordId = record.Id;
                                file.stDownloadId = record.ContentDocumentId;
                                file.stTitle = record.Title;
                                file.stOwner = record.Owner.Name;
                                file.stOwnerId = mdtSettingMap.get('MDT0003') + record.OwnerId;
                                file.stExtension = record.FileExtension;
                                file.inContentSize = record.ContentSize;
                                file.dtModifiedDate = record.LastModifiedDate;
                                fileList.add(file);
                            }
                        }
                        
                        // checking for null and error conditions
                        detailsClass response = new detailsClass();
                        if(UserInfo.getUiThemeDisplayed() == mdtSettingMap.get('MDT0005') || Test.isRunningTest()) {
                            response.bLightningExperience = true;
                        }
                        
                        if(!fileList.isEmpty()) {
                            response.recordList = fileList;
                        } else {
                            response.bEmpty = true;
                            response.stMessage = CLSFD0001;
                        }
                        returnList.add(response);
                        
                    } else {
                        // checking for condition if the record does not exist
                        detailsClass response = new detailsClass();
                        response.bError = true;
                        response.stMessage = CLSFD0002;
                        returnList.add(response);
                    }
                } catch (exception e) {
                    // handling exceptions
                    detailsClass response = new detailsClass();
                    response.bError = true;
                    response.stMessage = e.getMessage();
                    returnList.add(response);
                }
            } else {
                // checking for condition if the record and sObject are valid
                detailsClass response = new detailsClass();
                response.bError = true;
                response.stMessage = CLSFD0003;
                returnList.add(response);
            }
        } else {
            // checking for condition if the record and sObject are valid
            detailsClass response = new detailsClass();
            response.bError = true;
            response.stMessage = CLSFD0004;
            returnList.add(response);
        }
        
        return returnList;
    }
    
    // Wrapper class to return files details and handle error message if any
    public class detailsClass {
        @AuraEnabled public List<attachmentClass> recordList;
        @AuraEnabled public String stMessage;
        @AuraEnabled public Boolean bError;
        @AuraEnabled public Boolean bEmpty;
        @AuraEnabled public Boolean bLightningExperience;
        
        public detailsClass() {
            this.stMessage = '';
            this.bError = false;
            this.bEmpty = false;
            this.bLightningExperience = false;
        }
    }
    
    // Wrapper class to map Content version and Attachment to one
    public class attachmentClass {
        @AuraEnabled public String stRecordId;
        @AuraEnabled public String stBody;
        @AuraEnabled public String stDownloadId;
        @AuraEnabled public String stTitle;
        @AuraEnabled public String stOwner;
        @AuraEnabled public String stOwnerId;
        @AuraEnabled public String stExtension;
        @AuraEnabled public Integer inContentSize;
        @AuraEnabled public DateTime dtModifiedDate;
        
        public attachmentClass() {}
    }
}