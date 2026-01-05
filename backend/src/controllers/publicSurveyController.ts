import { Request, Response } from 'express';
import { Survey } from '../models/Survey';
import { Question } from '../models/Question';
import { SurveyResponse } from '../models/SurveyResponse';
import { Answer } from '../models/Answer';

export const getPublicSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findOne({
      where: { id, isPublished: true },
      include: [{
        model: Question,
        as: 'questions'
      }]
    });

    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrado o no esta publica' });
    }
    res.json(survey);
  } catch (error) {
    res.status(500).json({
      message: 'Error en las encuestas',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const submitSurveyResponse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, userId } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'No answers provided' });
    }

    const survey = await Survey.findByPk(id);
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Crear respuesta
    const response = await SurveyResponse.create({
      surveyId: Number(id),
      userId: userId || null
    });

    // Guardar las respuestas individuales
    if (answers && answers.length > 0) {
      const answerPromises = answers.map((ans: any) => {
        return Answer.create({
          responseId: response.id,
          questionId: ans.questionId,
          value: JSON.stringify(ans.value)
        });
      });

      await Promise.all(answerPromises);
    }

    // EMITIR SOCKET.IO
    const io = req.app.get('io');
    const roomName = `survey-${id}`;
    const eventData = {
      surveyId: Number(id),
      timestamp: new Date(),
      responseId: response.id,
      answersCount: answers.length
    };

    // Emitir el evento
    io.to(roomName).emit('new-response', eventData);
    res.status(201).json({
      message: 'Response submitted successfully',
      responseId: response.id
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error submitting response',
      error: error instanceof Error ? error.message : error
    });
  }
};
