import {
    LightningElement,
    api,
    track
} from 'lwc';

export default class SmartDownload extends LightningElement {
    // Attributes to display details and actions
    @api title = 'Smart Download';
    @api iconName = 'standard:document';
    @api buttonLabel = 'Download All';
    @api buttonLabelv2 = 'Select';
    @track bEnableDownloadAll = true;
    @track bEnableSelect = false
    @api bEnableFilter;
    @track modalClass = 'slds-hide';

    // Attributes to store platform details
    @api recordId;

    // Attributes to perform in actions
    @track bDisabled = false;

    @track bSpinner = false;
    @track bError = false;

    handleClickv3() {
        console.log('working');
        this.bEnableSelect = true;
        this.modalClass = 'slds-show';
        this.bEnableFilter = true;

    }

    handleClick() {
        this.bEnableSelect = true;
        this.template.querySelector("c-child-cmp-table").downloadAllFilesZip();
    }

    handleRefresh() {
        this.bEnableSelect = true;
        this.template.querySelector("c-child-cmp-table").handleRefresh();



    }

    closeModal() {
        this.modalClass = 'slds-hide';

        // Handle button click action
    }

}