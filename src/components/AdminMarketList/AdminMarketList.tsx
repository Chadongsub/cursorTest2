import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  BooleanField,
  ReferenceField,
  EditButton,
  ShowButton,
  Filter,
  SearchInput,
  SelectInput,
} from 'react-admin';

const MarketFilter = (props: any) => (
  <Filter {...props}>
    <SearchInput source="korean_name" alwaysOn />
    <SelectInput 
      source="market" 
      choices={[
        { id: 'KRW-BTC', name: '비트코인' },
        { id: 'KRW-ETH', name: '이더리움' },
        { id: 'KRW-XRP', name: '리플' },
        { id: 'KRW-ADA', name: '에이다' },
        { id: 'KRW-DOGE', name: '도지코인' },
      ]}
    />
  </Filter>
);

const MarketList = (props: any) => (
  <List {...props} filters={<MarketFilter />} perPage={25}>
    <Datagrid>
      <TextField source="market" label="마켓 코드" />
      <TextField source="korean_name" label="한국명" />
      <TextField source="english_name" label="영문명" />
      <ShowButton />
    </Datagrid>
  </List>
);

export default MarketList; 