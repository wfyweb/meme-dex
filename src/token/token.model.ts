import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

// StaticData 模型
@Table({
  tableName: 'static_data',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
export class StaticData extends Model<StaticData> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @Column(DataType.STRING)
  chain!: string;

  @Column(DataType.STRING)
  symbol!: string;

  @Column(DataType.STRING)
  address!: string;

  @Column(DataType.DATE)
  open_timestamp!: Date;

  @Column(DataType.INTEGER)
  renounced_mint?: number;

  @Column(DataType.INTEGER)
  frozen?: number;

  @Column(DataType.STRING)
  burn_status?: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: Date;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updatedAt!: Date;

  @HasMany(() => DynamicData, { sourceKey: 'id', foreignKey: 'staticId' })
  dynamicData!: DynamicData[];
}

// DynamicData 模型
@Table({
  tableName: 'dynamic_data',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
export class DynamicData extends Model<DynamicData> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @ForeignKey(() => StaticData)
  @Column(DataType.STRING)
  staticId!: string;

  @BelongsTo(() => StaticData, { foreignKey: 'staticId', targetKey: 'id' })
  staticData!: StaticData;

  @Column(DataType.DECIMAL(15, 2))
  liquidity!: number;

  @Column(DataType.DECIMAL(15, 2))
  market_cap!: number;

  @Column(DataType.INTEGER)
  holder_count!: number;

  @Column(DataType.DECIMAL(25, 18))
  price!: number;

  @Column(DataType.INTEGER)
  swaps!: number;

  @Column(DataType.INTEGER)
  volume!: number;

  @Column(DataType.INTEGER)
  sells!: number;

  @Column(DataType.INTEGER)
  buys!: number;

  @Column(DataType.DECIMAL(25, 18))
  distribed?: number;

  @Column(DataType.DECIMAL(25, 18))
  insider_rate?: number;

  @Column(DataType.STRING)
  creator_token_status?: string;

  @Column(DataType.DECIMAL(25, 18))
  dev_token_burn_ratio?: number;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: Date;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updatedAt!: Date;
}
