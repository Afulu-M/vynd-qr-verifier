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
    // Only process if we have a URL that looks complete (starts with http)
    if (this.verificationData.enclosureQrUrl &&
        this.verificationData.enclosureQrUrl.startsWith('http') &&
        !this.validationFailed) {
      this.extractImeiFromUrl();
      this.validateData();

      // Check if validation failed
      if (this.verificationData.imeiMatches === false || this.verificationData.urlFormatValid === false) {
        this.validationFailed = true;
      } else if (this.verificationData.imeiMatches && this.verificationData.urlFormatValid) {
        this.currentStep = 'files';
      }
    }
  }

  onEnclosureQrInput() {
    // Check if the input is a complete URL (QR scanners typically send the full URL at once)
    if (this.verificationData.enclosureQrUrl &&
        this.verificationData.enclosureQrUrl.startsWith('https://') &&
        !this.validationFailed) {
      // Slight delay to ensure the model is updated
      setTimeout(() => {
        this.onEnclosureQrScan();
      }, 50);
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
    const tydenbrooksPattern = /https:\/\/tydendigital\.com\/#\/scan-device\/(\d{15})/;
    const vyndPattern = /https:\/\/dev-vynd-full\.web\.app\/#\/scan-device\/(\d{15})/;

    let match = null;

    // Check if a device type is selected
    if (!this.verificationData.selectedDeviceType) {
      this.verificationData.enclosureImei = '';
      this.verificationData.urlFormatValid = false;
      this.verificationData.validatedDevice = null;
      return;
    }

    // Check pattern based on selected device type
    if (this.verificationData.selectedDeviceType === 'tydenbrooks') {
      match = this.verificationData.enclosureQrUrl.match(tydenbrooksPattern);
      if (match && match[1]) {
        this.verificationData.validatedDevice = 'tydenbrooks';
      }
    } else if (this.verificationData.selectedDeviceType === 'vynd') {
      match = this.verificationData.enclosureQrUrl.match(vyndPattern);
      if (match && match[1]) {
        this.verificationData.validatedDevice = 'vynd';
      }
    }

    if (match && match[1]) {
      this.verificationData.enclosureImei = match[1];
      this.verificationData.urlFormatValid = true;
    } else {
      this.verificationData.enclosureImei = '';
      this.verificationData.urlFormatValid = false;
      this.verificationData.validatedDevice = null;
    }
  }

  validateData() {
    // Validate IMEI match
    if (this.verificationData.quectelImei && this.verificationData.enclosureImei) {
      this.verificationData.imeiMatches = 
        this.verificationData.quectelImei === this.verificationData.enclosureImei;
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
