import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Survey } from './Survey';
import { User } from './User';
import { Answer } from './Answer';

@Table({
  tableName: 'survey_responses',
  timestamps: true,
})
export class SurveyResponse extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Survey)
  @Column({ type: DataType.INTEGER, allowNull: false })
  surveyId!: number;

  @BelongsTo(() => Survey)
  survey!: Survey;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => Answer, 'responseId')
  answers!: Answer[];
}
