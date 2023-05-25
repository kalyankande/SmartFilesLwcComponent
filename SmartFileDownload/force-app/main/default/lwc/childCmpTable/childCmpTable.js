import { LightningElement, api, track} from 'lwc';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';
import CLSFD0005 from '@salesforce/label/c.CLSFD0005';
import {
    deleteRecord
} from 'lightning/uiRecordApi';
//import getIcon from '@salesforce/resourceUrl/getIcon';
import {
    NavigationMixin
} from 'lightning/navigation';
import getAttachments from '@salesforce/apex/SD_ClassDownloadAll.getAttachments';
import deleteSelectedFiles from '@salesforce/apex/SD_ClassDownloadAll.deleteSelectedFiles';

const actions = [{
        label: 'Preview',
        name: 'view'
    },
    {
        label: 'Delete',
        name: 'delete'
    }

];
const columns = [{
        label: "Title",
        fieldName: "icon",
        sortable: true,
        cellAttributes: {
            iconName: {
                fieldName: "stExtension"
            },
            iconLabel: {
                fieldName: "stTitle"
            },
            iconPosition: "left",
            class: "custom-icon"
        }
    },

    {
        label: "Owner",
        fieldName: "stOwnerId",
        sortable: true,
        type: "url",
        typeAttributes: {
            label: {
                fieldName: "stOwner"
            },
            tooltip: {
                fieldName: "stOwner"
            },
            target: "_blank"
        }
    },
    {
        label: 'Last Modified By',
        fieldName: 'dtModifiedDate',
        sortable: "true",
        type: 'date',
        typeAttributes: {

            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    },
    {
        label: 'Size ',
        fieldName: 'size',
        sortable: "true"
    }, {
        type: 'action',
        typeAttributes: {
            rowActions: actions
        },
    },
];

export default class childCmpTable extends NavigationMixin(LightningElement) {
    // Attributes to display error messages and warnings
    @track strErrorMessage = 'No Files';
    @track blnError = false;
    @track blnWarning = false;
    @track strCustomLabel = CLSFD0005;
    // To toggle spinner
    @track blnSpinner = false;
    // Attributes for Data table
    @track list_BackupData = [];
    @track list_Data = [];
    @track list_SelectedData = [];
    @track columns = columns;
    @track sortedBy;
    // Attributes for Lightning Data Service
    @api recordId;
    // Attribute Map with Key as Id and Value as Version data
    @track list_Icons = [];
    @api blnIconFilter;
    // Attributes to display details and actions
    @track strTitle = "Smart Download";
    @track iconName = "standard:document";
    @track strButtonLabel = "Download As Zip";
    @track strButtonLabelv2 = "Download";
    @track blnDisabled = true;
    @track blnEnableTable = false;
    @track bEnableFilter;
    @track list_FinalData = [];
    @track sortedDirection;
    @track str_DefaultSort = "asc";
    @track blnConformationDelete = false;
    @track blnSearchEnabled = false;
    @track blnSearchIconEnabled = true;
    constructor() {
        super();
        const style = document.createElement('style');
        style.innerText = `.ligtning-table-cc .slds-table tbody tr{
            height: 40px !important;
        }
        .ligtning-table-cc .custom-icon .slds-icon_x-small{
            width:2rem;
            height:2rem;
        }`;
        document.querySelector('head').appendChild(style);
    }
    connectedCallback() {
        this.init();
    }
    init() {
        this.blnSpinner = true;
        this.getData();
    }
    getData() {
        getAttachments({
                stRecordId: this.recordId
            })
            .then((result) => {
                if (result[0].stMessage == "No Files") {
                    this.blnError = true;
                    this.blnSpinner = false;
                    this.blnEnableTable = false;
                } else {
                    var tempData = [];
                    var icontype = [];
                    this.list_Icons = [];
                    for (let i = 0; i < result.length; i++) {
                        this.list_Data = result[i].recordList;
                        const map = new Map();
                        for (let j = 0; j < this.list_Data.length; j++) {
                            var size = this.updateContentSize(this.list_Data[j].inContentSize);
                            var tempicontype = this.iconType(this.list_Data[j].stExtension);
                            var tempStoreData = {
                                stTitle: this.list_Data[j].stTitle,
                                stOwnerId: this.list_Data[j].stOwnerId,
                                dtModifiedDate: this.list_Data[j].dtModifiedDate,
                                size: size,
                                stOwner: this.list_Data[j].stOwner,
                                stExtension: tempicontype,
                                stDownloadId: this.list_Data[j].stDownloadId,
                                fileExtension: this.list_Data[j].stExtension
                            }
                            tempData.push(tempStoreData);
                            icontype.push(tempicontype);
                            map.set(tempicontype, this.list_Data[j].stExtension);
                        }
                        var tempicons = Array.from(new Set(icontype));

                        for (let i = 0; i < tempicons.length; i++) {
                            let tempMap = {
                                'name': map.get(tempicons[i]).toUpperCase(),
                                'filetype': tempicons[i]

                            };
                            this.list_Icons.push(tempMap);
                        }
                    }
                    this.blnDisabled = false;
                    this.list_FinalData = tempData;
                    this.blnWarning = false;
                    let data_clone = JSON.parse(JSON.stringify(this.list_FinalData));
                    this.list_FinalData = data_clone.sort(this.sortBy('dtModifiedDate', this.str_DefaultSort));
                    this.list_BackupData = this.list_FinalData;
                    this.blnEnableTable = true;
                    this.blnSpinner = false;
                    this.blnError = false;
                }
            })
            .catch((error) => {
                console.log(JSON.stringify(error));
                this.blnSpinner = false;
            });
    }
    updateContentSize(stSize) {
        if (stSize > 0) {
            stSize = stSize / 1024;
            if (stSize < 1) {
                stSize = stSize * 1000;
                stSize = Math.round(stSize);
                return stSize.toString() + ' B';
            }
            stSize = Math.round(stSize);
            if (stSize < 1024) {
                return stSize.toString() + ' KB';
            } else {
                stSize = stSize / 1024;
                stSize = stSize.toFixed(2);
                return stSize.toString() + ' MB';
            }
        } else {
            return '0 KB';
        }
    }
    iconType(strType) {
        var iconName = "";
        var name = "";
        if (strType === "xls" || strType === "xlsx") {
            iconName = "doctype:excel";
            name = "XLS";
        } else if (strType === "doc" || strType === "docx") {
            iconName = "doctype:word";
            name = "DOC";
        } else if (strType === "ppt" || strType === "pptx") {
            iconName = "doctype:ppt";
            name = "PPT";
        } else if (strType === "pdf") {
            iconName = "doctype:pdf";
            name = "PDF";
        } else if (strType === "txt") {
            iconName = "doctype:txt";
            name = "TXT";
        } else if (strType === "html") {
            iconName = "doctype:html";
            name = "HTML";
        } else if (strType === "csv") {
            iconName = "doctype:csv";
            name = "CSV";
        } else if (strType === "zip" || strType === "rar") {
            iconName = "doctype:zip";
            name = "ZIP";
        } else if (strType === "xml") {
            iconName = "doctype:xml";
            name = "XML";
        } else if (strType === "mp4") {
            iconName = "doctype:mp4";
            name = "MP4";
        } else if (strType === "png" || strType === "jpg" || strType === "jpeg" || strType === "bmp" || strType === "gif") {
            iconName = "doctype:image";
            name = "IMG";
        } else {
            iconName = "doctype:attachment";
            name = "ATCH";
        }
        return iconName;
    }
    updateColumnSorting(event) {
        let fieldName = ''
        let fieldName1 = event.detail.fieldName;
        if (fieldName1 == 'icon') fieldName = 'stTitle';
        let sortDirection = event.detail.sortDirection;
        // assign the latest attribute with the sorted column fieldName and sorted direction
        this.sortedBy = fieldName1;
        this.sortedDirection = sortDirection;

        let reverse = sortDirection !== 'asc';

        let data_clone = JSON.parse(JSON.stringify(this.list_FinalData));

        console.log('BEFORE data_clone:' + JSON.stringify(data_clone));

        if (fieldName1 == 'icon') {
            this.list_FinalData = data_clone.sort(this.sortBy(fieldName, reverse));
        } else {
            this.list_FinalData = data_clone.sort(this.sortBy(fieldName1, reverse));

        }
    }
    sortBy(field, reverse, primer) {
        var key = function (x) {
            return primer ? primer(x[field]) : x[field]
        };
        return function (a, b) {
            var A = key(a),
                B = key(b);
            if (A === undefined) A = '';
            if (B === undefined) B = '';
            return (A < B ? -1 : (A > B ? 1 : 0)) * [1, -1][+!!reverse];
        }
    }
    btnDownload() {
        let selectedRows = this.template.querySelector('lightning-datatable').getSelectedRows();
        let selectedFiles = [];
        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            console.log('file' + i);
            selectedFiles.push({
                ContentDocumentId: file.stDownloadId,
                Title: file.stTitle
            });
        }
        if (selectedFiles == 0) {
            this.blnWarning = true;
        } else {
            for (let i = 0; i < selectedFiles.length; i++) {
                this.blnWarning = false;
                this.downloadFiles(selectedFiles[i]);
                setTimeout(() => {}, 100000);
            }
            console.log('Downloaded SUCCESSFULLY');
        }
    }
    downloadFiles(selectedFiles) {
        let file = selectedFiles;

        let fileUrl = '/sfc/servlet.shepherd/document/download/' + file.ContentDocumentId;

        const fileWindow = window.open(fileUrl, '_blank');
        console.log('id', file.ContentDocumentId);

    }
    onRowAction(event) {
        const actionName = event.detail.action.name;
        console.log(actionName);
        const row = event.detail.row;
        console.log(row);
        // this.recordId = row.stDownloadId;
        switch (actionName) {
            case 'view':
                this[NavigationMixin.Navigate]({
                    type: 'standard__namedPage',
                    attributes: {
                        //recordId: row.stDownloadId,
                        actionName: 'view',
                        pageName: 'filePreview'
                    },
                    state: {
                        selectedRecordId: row.stDownloadId
                    }
                });
                break;
            case 'delete':
                console.log("row.stDownloadId" + row.stDownloadId);
                deleteRecord(row.stDownloadId)
                    .then(() => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Record deleted',
                                variant: 'success'
                            })

                        );
                        this.btnHandleRefresh();
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error deleting record',
                                message: error.body.message,
                                variant: 'error'
                            })
                        );
                    });

        }
    }
    @api btnHandleRefresh(event) {
        this.init();
    }
    handleMenuSelect() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                //objectApiName: 'Account',
                relationshipApiName: 'CombinedAttachments',
                actionName: 'view'
            }
        });

    }
    handleSelectedDelete() {
        let selectedRows = this.template.querySelector('lightning-datatable').getSelectedRows();
        let selectedFiles = [];

        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            selectedFiles.push(
                file.stDownloadId
            );
        }
        console.log('selectedFiles:' + JSON.stringify(selectedFiles));
        console.log(this.recordId);

        deleteSelectedFiles({
                'selectedFilesList': selectedFiles
            })
            .then(result => {
                console.log('Saved selected tasks:', result);
                if (result == 'Success') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Records deleted',
                            variant: 'success'
                        })

                    );
                    this.btnHandleRefresh();
                }
            })
            .catch(error => {

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });

    }
    btnDownloadasZip() {
        let selectedRows = this.template.querySelector('lightning-datatable').getSelectedRows();
        let selectedFiles = [];

        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            console.log('file' + i);
            selectedFiles.push(file.stDownloadId);
        }
        console.log('selected files ', selectedFiles);
        if (selectedFiles.length == 0) {
            this.blnWarning = true;
        } else {
            this.blnWarning = false;
            this.downloadSelectedZipFiles(selectedFiles);
            console.log('Downloaded SUCCESSFULLY');
        }
    }
    downloadSelectedZipFiles(selectedFiles) {

        let fileDataList = JSON.parse(JSON.stringify(selectedFiles));
        console.log('zip', selectedFiles);
        let fileIdsString = '';

        for (let i in fileDataList) {
            fileIdsString += fileDataList[i] + '/';
        }

        if (fileIdsString.length > 0) {
            fileIdsString = fileIdsString.replace(/.$/, "?");
        }

        let fileUrl = '/sfc/servlet.shepherd/document/download/' + fileIdsString;
        const fileWindow = window.open(fileUrl, '_blank');
    }
    handleTypeFilter(event) {
        let name = event.target.label;
        this.list_FinalData = this.list_BackupData.filter(item => item.fileExtension.toUpperCase() === name);

        for (let i = 0; i < this.list_Icons.length; i++) {

            this.list_Icons[i].variant = null;
            if (this.list_Icons[i].name === name) {
                this.list_Icons[i].variant = "brand";
            }
        }
    }
    updateToDefault() {
        this.list_FinalData = this.list_BackupData;
        for (let i = 0; i < this.list_Icons.length; i++) {
            this.list_Icons[i].variant = null;
        }
        this.template.querySelector('[data-id="datatable"]').selectedRows = this.list_SelectedData;

    }
    getSelectedName(event) {
        const selectedRows = event.detail.selectedRows;
        if (selectedRows.length != 0) {
            this.blnWarning = false;
        }
    }
    @api downloadAllFilesZip() {
        let selectedRows = this.list_FinalData;
        let selectedFiles = [];

        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            console.log('file' + i);
            selectedFiles.push(file.stDownloadId);
        }
        console.log('selected files ', selectedFiles);
        if (selectedFiles.length == 0) {
            // this.blnWarning = true;
        } else {
            this.blnWarning = false;
            this.downloadSelectedZipFiles(selectedFiles);
            console.log('Downloaded SUCCESSFULLY');
        }
    }
    handleDeleteClickconformation() {
        let selectedRows = this.template.querySelector('lightning-datatable').getSelectedRows();
        let selectedFiles = [];

        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            console.log('file' + i);
            selectedFiles.push(
                file.stDownloadId
            );
        }
        if (selectedFiles == 0) {
            this.blnWarning = true;
        } else {
            this.blnConformationDelete = true;
        }
    }
    closeModal() {
        this.blnConformationDelete = false;
    }
    submitDetails() {

        this.handleSelectedDelete();
        this.blnConformationDelete = false;
    }
    handleSearchBtn() {
        this.blnSearchEnabled = true;
        this.blnSearchIconEnabled = false;
    }
    disableSearch() {
        this.blnSearchEnabled = false;
        this.blnSearchIconEnabled = true;
        this.list_FinalData = this.list_BackupData;
        this.template.querySelector('[data-id="datatable"]').selectedRows = this.list_SelectedData;

    }

    handleEnableSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        if (searchKey) {
            this.list_FinalData = this.list_BackupData;

            if (this.list_FinalData) {
                let searchRecords = [];

                for (let record of this.list_FinalData) {
                    let valuesArray = Object.values(record);

                    for (let val of valuesArray) {
                        console.log('val is ' + val);
                        let strVal = String(val);

                        if (strVal) {

                            if (strVal.toLowerCase().startsWith(searchKey)) {
                                searchRecords.push(record);
                                break;
                            }
                        }
                    }
                }

                console.log('Matched Accounts are ' + JSON.stringify(searchRecords));
                this.list_FinalData = searchRecords;

            }
        } else {
            this.list_FinalData = this.list_BackupData;
        }
        this.template.querySelector('[data-id="datatable"]').selectedRows = this.list_SelectedData;
    }
    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        if (selectedRows.length != 0) {
            this.blnWarning = false;
        }

        let updatedItemsSet = new Set();
        // List of selected items we maintain.
        let selectedItemsSet = new Set(this.list_SelectedData);
        // List of items currently loaded for the current view.
        let loadedItemsSet = new Set();
        this.list_FinalData.map((ele) => {
            loadedItemsSet.add(ele.stDownloadId);
        });
        console.log('loadedItemsSet', loadedItemsSet);
        if (event.detail.selectedRows) {
            event.detail.selectedRows.map((ele) => {
                updatedItemsSet.add(ele.stDownloadId);
            });
            // Add any new items to the selectedRows list
            updatedItemsSet.forEach((stDownloadId) => {
                if (!selectedItemsSet.has(stDownloadId)) {
                    selectedItemsSet.add(stDownloadId);
                }
            });
        }
        loadedItemsSet.forEach((stDownloadId) => {
            if (selectedItemsSet.has(stDownloadId) && !updatedItemsSet.has(stDownloadId)) {
                // Remove any items that were unselected.
                selectedItemsSet.delete(stDownloadId);
            }
        });
        this.list_SelectedData = [...selectedItemsSet];
        console.log('selectedRows==> ' + JSON.stringify(this.list_SelectedData));
    }
}
