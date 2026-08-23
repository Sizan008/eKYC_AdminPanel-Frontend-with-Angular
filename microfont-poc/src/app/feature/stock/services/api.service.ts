import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock, StockCreateDTO, StockUpdateDTO } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/stocks';
  private http = inject(HttpClient);

  getStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.baseUrl);
  }

  getStock(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.baseUrl}/${id}`);
  }

  createStock(stock: StockCreateDTO): Observable<Stock> {
    return this.http.post<Stock>(this.baseUrl, stock);
  }

  updateStock(id: number, stock: StockUpdateDTO): Observable<Stock> {
    return this.http.patch<Stock>(`${this.baseUrl}/${id}`, stock);
  }

  deleteStock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  searchStocks(query: string): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.baseUrl}?q=${encodeURIComponent(query)}`);
  }
}
