import { LightningElement, api, track} from 'lwc';
export default class SmartDownload extends LightningElement {
    // Attributes to display details and actions
    @api strTitle = "Smart Download";
    @api iconName = "standard:document";
    @api buttonLabel = "Download All";
    @api buttonLabelv2 = "Select";
    @track blnEnableDownloadAll = true;
    @track blnEnableSelect = false;
    @api blnIconFilter;
    @track modalClass = "slds-hide";
    // Attributes to store platform details
    @api recordId;
    // Attributes to perform in actions
    @track blnDisabled = false;
    @track blnSpinner = false;
    btnSelect() {
        this.blnEnableSelect = true;
        this.blnIconFilter = true;
        this.modalClass = "slds-show";     
    }
    btnDownloadAll() {
        this.blnEnableSelect = true;
        this.template.querySelector("c-child-cmp-table").downloadAllFilesZip();  
    }
    btnHandleRefresh() {
        this.blnEnableSelect = true;
        this.template.querySelector("c-child-cmp-table").btnHandleRefresh();
    }
    closeModal() {
        this.modalClass = "slds-hide";
    }
}
