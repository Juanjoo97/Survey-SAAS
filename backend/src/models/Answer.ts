import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SurveyResponse } from './SurveyResponse';
import { Question } from './Question';

@Table({
  tableName: 'answers',
  timestamps: true,
})
export class Answer extends Model {
  @ForeignKey(() => SurveyResponse)
  @Column({ type: DataType.INTEGER, allowNull: false })
  responseId!: number;

  @BelongsTo(() => SurveyResponse)
  surveyResponse!: SurveyResponse;

  @ForeignKey(() => Question)
  @Column({ type: DataType.INTEGER, allowNull: false })
  questionId!: number;

  @BelongsTo(() => Question)
  question!: Question;

  @Column({ type: DataType.TEXT, allowNull: true })
  value!: string;
}
