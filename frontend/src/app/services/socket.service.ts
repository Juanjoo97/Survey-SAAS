import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private connected = false;

  constructor() {
    this.socket = io(environment.apiUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });
  }

  isConnected(): boolean {
    return this.connected && this.socket.connected;
  }

  joinSurvey(surveyId: number) {
    if (!this.isConnected()) {
      this.socket.once('connect', () => {
        this.emitJoin(surveyId);
      });
    } else {
      this.emitJoin(surveyId);
    }
  }

  private emitJoin(surveyId: number) {
    this.socket.emit('join-survey', surveyId);
  }

  leaveSurvey(surveyId: number) {
    this.socket.emit('leave-survey', surveyId);
  }

  //Escuchar cuando se cierra/despublica
  onSurveyClosed(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('survey-closed', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('survey-closed');
      };
    });
  }

  //Escuchar cuando se publica
  onSurveyPublished(): Observable<any> {
    return new Observable(observer => {

      this.socket.on('survey-published', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('survey-published');
      };
    });
  }

  // Escuchar nuevas encuestas publicadas globalmente
  onNewSurveyPublished(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('new-survey-published', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('new-survey-published');
      };
    });
  }

  onNewResponse(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('new-response', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('new-response');
      };
    });
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
