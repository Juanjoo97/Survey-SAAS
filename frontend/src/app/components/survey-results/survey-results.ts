import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SurveyService, SurveyResults } from '../../services/survey';
import { SocketService } from '../../services/socket.service';
import { Chart } from 'chart.js/auto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-survey-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './survey-results.html',
  styleUrls: ['./survey-results.scss']
})
export class SurveyResultsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private surveyService = inject(SurveyService);
  private socketService = inject(SocketService);

  surveyId = signal<number | null>(null);
  results = signal<SurveyResults | null>(null);
  loading = signal<boolean>(true);
  error = signal<string>('');

  private charts: Chart[] = [];
  private socketSubscription?: Subscription;

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

            // Verificar que sea para esta encuesta
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

  loadResults() {
    const id = this.surveyId();
    if (!id) return;
    this.loading.set(true);

    this.surveyService.getSurveyResults(id).subscribe({
      next: (data) => {
        this.results.set(data);
        this.loading.set(false);
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar los resultados.');
        this.loading.set(false);
      }
    });
  }

  reloadResults() {
    const id = this.surveyId();
    if (!id) return;

    // Destruir gráficos existentes
    this.destroyCharts();

    // Recargar datos SIN mostrar loading
    this.surveyService.getSurveyResults(id).subscribe({
      next: (data) => {
        this.results.set(data);
        setTimeout(() => this.initCharts(), 100);
      },
    });
  }

  destroyCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  initCharts() {
    const resultsData = this.results();

    if (!resultsData || !this.chartCanvases) {
      return;
    }

    this.destroyCharts();

    this.chartCanvases.forEach((canvasRef) => {
      const canvas = canvasRef.nativeElement;
      const questionId = canvas.getAttribute('data-question-id');

      if (!questionId) return;

      const question = resultsData.results.find((q: any) => q.questionId === +questionId);
      if (!question) return;

      let chart: Chart;

      if (question.type === 'multiple_choice' && question.analysis.counts) {
        const labels = Object.keys(question.analysis.counts);
        const data = Object.values(question.analysis.counts);

        chart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Respuestas',
              data: data as number[],
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: {
              duration: 750,
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });

        this.charts.push(chart);
      } else if (question.type === 'scale' && question.analysis.distribution) {
        const labels = Object.keys(question.analysis.distribution).sort((a, b) => +a - +b);
        const data = labels.map(label => question.analysis.distribution[label]);

        chart = new Chart(canvas, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              label: 'Distribución',
              data: data as number[],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)',
                '#ccc', '#888', '#444', '#000'
              ],
            }]
          },
          options: {
            responsive: true,
            animation: {
              duration: 750
            }
          }
        });

        this.charts.push(chart);
      }
    });
  }

  ngOnDestroy() {

    const id = this.surveyId();
    if (id) {
      this.socketService.leaveSurvey(id);
    }

    this.destroyCharts();

    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }
}
