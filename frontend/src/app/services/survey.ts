import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Question {
  id: number;
  text: string;
  type: 'text' | 'multiple_choice' | 'scale';
  options?: string[];
}

export interface Survey {
  id?: number;
  title: string;
  description: string;
  isPublished?: boolean;
  questions?: Question[];
  createdAt?: string;
}

export interface SurveyResults {
  surveyTitle: string;
  results: {
    questionId: number;
    text: string;
    type: string;
    totalAnswers: number;
    analysis: any;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = `${environment.apiUrl}/api/surveys`;
  private publicApiUrl = `${environment.apiUrl}/api/public/surveys`;

  constructor(private http: HttpClient) { }

  getSurveys(): Observable<Survey[]> {
    return this.http.get<Survey[]>(this.apiUrl);
  }

  getSurvey(id: number): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiUrl}/${id}`);
  }

  createSurvey(survey: Survey): Observable<Survey> {
    return this.http.post<Survey>(this.apiUrl, survey);
  }

  updateSurvey(id: number, survey: Survey): Observable<Survey> {
    return this.http.put<Survey>(`${this.apiUrl}/${id}`, survey);
  }

  deleteSurvey(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSurveyResults(id: number): Observable<SurveyResults> {
    return this.http.get<SurveyResults>(`${this.apiUrl}/${id}/results`);
  }

  // Public endpoints
  getPublicSurvey(id: number): Observable<Survey> {
    return this.http.get<Survey>(`${this.publicApiUrl}/${id}`);
  }

  submitResponse(surveyId: number, answers: any[]): Observable<any> {
    return this.http.post(`${this.publicApiUrl}/${surveyId}/submit`, { answers });
  }
}
