import { Response } from 'express';
import { Survey } from '../models/Survey';
import { Question, QuestionType } from '../models/Question';
import { Answer } from '../models/Answer';
import { AuthRequest } from '../types';

export const createSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, questions } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;

    const survey = await Survey.create({
      title,
      description,
      creatorId: userId,
      questions
    }, {
      include: [Question]
    });

    res.status(201).json(survey);
  } catch (error) {
    res.status(500).json({
      message: 'Error creando encuesta',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const getSurveys = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;

    const surveys = await Survey.findAll({
      where: { creatorId: userId },
      order: [['creationDate', 'DESC']]
    });

    res.json(surveys);
  } catch (error) {
    res.status(500).json({
      message: 'Error en encuestas',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const getSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;

    const survey = await Survey.findOne({
      where: { id, creatorId: userId },
      include: [Question]
    });

    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrado' });
    }

    res.json(survey);
  } catch (error) {
    res.status(500).json({
      message: 'Error en encuesta',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const updateSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, isPublished, questions } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;

    // Buscar encuesta con sus preguntas
    const survey = await Survey.findOne({
      where: { id, creatorId: userId },
      include: [{ model: Question, as: 'questions' }]
    });

    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrado' });
    }

    // Detectar cambios en el estado de publicación
    const wasPublished = survey.isPublished;
    const willBePublished = wasPublished === false && isPublished === true;
    const willBeUnpublished = wasPublished === true && isPublished === false;

    // Actualizar la encuesta (título, descripción, estado)
    await survey.update({ title, description, isPublished });

    // ACTUALIZAR PREGUNTAS
    if (questions && Array.isArray(questions)) {

      // Obtener IDs de preguntas actuales
      const currentQuestions = await Question.findAll({
        where: { surveyId: id },
        attributes: ['id']
      });

      const currentIds = currentQuestions.map(q => q.id);
      const incomingIds = questions
        .filter(q => q.id)
        .map(q => q.id);

      // Eliminar preguntas que ya no están en el frontend
      const idsToDelete = currentIds.filter(qId => !incomingIds.includes(qId));
      if (idsToDelete.length > 0) {
        await Question.destroy({
          where: { id: idsToDelete }
        });
      }

      // Actualizar o crear preguntas
      for (const question of questions) {
        if (question.id) {
          // Actualizar pregunta existente
          await Question.update(
            {
              text: question.text,
              type: question.type,
              options: question.options || null
            },
            {
              where: { id: question.id, surveyId: id }
            }
          );
        } else {
          // Crear nueva pregunta
          await Question.create({
            surveyId: Number(id),
            text: question.text,
            type: question.type,
            options: question.options || null
          });
        }
      }
    }

    // WebSocket events
    const io = req.app.get('io');
    const roomName = `survey-${id}`;

    // Si se PUBLICA
    if (willBePublished) {
      const eventData = {
        surveyId: Number(id),
        surveyTitle: survey.title,
        timestamp: new Date()
      };

      io.to(roomName).emit('survey-published', eventData);
      io.emit('new-survey-published', eventData);
    }

    // Si se DESPUBLICA
    if (willBeUnpublished) {
      const eventData = {
        surveyId: Number(id),
        reason: 'unpublished',
        timestamp: new Date()
      };

      io.to(roomName).emit('survey-closed', eventData);
    }

    // Devolver encuesta actualizada con preguntas
    const updatedSurvey = await Survey.findOne({
      where: { id },
      include: [{ model: Question, as: 'questions' }]
    });

    res.json(updatedSurvey);
  } catch (error) {
    res.status(500).json({
      message: 'Error updating survey',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const deleteSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;
    const survey = await Survey.findOne({ where: { id, creatorId: userId } });

    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrado' });
    }

    await survey.destroy();

    res.json({ message: 'Encuesta eliminado satisfactoriamente' });
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar encuesta',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const getSurveyResults = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;

    // Verify survey ownership
    const survey = await Survey.findOne({
      where: { id, creatorId: userId },
    });

    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrado or acceso denegado' });
    }

    // Fetch questions with answers
    const questions = await Question.findAll({
      where: { surveyId: id },
      include: [Answer]
    });

    const results = questions.map(question => {
      const answers = question.answers || [];
      const totalAnswers = answers.length;

      let analysis: any = {};

      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const counts: Record<string, number> = {};
        if (question.options) {
          question.options.forEach(opt => counts[opt] = 0);
        }

        answers.forEach(ans => {
          if (ans.value) {
            counts[ans.value] = (counts[ans.value] || 0) + 1;
          }
        });
        analysis = { counts };
      } else if (question.type === QuestionType.SCALE) {
        let sum = 0;
        let count = 0;
        const distribution: Record<string, number> = {};

        answers.forEach(ans => {
          const val = parseInt(ans.value);
          if (!isNaN(val)) {
            sum += val;
            count++;
            distribution[ans.value] = (distribution[ans.value] || 0) + 1;
          }
        });

        analysis = {
          average: count > 0 ? sum / count : 0,
          distribution
        };
      } else if (question.type === QuestionType.TEXT) {
        analysis = {
          responses: answers.map(a => a.value).filter(v => v)
        };
      }

      return {
        questionId: question.id,
        text: question.text,
        type: question.type,
        totalAnswers,
        analysis
      };
    });

    res.json({
      surveyTitle: survey.title,
      results
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error en encuestas resultados',
      error: error instanceof Error ? error.message : error
    });
  }
};