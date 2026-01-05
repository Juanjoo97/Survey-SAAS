import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SurveyService, Survey } from '../../services/survey';

@Component({
  selector: 'app-edit-survey',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-survey.html',
  styleUrls: ['./edit-survey.scss']
})
export class EditSurveyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private surveyService = inject(SurveyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  surveyForm: FormGroup;
  surveyId: number | null = null;
  error = signal<string>('');
  loading = signal<boolean>(false);
  loadingSurvey = signal<boolean>(true);

  constructor() {
    this.surveyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      questions: this.fb.array([])
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.surveyId = +id;
      this.loadSurvey(this.surveyId);
    } else {
      this.error.set('ID de encuesta no válido');
      this.loadingSurvey.set(false);
    }
  }

  loadSurvey(id: number) {
    this.loadingSurvey.set(true);

    this.surveyService.getSurvey(id).subscribe({
      next: (survey) => {
        this.populateForm(survey);
        this.loadingSurvey.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar la encuesta');
        this.loadingSurvey.set(false);
      }
    });
  }

  populateForm(survey: Survey) {
    // Rellenar título y descripción
    this.surveyForm.patchValue({
      title: survey.title,
      description: survey.description
    });

    if (!survey.questions || !Array.isArray(survey.questions)) {
      return;
    }

    // Rellenar preguntas
    const questionsArray = this.questions;

    // Limpiar preguntas existentes primero
    while (questionsArray.length > 0) {
      questionsArray.removeAt(0);
    }

    survey.questions.forEach((question) => {

      let optionsArray: FormArray;

      if (question.type === 'multiple_choice' && question.options && Array.isArray(question.options)) {
        // Crear FormArray con las opciones existentes
        optionsArray = this.fb.array(
          question.options.map(opt => this.fb.control(opt))
        );
      } else {
        // Opciones vacías para otros tipos
        optionsArray = this.fb.array([]);
      }

      const questionGroup = this.fb.group({
        id: [question.id], // ID para actualización
        text: [question.text, Validators.required],
        type: [question.type, Validators.required],
        options: optionsArray
      });

      questionsArray.push(questionGroup);
    });

  }

  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  getQuestionGroup(i: number): FormGroup {
    return this.questions.at(i) as FormGroup;
  }

  getOptions(i: number): FormArray {
    return this.getQuestionGroup(i).get('options') as FormArray;
  }

  addQuestion() {
    const questionGroup = this.fb.group({
      id: [null], // Sin ID = nueva pregunta
      text: ['', Validators.required],
      type: ['text', Validators.required],
      options: this.fb.array([]) // Inicialmente vacío
    });

    this.questions.push(questionGroup);
  }

  removeQuestion(i: number) {
    this.questions.removeAt(i);
  }

  addOption(optionsArray: FormArray) {
    optionsArray.push(this.fb.control(''));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const options = this.getOptions(questionIndex);
    if (options.length > 1) {
      options.removeAt(optionIndex);
    }
  }

  private prepareSurveyData() {
    const formValue = this.surveyForm.value;

    // Limpiar y formatear preguntas
    const cleanedQuestions = formValue.questions.map((question: any) => {
      const cleanedQuestion: any = {
        text: question.text,
        type: question.type
      };

      // Solo incluir ID si existe (para actualización)
      if (question.id) {
        cleanedQuestion.id = question.id;
      }

      // Solo incluir options si es multiple_choice y tiene opciones
      if (question.type === 'multiple_choice' && question.options) {
        cleanedQuestion.options = question.options.filter((opt: string) => opt && opt.trim() !== '');
      }

      return cleanedQuestion;
    });

    return {
      title: formValue.title,
      description: formValue.description,
      questions: cleanedQuestions
    };
  }

  onSubmit() {
    if (this.surveyForm.valid && this.questions.length > 0 && this.surveyId) {
      this.loading.set(true);
      this.error.set('');

      const surveyData = this.prepareSurveyData();


      this.surveyService.updateSurvey(this.surveyId, surveyData).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Error al actualizar la encuesta');
          this.loading.set(false);
        }
      });
    } else {
      this.surveyForm.markAllAsTouched();

      if (this.questions.length === 0) {
        this.error.set('Debes agregar al menos una pregunta');
      } else {
        this.error.set('Por favor completa todos los campos requeridos');
      }
    }
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}
