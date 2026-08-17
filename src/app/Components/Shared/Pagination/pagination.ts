import { Component, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  pageChange = output<number>();

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  goFirst(): void {
    if (this.currentPage() !== 1) this.pageChange.emit(1);
  }

  goPrev(): void {
    if (this.currentPage() > 1) this.pageChange.emit(this.currentPage() - 1);
  }

  goNext(): void {
    if (this.currentPage() < this.totalPages()) this.pageChange.emit(this.currentPage() + 1);
  }

  goLast(): void {
    if (this.currentPage() !== this.totalPages()) this.pageChange.emit(this.totalPages());
  }
}
