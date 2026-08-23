import { Injectable, signal } from '@angular/core';
import { Stock } from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  stocks = signal<Stock[]>([]);

  addStock(stock: Stock) {
    this.stocks.update(prev => [...prev, stock]);
  }

  deleteStock(id: number) {
    this.stocks.update(prev =>
      prev.filter(item => item.id !== id)
    );
  }

  updateQuantity(id: number, quantity: number) {
    this.stocks.update(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity }
          : item
      )
    );
  }
}