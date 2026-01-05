import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SurveyService, Survey } from '../../services/survey';

@Component({
  selector: 'app-preview-survey',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './preview-survey.html',
  styleUrls: ['./preview-survey.scss']
})
export class PreviewSurveyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  survey = signal<Survey | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    const surveyId = this.route.snapshot.paramMap.get('id');

    if (surveyId) {

      this.surveyService.getSurvey(+surveyId).subscribe({
        next: (survey) => {
          this.survey.set(survey);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la encuesta');
          this.loading.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
