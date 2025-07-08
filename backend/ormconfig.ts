import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: '211.198.251.172',
  port: 3306,
  username: 'trading',
  password: 'trading',
  database: 'trading',
  synchronize: true, // 개발 시 true, 운영 시 false 권장
  logging: true,
  entities: [__dirname + '/entity/*.ts'],
}); 