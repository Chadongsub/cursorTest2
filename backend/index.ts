import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './ormconfig';
import { UpbitSetting } from './entity/UpbitSetting';

const app = express();

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // 여러 포트 허용
  credentials: true
}));

app.use(express.json());

// 업비트 설정 조회 (가장 최근 1개)
app.get('/api/upbit-setting', async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(UpbitSetting);
    const setting = await repo.findOne({ order: { id: 'DESC' } });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: '설정 조회 실패' });
  }
});

// 업비트 설정 저장/수정 (없으면 생성, 있으면 수정)
app.post('/api/upbit-setting', async (req, res) => {
  try {
    const { useSocket, apiInterval } = req.body;
    const repo = AppDataSource.getRepository(UpbitSetting);
    let setting = await repo.findOne({ order: { id: 'DESC' } });
    
    if (!setting) {
      setting = repo.create({ useSocket, apiInterval });
    } else {
      setting.useSocket = useSocket;
      setting.apiInterval = apiInterval;
    }
    
    await repo.save(setting);
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: '설정 저장 실패' });
  }
});

AppDataSource.initialize()
  .then(() => {
    console.log('MariaDB 연결 성공!');
    app.listen(4000, () => {
      console.log('서버 실행: http://localhost:4000');
    });
  })
  .catch((error) => console.error('DB 연결 실패:', error)); 