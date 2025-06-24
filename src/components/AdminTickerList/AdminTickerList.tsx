import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  BooleanField,
  ShowButton,
  Filter,
  SearchInput,
  SelectInput,
} from 'react-admin';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

const formatChangeRate = (rate: number) => {
  return `${(rate * 100).toFixed(2)}%`;
};

const PriceField = ({ record, source }: any) => {
  if (!record || !record[source]) return null;
  return <span>₩{formatPrice(record[source])}</span>;
};

const ChangeRateField = ({ record, source }: any) => {
  if (!record || !record[source]) return null;
  const rate = record[source];
  const color = rate > 0 ? '#00c851' : rate < 0 ? '#ff4444' : '#666';
  return (
    <span style={{ color, fontWeight: 'bold' }}>
      {rate > 0 ? '+' : ''}{formatChangeRate(rate)}
    </span>
  );
};

const ChangeField = ({ record, source }: any) => {
  if (!record || !record[source]) return null;
  const change = record[source];
  const color = change > 0 ? '#00c851' : change < 0 ? '#ff4444' : '#666';
  return (
    <span style={{ color, fontWeight: 'bold' }}>
      {change > 0 ? '+' : ''}₩{formatPrice(change)}
    </span>
  );
};

const TickerFilter = (props: any) => (
  <Filter {...props}>
    <SearchInput source="market" alwaysOn />
    <SelectInput 
      source="change" 
      choices={[
        { id: 'RISE', name: '상승' },
        { id: 'FALL', name: '하락' },
        { id: 'EVEN', name: '보합' },
      ]}
    />
  </Filter>
);

const TickerList = (props: any) => (
  <List {...props} filters={<TickerFilter />} perPage={25}>
    <Datagrid>
      <TextField source="market" label="마켓" />
      <PriceField source="trade_price" label="현재가" />
      <ChangeField source="change_price" label="변동" />
      <ChangeRateField source="change_rate" label="변동률" />
      <NumberField source="trade_volume" label="거래량" />
      <PriceField source="high_price" label="고가" />
      <PriceField source="low_price" label="저가" />
      <NumberField source="acc_trade_volume_24h" label="24시간 거래량" />
      <ShowButton />
    </Datagrid>
  </List>
);

export default TickerList; 