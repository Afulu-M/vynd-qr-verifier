import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.scss'
})
export class QrScannerComponent {
  scanResult: string = '';
  isScanning: boolean = false;

  constructor(private router: Router) {}

  startScan() {
    this.isScanning = true;
    // Simulate scanning process
    setTimeout(() => {
      this.scanResult = 'Sample QR Code Data - IMEI: 123456789012345';
      this.isScanning = false;
    }, 2000);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
