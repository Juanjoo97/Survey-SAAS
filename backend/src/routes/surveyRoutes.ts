import { Router } from 'express';
import { createSurvey, getSurveys, getSurvey, updateSurvey, deleteSurvey, getSurveyResults } from '../controllers/surveyController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Protect all survey routes
router.use(authenticateToken);

// Rutas específicas PRIMERO, rutas dinámicas DESPUÉS
router.post('/', createSurvey);
router.get('/', getSurveys);
router.get('/:id/results', getSurveyResults);
router.get('/:id', getSurvey);
router.put('/:id', updateSurvey);
router.delete('/:id', deleteSurvey);

export default router;


