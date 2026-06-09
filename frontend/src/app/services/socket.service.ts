import { Injectable } from '@angular/core';
import type { Socket } from 'socket.io-client';
import { Observable, Subject, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  // Lazy-load socket.io-client solo cuando se necesita la conexión
  private getSocket(): Observable<Socket> {
    if (this.socket) return from(Promise.resolve(this.socket));

    return from(
      import('socket.io-client').then(({ io }) => {
        const socket = io(environment.apiUrl, {
          autoConnect: true,
          transports: ['websocket', 'polling']
        });
        socket.on('connect',    () => { this.connected = true;  });
        socket.on('disconnect', () => { this.connected = false; });
        this.socket = socket;
        return socket;
      })
    );
  }

  isConnected(): boolean {
    return this.connected && !!this.socket?.connected;
  }

  joinSurvey(surveyId: number) {
    this.getSocket().subscribe(socket => {
      if (socket.connected) {
        socket.emit('join-survey', surveyId);
      } else {
        socket.once('connect', () => socket.emit('join-survey', surveyId));
      }
    });
  }

  leaveSurvey(surveyId: number) {
    this.socket?.emit('leave-survey', surveyId);
  }

  onSurveyClosed(): Observable<any> {
    return this.getSocket().pipe(
      switchMap(socket => new Observable(observer => {
        socket.on('survey-closed', (data: any) => observer.next(data));
        return () => socket.off('survey-closed');
      }))
    );
  }

  onSurveyPublished(): Observable<any> {
    return this.getSocket().pipe(
      switchMap(socket => new Observable(observer => {
        socket.on('survey-published', (data: any) => observer.next(data));
        return () => socket.off('survey-published');
      }))
    );
  }

  onNewSurveyPublished(): Observable<any> {
    return this.getSocket().pipe(
      switchMap(socket => new Observable(observer => {
        socket.on('new-survey-published', (data: any) => observer.next(data));
        return () => socket.off('new-survey-published');
      }))
    );
  }

  onNewResponse(): Observable<any> {
    return this.getSocket().pipe(
      switchMap(socket => new Observable(observer => {
        socket.on('new-response', (data: any) => observer.next(data));
        return () => socket.off('new-response');
      }))
    );
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
