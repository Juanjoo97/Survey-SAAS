import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, HasMany } from 'sequelize-typescript';
import { Survey } from './Survey';
import { Answer } from './Answer';

export enum QuestionType {
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
  SCALE = 'scale',
}

@Table({
  tableName: 'questions',
  timestamps: true,
})
export class Question extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  text!: string;

  @Column({
    type: DataType.ENUM(...Object.values(QuestionType)),
    allowNull: false,
  })
  type!: QuestionType;

  @Column({
    type: DataType.JSON,
  })
  options!: string[];

  @ForeignKey(() => Survey)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  surveyId!: number;

  @BelongsTo(() => Survey)
  survey!: Survey;

  @HasMany(() => Answer)
  answers!: Answer[];

  @CreatedAt
  creationDate!: Date;

  @UpdatedAt
  updatedOn!: Date;
}
