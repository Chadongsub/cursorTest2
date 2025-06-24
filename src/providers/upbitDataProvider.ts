import { DataProvider } from 'react-admin';
import { upbitApi } from '../services/upbit';

export const upbitDataProvider: DataProvider = {
  getList: async (resource, params) => {
    try {
      switch (resource) {
        case 'markets':
          const markets = await upbitApi.getMarkets();
          const krwMarkets = markets.filter(market => market.market.startsWith('KRW-'));
          return {
            data: krwMarkets as any,
            total: krwMarkets.length,
          };
        
        case 'tickers':
          const marketCodes = 'KRW-BTC,KRW-ETH,KRW-XRP,KRW-ADA,KRW-DOGE,KRW-MATIC,KRW-DOT,KRW-LTC,KRW-BCH,KRW-LINK';
          const tickers = await upbitApi.getTicker(marketCodes);
          return {
            data: tickers as any,
            total: tickers.length,
          };
        
        default:
          throw new Error(`Resource ${resource} not supported`);
      }
    } catch (error) {
      console.error('Error in getList:', error);
      throw error;
    }
  },

  getOne: async (resource, params) => {
    try {
      switch (resource) {
        case 'markets':
          const markets = await upbitApi.getMarkets();
          const market = markets.find(m => m.market === params.id);
          if (!market) throw new Error('Market not found');
          return { data: market as any };
        
        case 'tickers':
          const tickers = await upbitApi.getTicker(params.id as string);
          if (!tickers[0]) throw new Error('Ticker not found');
          return { data: tickers[0] as any };
        
        default:
          throw new Error(`Resource ${resource} not supported`);
      }
    } catch (error) {
      console.error('Error in getOne:', error);
      throw error;
    }
  },

  getMany: async (resource, params) => {
    try {
      switch (resource) {
        case 'markets':
          const markets = await upbitApi.getMarkets();
          const filteredMarkets = markets.filter(market => 
            params.ids.includes(market.market)
          );
          return { data: filteredMarkets as any };
        
        default:
          throw new Error(`Resource ${resource} not supported`);
      }
    } catch (error) {
      console.error('Error in getMany:', error);
      throw error;
    }
  },

  getManyReference: async (resource, params) => {
    return { data: [] as any, total: 0 };
  },

  create: async (resource, params) => {
    throw new Error(`Create operation not supported for ${resource}`);
  },

  update: async (resource, params) => {
    throw new Error(`Update operation not supported for ${resource}`);
  },

  updateMany: async (resource, params) => {
    throw new Error(`UpdateMany operation not supported for ${resource}`);
  },

  delete: async (resource, params) => {
    throw new Error(`Delete operation not supported for ${resource}`);
  },

  deleteMany: async (resource, params) => {
    throw new Error(`DeleteMany operation not supported for ${resource}`);
  },
}; 