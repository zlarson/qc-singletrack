import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrailDto } from '../models/trail-dto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrailService {
  private readonly apiUrl = environment.apiUrl;
  private readonly apiKey = environment.apiKey;

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
