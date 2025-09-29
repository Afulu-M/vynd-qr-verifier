import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VerificationData {
  quectelImei: string;
  quectelFullData: string;
  enclosureQrUrl: string;
  enclosureQrFullData: string;
  enclosureImei: string;
  expectedUrl: string;
  imeiMatches: boolean | null;
  urlFormatValid: boolean | null;
  failureReason: string;
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
    quectelFullData: '',
    enclosureQrUrl: '',
    enclosureQrFullData: '',
    enclosureImei: '',
    expectedUrl: '',
    imeiMatches: null,
    urlFormatValid: null,
    failureReason: '',
    batteryFile: null,
    qaFile: null,
    selectedDeviceType: 'tydenbrooks',
    validatedDevice: null
  };

  currentStep: 'quectel' | 'enclosure' | 'files' | 'complete' = 'quectel';
  isProcessing = false;
  validationFailed = false;
  private quectelScanTimeout: any = null;

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
    // Extensive logging to debug scanning
    console.log('=== Quectel Scan Debug ===');
    console.log('Raw input value:', this.verificationData.quectelImei);
    console.log('Input length:', this.verificationData.quectelImei?.length);
    console.log('Input characters:', this.verificationData.quectelImei?.split('').map((c, i) => `[${i}]: '${c}'`).join(', '));

    // Clear any existing timeout
    if (this.quectelScanTimeout) {
      clearTimeout(this.quectelScanTimeout);
      console.log('Cleared previous timeout');
    }

    // Store the complete scanned data
    this.verificationData.quectelFullData = this.verificationData.quectelImei;
    console.log('Stored in quectelFullData:', this.verificationData.quectelFullData);

    // Extract just the IMEI portion (first 15 digits) for validation
    const imeiMatch = this.verificationData.quectelImei.match(/^(\d{15})/);
    const extractedImei = imeiMatch ? imeiMatch[1] : '';
    console.log('Extracted IMEI for validation:', extractedImei);

    // Check if we have at least 15 digits (valid IMEI)
    if (extractedImei.length >= 15 && !this.validationFailed) {
      console.log('✅ Valid IMEI detected, waiting for complete input...');

      // Wait for scanner to finish inputting (delay to capture complete data)
      this.quectelScanTimeout = setTimeout(() => {
        console.log('=== Processing Complete Quectel Data ===');
        console.log('Final complete data:', this.verificationData.quectelImei);
        console.log('Final data length:', this.verificationData.quectelImei?.length);

        // Store the final complete data
        this.verificationData.quectelFullData = this.verificationData.quectelImei;
        console.log('Final stored data:', this.verificationData.quectelFullData);

        // Move to next step
        this.currentStep = 'enclosure';
        setTimeout(() => {
          this.enclosureInput?.nativeElement.focus();
        }, 100);

        this.quectelScanTimeout = null;
      }, 500); // Wait 500ms to ensure complete data is captured
    } else {
      console.log('⏳ Waiting for valid IMEI... Current length:', this.verificationData.quectelImei?.length);
    }
    console.log('=== End Quectel Scan Debug ===');
  }

  onEnclosureQrScan() {
    // Debug: Log what we captured
    console.log('QR Scan captured:', this.verificationData.enclosureQrUrl);
    console.log('URL length:', this.verificationData.enclosureQrUrl?.length);

    // Store the complete scanned data
    this.verificationData.enclosureQrFullData = this.verificationData.enclosureQrUrl;

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
    console.log('=== Extract IMEI from URL Debug ===');
    console.log('Input URL:', this.verificationData.enclosureQrUrl);
    console.log('Full Data:', this.verificationData.enclosureQrFullData);

    // Patterns to validate URLs with complete scanned data (including full Quectel data)
    // This allows for URLs like: https://dev-vynd-full.web.app/#/scan-device/869487066634998;MPY25E61D000625;4055489CD328
    // Updated patterns to be more flexible with special characters
    const tydenbrooksPatternWithData = /https:\/\/tydendigital\.com\/#\/scan-device\/(.+)$/;
    const vyndPatternWithData = /https:\/\/dev-vynd-full\.web\.app\/#\/scan-device\/(.+)$/;

    // Patterns for base URLs without any data
    const tydenbrooksBasePattern = /https:\/\/tydendigital\.com\/#\/scan-device\/?$/;
    const vyndBasePattern = /https:\/\/dev-vynd-full\.web\.app\/#\/scan-device\/?$/;

    let match = null;
    let isValidUrl = false;

    // Check if a device type is selected
    if (!this.verificationData.selectedDeviceType) {
      this.verificationData.enclosureImei = '';
      this.verificationData.urlFormatValid = false;
      this.verificationData.validatedDevice = null;
      console.log('No device type selected');
      return;
    }

    // Use complete scanned data for validation instead of just the URL
    const completeData = this.verificationData.enclosureQrFullData || this.verificationData.enclosureQrUrl;
    console.log('Complete data to validate:', completeData);
    console.log('Selected device type:', this.verificationData.selectedDeviceType);

    // Check pattern based on selected device type
    if (this.verificationData.selectedDeviceType === 'tydenbrooks') {
      // Try to match URL with complete data parameter
      match = completeData.match(tydenbrooksPatternWithData);
      console.log('Tydenbrooks pattern match:', match);
      if (match && match[1]) {
        // Extract the complete data from the URL (could be full Quectel data)
        const urlData = match[1];
        console.log('Extracted URL data:', urlData);
        // Extract IMEI (first 15 digits) for comparison purposes
        const imeiMatch = urlData.match(/^(\d{15})/);
        this.verificationData.enclosureImei = imeiMatch ? imeiMatch[1] : '';
        console.log('Extracted IMEI from URL data:', this.verificationData.enclosureImei);
        this.verificationData.urlFormatValid = true;
        this.verificationData.validatedDevice = 'tydenbrooks';
      } else {
        // Check if complete data contains a valid base URL pattern
        isValidUrl = tydenbrooksBasePattern.test(completeData);
        if (isValidUrl) {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = true; // URL format is valid
          this.verificationData.validatedDevice = 'tydenbrooks';
          console.log('Base URL detected (no data)');
        } else {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = false;
          this.verificationData.validatedDevice = null;
          console.log('Invalid URL format');
        }
      }
    } else if (this.verificationData.selectedDeviceType === 'vynd') {
      // Try to match URL with complete data parameter
      match = completeData.match(vyndPatternWithData);
      console.log('Vynd pattern match:', match);
      if (match && match[1]) {
        // Extract the complete data from the URL (could be full Quectel data)
        const urlData = match[1];
        console.log('Extracted URL data:', urlData);
        // Extract IMEI (first 15 digits) for comparison purposes
        const imeiMatch = urlData.match(/^(\d{15})/);
        this.verificationData.enclosureImei = imeiMatch ? imeiMatch[1] : '';
        console.log('Extracted IMEI from URL data:', this.verificationData.enclosureImei);
        this.verificationData.urlFormatValid = true;
        this.verificationData.validatedDevice = 'vynd';
      } else {
        // Check if complete data contains a valid base URL pattern
        isValidUrl = vyndBasePattern.test(completeData);
        if (isValidUrl) {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = true; // URL format is valid
          this.verificationData.validatedDevice = 'vynd';
          console.log('Base URL detected (no data)');
        } else {
          this.verificationData.enclosureImei = '';
          this.verificationData.urlFormatValid = false;
          this.verificationData.validatedDevice = null;
          console.log('Invalid URL format');
        }
      }
    }
    console.log('=== End Extract IMEI from URL Debug ===');
  }

  generateExpectedUrl() {
    // Generate the expected URL based on device type and Quectel data
    if (this.verificationData.quectelFullData && this.verificationData.selectedDeviceType) {
      const baseUrl = this.verificationData.selectedDeviceType === 'vynd'
        ? 'https://dev-vynd-full.web.app/#/scan-device/'
        : 'https://tydendigital.com/#/scan-device/';

      this.verificationData.expectedUrl = baseUrl + this.verificationData.quectelFullData;
      console.log('Generated expected URL:', this.verificationData.expectedUrl);
    }
  }

  validateData() {
    console.log('=== Validate Data Debug ===');
    console.log('Quectel Full Data:', this.verificationData.quectelFullData);
    console.log('Enclosure QR Full Data:', this.verificationData.enclosureQrFullData);

    // Generate expected URL
    this.generateExpectedUrl();

    // Clear previous failure reason
    this.verificationData.failureReason = '';

    // Validate complete Quectel data against complete scanned data
    if (this.verificationData.quectelFullData && this.verificationData.enclosureQrFullData) {
      // Check if the scanned URL matches the expected URL
      const scannedUrl = this.verificationData.enclosureQrFullData;
      const expectedUrl = this.verificationData.expectedUrl;

      console.log('Expected URL:', expectedUrl);
      console.log('Scanned URL:', scannedUrl);

      if (scannedUrl === expectedUrl) {
        this.verificationData.imeiMatches = true;
        this.verificationData.failureReason = '';
        console.log('✅ Perfect match! Scanned URL matches expected URL');
      } else {
        this.verificationData.imeiMatches = false;

        // Determine specific failure reason
        if (!scannedUrl.includes(this.verificationData.quectelFullData)) {
          this.verificationData.failureReason = `The scanned QR code does not contain the Quectel module data: ${this.verificationData.quectelFullData}`;
        } else if (this.verificationData.selectedDeviceType === 'vynd' && !scannedUrl.includes('dev-vynd-full.web.app')) {
          this.verificationData.failureReason = 'The scanned URL is not a Vynd device URL but Vynd device type was selected';
        } else if (this.verificationData.selectedDeviceType === 'tydenbrooks' && !scannedUrl.includes('tydendigital.com')) {
          this.verificationData.failureReason = 'The scanned URL is not a Tydenbrooks device URL but Tydenbrooks device type was selected';
        } else {
          this.verificationData.failureReason = 'The scanned URL does not match the expected format';
        }

        console.log('❌ Validation failed:', this.verificationData.failureReason);
      }

      // Extract IMEI from Quectel data for display purposes
      const imeiMatch = this.verificationData.quectelFullData.match(/^(\d{15})/);
      if (imeiMatch) {
        this.verificationData.enclosureImei = imeiMatch[1];
        console.log('Extracted IMEI for display:', this.verificationData.enclosureImei);
      }
    } else if (this.verificationData.quectelFullData && !this.verificationData.enclosureQrFullData) {
      // Missing scanned data
      this.verificationData.imeiMatches = false;
      this.verificationData.failureReason = 'No QR code was scanned from the enclosure';
      console.log('Missing enclosure QR data');
    } else if (!this.verificationData.quectelFullData && this.verificationData.urlFormatValid) {
      // No Quectel data to compare - consider this as "not applicable"
      this.verificationData.imeiMatches = null;
      this.verificationData.failureReason = '';
      console.log('No Quectel data to compare');
    } else {
      // Missing data
      this.verificationData.imeiMatches = false;
      this.verificationData.failureReason = 'Missing required data for validation';
      console.log('Missing data for validation');
    }
    console.log('Final IMEI matches result:', this.verificationData.imeiMatches);
    console.log('Failure reason:', this.verificationData.failureReason);
    console.log('=== End Validate Data Debug ===');
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
      quectelFullData: '',
      enclosureQrUrl: '',
      enclosureQrFullData: '',
      enclosureImei: '',
      expectedUrl: '',
      imeiMatches: null,
      urlFormatValid: null,
      failureReason: '',
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
