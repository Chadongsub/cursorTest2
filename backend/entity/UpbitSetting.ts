import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class UpbitSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: true })
  useSocket!: boolean;

  @Column({ default: 2000 })
  apiInterval!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
} 