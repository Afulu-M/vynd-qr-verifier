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
    qaFile: null
  };

  currentStep: 'quectel' | 'enclosure' | 'files' | 'complete' = 'quectel';
  isProcessing = false;

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
    if (this.verificationData.quectelImei.length >= 15) {
      console.log('Quectel IMEI scanned:', this.verificationData.quectelImei);
      this.currentStep = 'enclosure';
      setTimeout(() => {
        this.enclosureInput?.nativeElement.focus();
      }, 100);
    }
  }

  onEnclosureQrScan() {
    if (this.verificationData.enclosureQrUrl) {
      this.extractImeiFromUrl();
      this.validateData();
      this.currentStep = 'files';
    }
  }

  extractImeiFromUrl() {
    const urlPattern = /https:\/\/tydendigital\.com\/#\/scan-device\/(\d{15})/;
    const match = this.verificationData.enclosureQrUrl.match(urlPattern);
    
    if (match && match[1]) {
      this.verificationData.enclosureImei = match[1];
      this.verificationData.urlFormatValid = true;
    } else {
      this.verificationData.enclosureImei = '';
      this.verificationData.urlFormatValid = false;
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

  startNewVerification() {
    this.verificationData = {
      quectelImei: '',
      enclosureQrUrl: '',
      enclosureImei: '',
      imeiMatches: null,
      urlFormatValid: null,
      batteryFile: null,
      qaFile: null
    };
    this.currentStep = 'quectel';
    this.focusQuectelInput();
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
