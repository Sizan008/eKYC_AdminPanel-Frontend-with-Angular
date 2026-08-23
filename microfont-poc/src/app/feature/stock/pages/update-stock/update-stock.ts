import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-update-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-stock.html',
  styleUrl: './update-stock.scss'
})
export class UpdateStock {

  stockService = inject(StockService);

  stocks = this.stockService.stocks;

  increase(item: any) {
    this.stockService.updateQuantity(
      item.id,
      item.quantity + 1
    );
  }

  decrease(item: any) {

    if(item.quantity > 0){
      this.stockService.updateQuantity(
        item.id,
        item.quantity - 1
      );
    }
  }

  delete(id: number) {
    this.stockService.deleteStock(id);
  }
}