import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SurveyService } from '../../services/survey';

@Component({
  selector: 'app-create-survey',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-survey.html',
  styleUrls: ['./create-survey.scss']
})
export class CreateSurveyComponent {
  private fb = inject(FormBuilder);
  private surveyService = inject(SurveyService);
  private router = inject(Router);

  surveyForm: FormGroup;
  error = signal<string>('');
  loading = signal<boolean>(false);

  constructor() {
    this.surveyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      questions: this.fb.array([])
    });
  }

  // Getter para las preguntas
  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  // Obtener grupo de pregunta por índice
  getQuestionGroup(i: number): FormGroup {
    return this.questions.at(i) as FormGroup;
  }

  // Obtener opciones de una pregunta
  getOptions(i: number): FormArray {
    return this.getQuestionGroup(i).get('options') as FormArray;
  }

  addQuestion() {
    const questionGroup = this.fb.group({
      text: ['', Validators.required],
      type: ['text', Validators.required],
      options: this.fb.array(['', '']) // 2 opciones por defecto para multiple_choice
    });

    this.questions.push(questionGroup);
  }

  removeQuestion(i: number) {
    if (this.questions.length > 1) {
      this.questions.removeAt(i);
    }
  }

  addOption(optionsArray: FormArray) {
    optionsArray.push(this.fb.control(''));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const options = this.getOptions(questionIndex);
    if (options.length > 2) {
      options.removeAt(optionIndex);
    }
  }

  onSubmit() {
    if (this.surveyForm.valid && this.questions.length > 0) {
      this.loading.set(true);
      this.error.set('');
      const formValue = this.surveyForm.value;

      this.surveyService.createSurvey(formValue).subscribe({
        next: (survey) => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Error al crear la encuesta');
          this.loading.set(false);
        }
      });
    } else {
      this.surveyForm.markAllAsTouched();
      this.error.set('Por favor completa todos los campos requeridos');
    }
  }
}
