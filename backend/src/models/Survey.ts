import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { User } from './User';
import { Question } from './Question';

@Table({
  tableName: 'surveys',
  timestamps: true,
  createdAt: 'creationDate',
  updatedAt: 'updatedOn',
})
export class Survey extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isPublished!: boolean;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true
  })
  accessCode!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  creatorId!: number;

  @BelongsTo(() => User)
  creator!: User;

  @HasMany(() => Question, {
    foreignKey: 'surveyId',
    as: 'questions'
  })
  questions!: Question[];

  @CreatedAt
  creationDate!: Date;

  @UpdatedAt
  updatedOn!: Date;
}
