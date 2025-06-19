import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class CmsService {
  private apiUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  getRepos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/repos`);
  }

  getDocs(repo: string): Observable<any[]> {
    let params = new HttpParams().set('repo', repo);
    return this.http.get<any[]>(`${this.apiUrl}/docs`, { params });
  }

  getFile(repo: string, path: string): Observable<string> {
    let params = new HttpParams().set('repo', repo).set('path', path);
    return this.http.get(`${this.apiUrl}/file`, { params, responseType: 'text' });
  }

  saveFile(repo: string, path: string, content: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/file`, { repo, path, content, message });
  }
}
