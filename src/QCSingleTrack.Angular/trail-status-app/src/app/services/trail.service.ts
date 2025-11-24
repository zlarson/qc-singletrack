import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrailDto } from '../models/trail-dto.model';

@Injectable({
  providedIn: 'root'
})
export class TrailService {
  private readonly apiUrl = 'https://localhost:60997/api/trails';
  private readonly apiKey = 'dev-local-api-key';

  constructor(private http: HttpClient) { }
  getTrails(): Observable<TrailDto[]> {
    const headers = new HttpHeaders()
      .set('X-Api-Key', this.apiKey)
      .set('Content-Type', 'application/json');

    console.log('Making API call to:', this.apiUrl);
    console.log('With headers:', headers.keys());
    console.log('API Key being sent:', this.apiKey);

    return this.http.get<TrailDto[]>(this.apiUrl, { headers });
  }

  getTrailById(id: number): Observable<TrailDto> {
    const headers = new HttpHeaders()
      .set('X-Api-Key', this.apiKey)
      .set('Content-Type', 'application/json');

    console.log('Making API call to:', `${this.apiUrl}/${id}`);
    console.log('With headers:', headers.keys());
    console.log('API Key being sent:', this.apiKey);

    return this.http.get<TrailDto>(`${this.apiUrl}/${id}`, { headers });
  }
}
