import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SurveyService, Survey } from '../../services/survey';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private surveyService = inject(SurveyService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  username = computed(() => this.currentUser()?.username || 'usuario');
  userRole = computed(() => this.currentUser()?.role || 'creator');
  surveys = signal<Survey[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  showDeleteModal = signal<boolean>(false);
  surveyToDelete = signal<Survey | null>(null);

  showToast = signal<boolean>(false);
  toastMessage = signal<string>('');

  ngOnInit() {
    this.loadSurveys();
  }

  loadSurveys() {
    this.loading.set(true);

    this.surveyService.getSurveys().subscribe({
      next: (surveys) => {
        this.surveys.set(surveys);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Error al cargar las encuestas');
      }
    });
  }

  // Ver encuesta en modo PREVIEW (solo lectura)
  viewSurvey(survey: Survey) {
    this.router.navigate(['/preview-survey', survey.id]);
  }

  // Editar encuesta
  editSurvey(survey: Survey) {
    this.router.navigate(['/edit-survey', survey.id]);
  }

  openDeleteModal(survey: Survey) {
    this.surveyToDelete.set(survey);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.surveyToDelete.set(null);
  }

  confirmDelete() {
    const survey = this.surveyToDelete();
    if (!survey?.id) return;

    this.surveyService.deleteSurvey(survey.id).subscribe({
      next: () => {
        this.surveys.update(list => list.filter(s => s.id !== survey.id));
        this.showToastNotification('Encuesta eliminada exitosamente');
        this.closeDeleteModal();
      },
      error: (err) => {
        this.error.set('Error al eliminar la encuesta');
        this.closeDeleteModal();
      }
    });
  }

  togglePublish(survey: Survey) {
    if (!survey.id) return;

    const newStatus = !survey.isPublished;
    const updatedSurvey = { ...survey, isPublished: newStatus };

    this.surveyService.updateSurvey(survey.id, updatedSurvey).subscribe({
      next: () => {
        this.surveys.update(surveys =>
          surveys.map(s => s.id === survey.id ? { ...s, isPublished: newStatus } : s)
        );
        this.showToastNotification(
          newStatus ? 'Encuesta publicada' : 'Encuesta guardada como borrador'
        );
      },
      error: () => {
        this.error.set('Error al actualizar el estado');
      }
    });
  }

  getPublicLink(id: number): string {
    return `${window.location.origin}/survey/${id}`;
  }

  copyLink(id: number) {
    const link = this.getPublicLink(id);

    navigator.clipboard.writeText(link).then(() => {
      this.showToastNotification('Enlace copiado al portapapeles');
    });
  }

  showToastNotification(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);

    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  logout() {
    this.authService.logout();
  }
}
