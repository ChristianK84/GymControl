import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentTextOutline, mailOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-menu',
  imports: [IonIcon, RouterLink],
  templateUrl: './admin-menu.html',
  styleUrl: './admin-menu.css',
})
export class AdminMenu {
  constructor() {
    addIcons({ cloudUploadOutline, documentTextOutline, mailOutline });
  }
}
