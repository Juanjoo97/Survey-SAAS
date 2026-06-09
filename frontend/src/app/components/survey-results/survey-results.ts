import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ViewChildren, QueryList, ElementRef,
  signal, inject, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SurveyService, SurveyResults } from '../../services/survey';
import { SocketService } from '../../services/socket.service';
import {
  Chart,
  BarController, BarElement, CategoryScale, LinearScale,
  PieController, ArcElement,
  Tooltip, Legend
} from 'chart.js';
import { Subscription } from 'rxjs';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, PieController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-survey-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './survey-results.html',
  styleUrls: ['./survey-results.scss']
})
export class SurveyResultsComponent implements OnInit, AfterViewChecked, OnDestroy {
  private route         = inject(ActivatedRoute);
  private surveyService = inject(SurveyService);
  private socketService = inject(SocketService);
  private cdr           = inject(ChangeDetectorRef);

  surveyId = signal<number | null>(null);
  results  = signal<SurveyResults | null>(null);
  loading  = signal<boolean>(true);
  error    = signal<string>('');

  private charts: Chart[] = [];
  private socketSubscription?: Subscription;
  private pendingChartInit = false;

  @ViewChildren('chartCanvas') chartCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        const surveyId = +id;
        this.surveyId.set(surveyId);
        this.loadResults();

        this.socketService.joinSurvey(surveyId);

        this.socketSubscription = this.socketService.onNewResponse().subscribe({
          next: (data) => {
            if (data.surveyId === surveyId) {
              this.reloadResults();
            }
          },
        });
      } else {
        this.error.set('ID de encuesta no encontrado');
        this.loading.set(false);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.pendingChartInit && this.chartCanvases?.length > 0) {
      this.pendingChartInit = false;
      this.initCharts();
    }
  }

  loadResults() {
    const id = this.surveyId();
    if (!id) return;
    this.loading.set(true);

    this.surveyService.getSurveyResults(id).subscribe({
      next: (data) => {
        this.results.set(data);
        this.loading.set(false);
        this.pendingChartInit = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error.set('No se pudieron cargar los resultados.');
        this.loading.set(false);
      }
    });
  }

  reloadResults() {
    const id = this.surveyId();
    if (!id) return;

    this.destroyCharts();

    this.surveyService.getSurveyResults(id).subscribe({
      next: (data) => {
        this.results.set(data);
        this.pendingChartInit = true;
        this.cdr.detectChanges();
      },
    });
  }

  destroyCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  initCharts() {
    const resultsData = this.results();
    if (!resultsData || !this.chartCanvases) return;

    this.destroyCharts();

    this.chartCanvases.forEach((canvasRef) => {
      const canvas     = canvasRef.nativeElement;
      const questionId = canvas.getAttribute('data-question-id');
      if (!questionId) return;

      const question = resultsData.results.find((q: any) => q.questionId === +questionId);
      if (!question) return;

      if (question.type === 'multiple_choice' && question.analysis.counts) {
        const labels = Object.keys(question.analysis.counts);
        const data   = Object.values(question.analysis.counts) as number[];

        this.charts.push(new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Respuestas',
              data,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor:     'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: { duration: 750 },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          }
        }));

      } else if (question.type === 'scale' && question.analysis.distribution) {
        const labels = Object.keys(question.analysis.distribution).sort((a, b) => +a - +b);
        const data   = labels.map(l => question.analysis.distribution[l]) as number[];

        this.charts.push(new Chart(canvas, {
          type: 'pie',
          data: {
            labels,
            datasets: [{
              label: 'Distribución',
              data,
              backgroundColor: [
                'rgba(255,99,132,0.5)', 'rgba(54,162,235,0.5)',
                'rgba(255,206,86,0.5)', 'rgba(75,192,192,0.5)',
                'rgba(153,102,255,0.5)', 'rgba(255,159,64,0.5)',
                '#ccc', '#888', '#444', '#000'
              ],
            }]
          },
          options: { responsive: true, animation: { duration: 750 } }
        }));
      }
    });
  }

  ngOnDestroy() {
    const id = this.surveyId();
    if (id) this.socketService.leaveSurvey(id);

    this.destroyCharts();
    this.socketSubscription?.unsubscribe();
  }
}
