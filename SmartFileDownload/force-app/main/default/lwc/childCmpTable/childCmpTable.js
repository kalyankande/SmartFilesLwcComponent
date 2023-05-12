import { LightningElement, api, track } from "lwc";
//import {    ShowToastEvent} from 'lightning/platformShowToastEvent';
//import {    loadScript,    loadStyle} from 'lightning/platformResourceLoader';
import CLSFD0005 from "@salesforce/label/c.CLSFD0005";
//import getIcon from '@salesforce/resourceUrl/getIcon';
import { NavigationMixin } from "lightning/navigation";
import getAttachments from "@salesforce/apex/SD_ClassDownloadAll.getAttachments";
const actions = [
    {
        label: "Preview",
        name: "view"
    },
    {
        label: "Delete",
        name: "delete"
    }
];
const columns = [
    {
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
        label: "Last Modified By",
        fieldName: "dtModifiedDate",
        sortable: "true",
        type: "date",
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
        label: "Size ",
        fieldName: "size",
        sortable: "true"
    },
    {
        type: "action",
        typeAttributes: {
            rowActions: actions
        }
    }
];

export default class childCmpTable extends NavigationMixin(LightningElement) {
    // Attributes to display error messages and warnings
    @track stErrorMessage = "No Files";
    @track bError = true;
    @track bWarning = false;
    @track stCustomLabel = CLSFD0005;

    // Attributes to store platform details
    @track stCommunity;
    @track bLightningExperience = false;

    // To toggle spinner
    @track bSpinner = false;
    @api bDirect;
    // Attributes for Data table
    @track backupData = [];
    @track data = [];
    @track selectedData = [];
    @track allSelectedData = [];
    @track selectedMap = {};
    @track columns = columns;
    @track sortedDirection = "asc";
    @track sortedBy;

    // Attributes for Lightning Data Service
    @api currentRecord;
    @api recordId;

    // Attribute Map with Key as Id and Value as Version data
    @track fileBodyMap = {};
    @track icons = [];

    // Attributes to display details and actions
    @track title = "Smart Download";
    @track iconName = "standard:document";
    @track buttonLabel = "Download As Zip";
    @track buttonLabelv2 = "Download";
    @track bDisabled = true;
    @track bEnableTable = false;
    @api bIconFilter = false;
    @track bEnableFilter;
    @track finalData = [];
    @track sortedBy;
    @track sortedDirection;
    @track sortColumns = [];
    @track defaultSort = "asc";

    constructor() {
        super();
        const style = document.createElement("style");
        style.innerText = `.ligtning-table-cc .slds-table tbody tr{
            height: 40px !important;
        }
        .ligtning-table-cc .custom-icon .slds-icon_x-small{
            width:2rem;
            height:2rem;
        }`;
        document.querySelector("head").appendChild(style);
    }

    connectedCallback() {
        this.init();
    }
    init() {
        this.bSpinner = true;

        this.getData();
    }

    getData() {
        getAttachments({
            stRecordId: this.recordId
        })
            .then((result) => {
                if (result.length == 0) {
                    this.berror = true;
                } else {
                    var tempData = [];
                    var icontype = [];
                    this.icons = [];
                    for (let i = 0; i < result.length; i++) {
                        // var temp=result[i].recordList;

                        this.data = result[i].recordList;

                        const map = new Map();
                        for (let j = 0; j < this.data.length; j++) {
                            var size = this.updateContentSize(this.data[j].inContentSize);
                            var tempicontype = this.iconType(this.data[j].stExtension);
                            var tempStoreData = {
                                stTitle: this.data[j].stTitle,
                                stOwnerId: this.data[j].stOwnerId,
                                dtModifiedDate: this.data[j].dtModifiedDate,
                                size: size,
                                stOwner: this.data[j].stOwner,
                                stExtension: tempicontype,
                                stDownloadId: this.data[j].stDownloadId,
                                fileExtension: this.data[j].stExtension
                            };
                            tempData.push(tempStoreData);
                            icontype.push(tempicontype);
                            map.set(tempicontype, this.data[j].stExtension);
                        }
                        console.log("map", map);
                        var tempicons = Array.from(new Set(icontype));

                        for (let i = 0; i < tempicons.length; i++) {
                            let tempMap = {
                                name: map.get(tempicons[i]).toUpperCase(),
                                filetype: tempicons[i]
                            };
                            this.icons.push(tempMap);
                            console.log("this.icons", JSON.stringify(this.icons));
                        }
                    }

                    this.bDisabled = false;
                    this.finalData = tempData;
                    this.backupData = tempData;
                    console.log("backupData", this.backupData);
                    let data_clone = JSON.parse(JSON.stringify(this.finalData));
                    this.finalData = data_clone.sort(this.sortBy("dtModifiedDate", this.defaultSort));
                    this.bEnableTable = true;
                    this.bSpinner = false;
                    this.bError = false;
                }
            })
            .catch((error) => {
                console.log(JSON.stringify(error));
                // this.handleError(error);
                this.bSpinner = false;
            });
    }

    updateContentSize(stSize) {
        if (stSize > 0) {
            stSize = stSize / 1024;
            if (stSize < 1) {
                stSize = stSize * 1000;
                stSize = Math.round(stSize);
                return stSize.toString() + " B";
            }
            stSize = Math.round(stSize);
            if (stSize < 1024) {
                return stSize.toString() + " KB";
            } else {
                stSize = stSize / 1024;
                stSize = stSize.toFixed(2);
                return stSize.toString() + " MB";
            }
        } else {
            return "0 KB";
        }
    }
    iconType(stType) {
        var iconName = "";
        var name = "";
        if (stType === "xls" || stType === "xlsx") {
            iconName = "doctype:excel";
            name = "XLS";
        } else if (stType === "doc" || stType === "docx") {
            iconName = "doctype:word";
            name = "DOC";
        } else if (stType === "ppt" || stType === "pptx") {
            iconName = "doctype:ppt";
            name = "PPT";
        } else if (stType === "pdf") {
            iconName = "doctype:pdf";
            name = "PDF";
        } else if (stType === "txt") {
            iconName = "doctype:txt";
            name = "TXT";
        } else if (stType === "html") {
            iconName = "doctype:html";
            name = "HTML";
        } else if (stType === "csv") {
            iconName = "doctype:csv";
            name = "CSV";
        } else if (stType === "zip" || stType === "rar") {
            iconName = "doctype:zip";
            name = "ZIP";
        } else if (stType === "xml") {
            iconName = "doctype:xml";
            name = "XML";
        } else if (stType === "mp4") {
            iconName = "doctype:mp4";
            name = "MP4";
        } else if (stType === "png" || stType === "jpg" || stType === "jpeg" || stType === "bmp" || stType === "gif") {
            iconName = "doctype:image";
            name = "IMG";
        } else {
            iconName = "doctype:attachment";
            name = "ATCH";
        }
        return iconName;
    }
    updateColumnSorting(event) {
        let fieldName = "";
        let fieldName1 = event.detail.fieldName;
        if (fieldName1 == "icon") fieldName = "stTitle";
        let sortDirection = event.detail.sortDirection;
        // assign the latest attribute with the sorted column fieldName and sorted direction
        this.sortedBy = fieldName1;
        this.sortedDirection = sortDirection;
        console.log("Sort fieldName: " + fieldName);
        console.log("sort direction: " + sortDirection);

        let reverse = sortDirection !== "asc";

        let data_clone = JSON.parse(JSON.stringify(this.finalData));

        console.log("BEFORE data_clone:" + JSON.stringify(data_clone));

        if (fieldName1 == "icon") {
            this.finalData = data_clone.sort(this.sortBy(fieldName, reverse));
        } else {
            this.finalData = data_clone.sort(this.sortBy(fieldName1, reverse));
        }
        console.log("AFTER data_clone:" + JSON.stringify(data_clone));
    }

    sortBy(field, reverse, primer) {
        console.log("Sort by:reverse:" + reverse);

        var key = function (x) {
            return primer ? primer(x[field]) : x[field];
        };

        return function (a, b) {
            var A = key(a),
                B = key(b);

            if (A === undefined) A = "";
            if (B === undefined) B = "";

            return (A < B ? -1 : A > B ? 1 : 0) * [1, -1][+!!reverse];
        };
    }
    handleClickv3() {
        let selectedRows = this.template.querySelector("lightning-datatable").getSelectedRows();
        let selectedFiles = [];

        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            console.log("file" + i);
            selectedFiles.push({
                ContentDocumentId: file.stDownloadId,
                Title: file.stTitle
            });
        }
        if (selectedFiles == 0) {
            this.bWarning = true;
        } else {
            for (let i = 0; i < selectedFiles.length; i++) {
                this.bWarning = false;
                this.downloadFiles(selectedFiles[i]);
                setTimeout(() => {}, 100000);
            }
            console.log("Downloaded SUCCESSFULLY");
        }
    }

    downloadFiles(selectedFiles) {
        let file = selectedFiles;

        let fileUrl = "/sfc/servlet.shepherd/document/download/" + file.ContentDocumentId;

        const fileWindow = window.open(fileUrl, "_blank");
        console.log("id", file.ContentDocumentId);
    }
    previewHandler(event) {
        const actionName = event.detail.action.name;
        console.log(actionName);
        const row = event.detail.row;
        console.log(row);
        // this.recordId = row.stDownloadId;
        switch (actionName) {
            case "view":
                this[NavigationMixin.Navigate]({
                    type: "standard__namedPage",
                    attributes: {
                        //recordId: row.stDownloadId,
                        actionName: "view",
                        pageName: "filePreview"
                    },
                    state: {
                        selectedRecordId: row.stDownloadId
                    }
                });
                break;
            case "delete":
                this.delAccount(row);
                break;
        }
    }

    handleRefresh(event) {
        this.init();
    }
    handleMenuSelect() {
        this[NavigationMixin.Navigate]({
            type: "standard__recordRelationshipPage",
            attributes: {
                recordId: this.recordId,
                objectApiName: "Account",
                relationshipApiName: "CombinedAttachments",
                actionName: "view"
            }
        });
    }

    handleClickv2() {
        let selectedRows = this.template.querySelector("lightning-datatable").getSelectedRows();
        let selectedFiles = [];

        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            console.log("file" + i);
            selectedFiles.push(file.stDownloadId);
        }
        console.log("selected files ", selectedFiles);
        if (selectedFiles.length == 0) {
            this.bWarning = true;
        } else {
            this.bWarning = false;
            this.downloadSelectedZipFiles(selectedFiles);
            console.log("Downloaded SUCCESSFULLY");
        }
    }

    @api downloadSelectedZipFiles(selectedFiles) {
        let fileDataList = JSON.parse(JSON.stringify(selectedFiles));
        console.log("zip", selectedFiles);
        let fileIdsString = "";

        for (let i in fileDataList) {
            fileIdsString += fileDataList[i] + "/";
        }

        if (fileIdsString.length > 0) {
            fileIdsString = fileIdsString.replace(/.$/, "?");
        }

        let fileUrl = "/sfc/servlet.shepherd/document/download/" + fileIdsString;
        const fileWindow = window.open(fileUrl, "_blank");
    }
    handleTypeFilter(event) {
        let name = event.target.label;
        // console.log('fileType'+fileType);
        this.finalData = this.backupData.filter((item) => item.fileExtension.toUpperCase() === name);

        for (let i = 0; i < this.icons.length; i++) {
            this.icons[i].variant = null;
            if (this.icons[i].name === name) {
                this.icons[i].variant = "brand";
            }
        }
        console.log("icon", this.icons);
    }
    updateToDefault() {
        this.finalData = this.backupData;
        for (let i = 0; i < this.icons.length; i++) {
            this.icons[i].variant = null;
        }
    }

    getSelectedName(event) {
        const selectedRows = event.detail.selectedRows;
        if (selectedRows.length != 0) {
            this.bWarning = false;
        }
    }

    @api test() {
        console.log("Hello");
    }

    @api
    downloadAllFilesZip() {
        console.log("514");

        let selectedRows = this.finalData;
        let selectedFiles = [];

        for (let i = 0; i < selectedRows.length; i++) {
            let file = selectedRows[i];
            console.log("file" + i);
            selectedFiles.push(file.stDownloadId);
        }
        console.log("selected files ", selectedFiles);
        if (selectedFiles.length == 0) {
            // this.bWarning = true;
        } else {
            this.bWarning = false;
            this.downloadSelectedZipFiles(selectedFiles);
            console.log("Downloaded SUCCESSFULLY");
        }
    }
}
