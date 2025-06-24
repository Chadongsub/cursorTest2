import React from 'react';
import { Admin, Resource, List, Datagrid, TextField, NumberField } from 'react-admin';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// 간단한 데이터 프로바이더
const simpleDataProvider = {
  getList: async (resource: string) => {
    const mockData = [
      { id: 1, name: '비트코인', price: 50000000, change: 2.5 },
      { id: 2, name: '이더리움', price: 3000000, change: -1.2 },
      { id: 3, name: '리플', price: 800, change: 0.8 },
    ];
    return { data: mockData as any, total: mockData.length };
  },
  getOne: async (resource: string, params: any) => {
    return { data: { id: 1, name: '비트코인', price: 50000000, change: 2.5 } as any };
  },
  getMany: async () => ({ data: [] as any }),
  getManyReference: async () => ({ data: [] as any, total: 0 }),
  create: async () => { throw new Error('Not supported'); },
  update: async () => { throw new Error('Not supported'); },
  updateMany: async () => { throw new Error('Not supported'); },
  delete: async () => { throw new Error('Not supported'); },
  deleteMany: async () => { throw new Error('Not supported'); },
} as any;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

const CryptoList = () => (
  <List>
    <Datagrid>
      <TextField source="name" label="코인명" />
      <NumberField source="price" label="가격" />
      <NumberField source="change" label="변동률 (%)" />
    </Datagrid>
  </List>
);

const SimpleAdminApp = () => (
  <ThemeProvider theme={theme}>
    <Admin dataProvider={simpleDataProvider} title="업비트 관리자">
      <Resource name="cryptos" list={CryptoList} />
    </Admin>
  </ThemeProvider>
);

export default SimpleAdminApp; 