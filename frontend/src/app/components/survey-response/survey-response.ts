import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SurveyService, Survey, Question } from '../../services/survey';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-survey-response',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './survey-response.html',
  styleUrls: ['./survey-response.scss']
})
export class SurveyResponseComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private surveyService = inject(SurveyService);
  private socketService = inject(SocketService);
  private fb = inject(FormBuilder);

  survey = signal<Survey | null>(null);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  error = signal<string>('');
  success = signal<boolean>(false);
  surveyId = signal<number | null>(null);
  surveyClosed = signal<boolean>(false);

  responseForm: FormGroup;
  private socketSubscriptions: Subscription[] = [];

  constructor() {
    this.responseForm = this.fb.group({
      answers: this.fb.array([])
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      const surveyId = +id;
      this.surveyId.set(surveyId);

      //CONECTAR SOCKET.IO PRIMERO, ANTES DE INTENTAR CARGAR
      this.setupSocketListeners(surveyId);

      // Luego intentar cargar la encuesta
      this.loadSurvey(surveyId);
    } else {
      this.error.set('Encuesta no encontrada');
      this.loading.set(false);
    }
  }

  setupSocketListeners(surveyId: number) {
    // Unirse a la sala de la encuesta
    this.socketService.joinSurvey(surveyId);

    // Escuchar cuando se despublica
    const closedSub = this.socketService.onSurveyClosed().subscribe({
      next: (data) => {
        if (data.surveyId === surveyId) {
          this.surveyClosed.set(true);
          this.survey.set(null);
          this.error.set('No se pudo cargar la encuesta. Puede que no exista o no esté publicada.');
          this.loading.set(false);
          this.responseForm.disable();
        }
      }
    });

    // Escuchar cuando se publica
    const publishedSub = this.socketService.onSurveyPublished().subscribe({
      next: (data) => {
        if (data.surveyId === surveyId) {
          // Limpiar estados de error y recargar
          this.error.set('');
          this.surveyClosed.set(false);
          this.responseForm.enable();
          this.loadSurvey(surveyId);
        }
      }
    });

    this.socketSubscriptions.push(closedSub, publishedSub);
  }

  loadSurvey(id: number) {
    this.loading.set(true);
    this.surveyService.getPublicSurvey(id).subscribe({
      next: (survey) => {
        this.survey.set(survey);
        this.initForm(survey.questions || []);
        this.loading.set(false);
        // Limpiar cualquier error previo
        this.error.set('');
      },
      error: () => {
        this.error.set('No se pudo cargar la encuesta. Puede que no exista o no esté publicada.');
        this.loading.set(false);
      }
    });
  }

  initForm(questions: Question[]) {
    // Limpiar el FormArray primero
    const answersArray = this.responseForm.get('answers') as FormArray;
    answersArray.clear();

    // Agregar controles para cada pregunta
    questions.forEach(q => {
      answersArray.push(this.fb.group({
        questionId: [q.id, Validators.required],
        value: ['', Validators.required]
      }));
    });
  }

  get answersControls() {
    return (this.responseForm.get('answers') as FormArray).controls;
  }

  onSubmit() {
    const surveyData = this.survey();

    if (this.surveyClosed()) {
      this.error.set('No puedes enviar respuestas porque la encuesta fue cerrada.');
      return;
    }

    if (this.responseForm.valid && surveyData?.id) {
      this.submitting.set(true);
      const answers = this.responseForm.value.answers;

      this.surveyService.submitResponse(surveyData.id, answers).subscribe({
        next: () => {
          this.success.set(true);
          this.submitting.set(false);
        },
        error: () => {
          this.error.set('Error al enviar tus respuestas. Inténtalo de nuevo.');
          this.submitting.set(false);
        }
      });
    } else {
      this.responseForm.markAllAsTouched();
    }
  }

  ngOnDestroy() {
    const id = this.surveyId();
    if (id) {
      this.socketService.leaveSurvey(id);
    }

    // Limpiar todas las suscripciones
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }
}
