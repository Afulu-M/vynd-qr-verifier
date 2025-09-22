import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VerificationData {
  quectelImei: string;
  enclosureQrUrl: string;
  enclosureImei: string;
  imeiMatches: boolean | null;
  urlFormatValid: boolean | null;
  batteryFile: File | null;
  qaFile: File | null;
  selectedDeviceType: 'tydenbrooks' | 'vynd' | null;
  validatedDevice: 'tydenbrooks' | 'vynd' | null;
}

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.scss'
})
export class VerificationComponent {
  @ViewChild('quectelInput') quectelInput!: ElementRef;
  @ViewChild('enclosureInput') enclosureInput!: ElementRef;
  @ViewChild('batteryFileInput') batteryFileInput!: ElementRef;
  @ViewChild('qaFileInput') qaFileInput!: ElementRef;

  verificationData: VerificationData = {
    quectelImei: '',
    enclosureQrUrl: '',
    enclosureImei: '',
    imeiMatches: null,
    urlFormatValid: null,
    batteryFile: null,
    qaFile: null,
    selectedDeviceType: 'tydenbrooks',
    validatedDevice: null
  };

  currentStep: 'quectel' | 'enclosure' | 'files' | 'complete' = 'quectel';
  isProcessing = false;
  validationFailed = false;

  constructor(private router: Router) {}

  ngAfterViewInit() {
    // Auto-focus on Quectel input for barcode scanner
    this.focusQuectelInput();
  }

  focusQuectelInput() {
    setTimeout(() => {
      this.quectelInput?.nativeElement.focus();
    }, 100);
  }

  onQuectelScan() {
    if (this.verificationData.quectelImei.length >= 15 && !this.validationFailed) {
      console.log('Quectel IMEI scanned:', this.verificationData.quectelImei);
      this.currentStep = 'enclosure';
      setTimeout(() => {
        this.enclosureInput?.nativeElement.focus();
      }, 100);
    }
  }

  onEnclosureQrScan() {
    // Debug: Log what we captured
    console.log('QR Scan captured:', this.verificationData.enclosureQrUrl);
    console.log('URL length:', this.verificationData.enclosureQrUrl?.length);

    // Only process if we have a URL that looks complete (starts with http)
    if (this.verificationData.enclosureQrUrl &&
        this.verificationData.enclosureQrUrl.startsWith('http') &&
        !this.validationFailed) {
      this.extractImeiFromUrl();
      this.validateData();

      // Check if validation failed
      if (this.verificationData.urlFormatValid === false) {
        this.validationFailed = true;
      } else if (this.verificationData.imeiMatches === false) {
        this.validationFailed = true;
      } else if (this.verificationData.urlFormatValid === true &&
                 (this.verificationData.imeiMatches === true || this.verificationData.imeiMatches === null)) {
        // Success: URL is valid and either IMEI matches or IMEI not in QR (null)
        this.currentStep = 'files';
      }
    }
  }

  private scanTimeout: any = null;

  onEnclosureQrInput() {
    // Clear any existing timeout
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }

    // Only process if input looks like a URL and we're not in a failed state
    if (this.verificationData.enclosureQrUrl &&
        this.verificationData.enclosureQrUrl.startsWith('https://') &&
        !this.validationFailed) {

      // Wait for scanner to finish inputting (longer delay for complete URL)
      this.scanTimeout = setTimeout(() => {
        this.onEnclosureQrScan();
        this.scanTimeout = null;
      }, 200); // Increased delay to allow complete URL input
    }
  }

  onDeviceTypeChange() {
    // Re-validate the URL if we already have one
    if (this.verificationData.enclosureQrUrl) {
      this.extractImeiFromUrl();
      this.validateData();
    }
  }

  extractImeiFromUrl() {
    // Patterns for URLs with IMEI
    const tydenbrooksPatternWithImei = /https:\/\/tydendigital\.com\/#\/scan-device\/(\d{15})/;
    const vyndPatternWithImei = /https:\/\/dev-vynd-full\.web\.app\/#\/scan-device\/(\d{15})/;

    // Patterns for base URLs without IMEI
    const tydenbrooksBasePattern = /https:\/\/tydendigital\.com\/#\/scan-device\/?$/;
    const vyndBasePattern = /https:\/\/dev-vynd-full\.web\.app\/#\/scan-device\/?$/;

    let match = null;
    let isBaseUrl = false;

    // Check if a device type is selected
    if (!this.verificationData.selectedDeviceType) {
      this.verificationData.enclosureImei = '';
      this.verificationData.urlFormatValid = false;
      this.verificationData.validatedDevice = null;
      return;
    }

    // Check pattern based on selected device type
    if (this.verificationData.selectedDeviceType === 'tydenbrooks') {
      // First try to match URL with IMEI
      match = this.verificationData.enclosureQrUrl.match(tydenbrooksPatternWithImei);
      if (match && match[1]) {
        this.verificationData.enclosureImei = match[1];
        this.verificationData.urlFormatValid = true;
        this.verificationData.validatedDevice = 'tydenbrooks';
      } else {
        // Check if it's a base URL (valid format but no IMEI)
        isBaseUrl = tydenbrooksBasePattern.test(this.verificationData.enclosureQrUrl);
        if (isBaseUrl) {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = true; // URL format is valid
          this.verificationData.validatedDevice = 'tydenbrooks';
        } else {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = false;
          this.verificationData.validatedDevice = null;
        }
      }
    } else if (this.verificationData.selectedDeviceType === 'vynd') {
      // First try to match URL with IMEI
      match = this.verificationData.enclosureQrUrl.match(vyndPatternWithImei);
      if (match && match[1]) {
        this.verificationData.enclosureImei = match[1];
        this.verificationData.urlFormatValid = true;
        this.verificationData.validatedDevice = 'vynd';
      } else {
        // Check if it's a base URL (valid format but no IMEI)
        isBaseUrl = vyndBasePattern.test(this.verificationData.enclosureQrUrl);
        if (isBaseUrl) {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = true; // URL format is valid
          this.verificationData.validatedDevice = 'vynd';
        } else {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = false;
          this.verificationData.validatedDevice = null;
        }
      }
    }
  }

  validateData() {
    // Validate IMEI match
    if (this.verificationData.quectelImei && this.verificationData.enclosureImei) {
      // Both IMEIs available - compare them
      this.verificationData.imeiMatches =
        this.verificationData.quectelImei === this.verificationData.enclosureImei;
    } else if (this.verificationData.quectelImei && !this.verificationData.enclosureImei && this.verificationData.urlFormatValid) {
      // URL is valid but doesn't contain IMEI - consider this as "not applicable" rather than failure
      this.verificationData.imeiMatches = null; // Will be handled as "IMEI not in QR code"
    } else {
      // Missing data
      this.verificationData.imeiMatches = false;
    }
  }

  onBatteryFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.verificationData.batteryFile = file;
    }
  }

  onQaFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.verificationData.qaFile = file;
    }
  }

  canSave(): boolean {
    return !!(
      this.verificationData.quectelImei &&
      this.verificationData.enclosureQrUrl &&
      this.verificationData.imeiMatches !== null &&
      this.verificationData.urlFormatValid !== null
    );
  }

  async saveVerification() {
    if (!this.canSave()) return;

    this.isProcessing = true;
    
    // Simulate save process
    console.log('Saving verification data:', this.verificationData);
    
    // Here you would normally send to backend
    setTimeout(() => {
      this.isProcessing = false;
      this.currentStep = 'complete';
      alert('Verification data saved successfully!');
    }, 1000);
  }

  startNewVerification(keepDeviceType: boolean = false) {
    const currentDeviceType = this.verificationData.selectedDeviceType;
    this.verificationData = {
      quectelImei: '',
      enclosureQrUrl: '',
      enclosureImei: '',
      imeiMatches: null,
      urlFormatValid: null,
      batteryFile: null,
      qaFile: null,
      selectedDeviceType: keepDeviceType ? currentDeviceType : 'tydenbrooks',
      validatedDevice: null
    };
    this.validationFailed = false;
    this.currentStep = 'quectel';
    this.focusQuectelInput();
  }

  restartVerification() {
    this.startNewVerification(true); // Keep device type
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
