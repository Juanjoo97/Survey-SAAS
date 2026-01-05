import { Router } from 'express';
import { getPublicSurvey, submitSurveyResponse } from '../controllers/publicSurveyController';

const router = Router();

router.get('/:id', getPublicSurvey);
router.post('/:id/submit', submitSurveyResponse);

export default router;
