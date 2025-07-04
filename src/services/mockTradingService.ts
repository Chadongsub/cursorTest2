export interface MockAccount {
  id: string;
  balance: number; // KRW 잔고
  totalValue: number; // 총 자산 가치 (KRW + 보유 코인)
  createdAt: string;
  updatedAt: string;
}

export interface MockPosition {
  market: string;
  quantity: number; // 보유 수량
  avgPrice: number; // 평균 매수가
  totalInvested: number; // 총 투자 금액
  currentValue: number; // 현재 가치
  profitLoss: number; // 손익
  profitLossRate: number; // 손익률
}

export interface MockOrder {
  id: string;
  market: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface MockTrade {
  id: string;
  market: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  totalAmount: number;
  fee: number;
  timestamp: string;
}

export interface MockTradingStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  maxDrawdown: number;
}

class MockTradingService {
  private readonly ACCOUNT_KEY = 'mockTradingAccount';
  private readonly POSITIONS_KEY = 'mockTradingPositions';
  private readonly ORDERS_KEY = 'mockTradingOrders';
  private readonly TRADES_KEY = 'mockTradingTrades';
  private readonly TRADING_FEE = 0.0005; // 0.05% 거래 수수료

  // 계정 정보 가져오기
  getAccount(): MockAccount {
    const stored = localStorage.getItem(this.ACCOUNT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // 초기 계정 생성 (1000만원)
    const initialAccount: MockAccount = {
      id: 'mock-account-1',
      balance: 10000000,
      totalValue: 10000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.ACCOUNT_KEY, JSON.stringify(initialAccount));
    return initialAccount;
  }

  // 계정 정보 업데이트
  updateAccount(account: MockAccount): void {
    account.updatedAt = new Date().toISOString();
    localStorage.setItem(this.ACCOUNT_KEY, JSON.stringify(account));
  }

  // 포지션 목록 가져오기
  getPositions(): MockPosition[] {
    const stored = localStorage.getItem(this.POSITIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // 포지션 업데이트
  updatePositions(positions: MockPosition[]): void {
    localStorage.setItem(this.POSITIONS_KEY, JSON.stringify(positions));
  }

  // 주문 목록 가져오기
  getOrders(): MockOrder[] {
    const stored = localStorage.getItem(this.ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // 주문 추가
  addOrder(order: MockOrder): void {
    const orders = this.getOrders();
    orders.push(order);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
  }

  // 주문 업데이트
  updateOrder(orderId: string, updates: Partial<MockOrder>): void {
    const orders = this.getOrders();
    const index = orders.findIndex(order => order.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    }
  }

  // 거래 내역 가져오기
  getTrades(): MockTrade[] {
    const stored = localStorage.getItem(this.TRADES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // 거래 내역 추가
  addTrade(trade: MockTrade): void {
    const trades = this.getTrades();
    trades.push(trade);
    localStorage.setItem(this.TRADES_KEY, JSON.stringify(trades));
  }

  // 매수 주문 실행
  async placeBuyOrder(market: string, price: number, quantity: number): Promise<MockOrder> {
    const account = this.getAccount();
    const totalAmount = price * quantity;
    const fee = totalAmount * this.TRADING_FEE;
    const totalCost = totalAmount + fee;

    // 잔고 확인
    if (account.balance < totalCost) {
      throw new Error('잔고가 부족합니다.');
    }

    // 주문 생성
    const order: MockOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      market,
      type: 'buy',
      price,
      quantity,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 주문 추가
    this.addOrder(order);

    // 즉시 체결 (모의거래이므로)
    await this.executeOrder(order.id);

    return order;
  }

  // 매도 주문 실행
  async placeSellOrder(market: string, price: number, quantity: number): Promise<MockOrder> {
    const positions = this.getPositions();
    const position = positions.find(p => p.market === market);

    // 보유 수량 확인
    if (!position || position.quantity < quantity) {
      throw new Error('보유 수량이 부족합니다.');
    }

    // 주문 생성
    const order: MockOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      market,
      type: 'sell',
      price,
      quantity,
      totalAmount: price * quantity,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 주문 추가
    this.addOrder(order);

    // 즉시 체결 (모의거래이므로)
    await this.executeOrder(order.id);

    return order;
  }

  // 주문 체결
  private async executeOrder(orderId: string): Promise<void> {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order || order.status !== 'pending') {
      return;
    }

    const account = this.getAccount();
    const positions = this.getPositions();
    const fee = order.totalAmount * this.TRADING_FEE;

    if (order.type === 'buy') {
      // 매수 체결
      account.balance -= (order.totalAmount + fee);
      
      // 포지션 업데이트
      const existingPosition = positions.find(p => p.market === order.market);
      if (existingPosition) {
        // 기존 포지션에 추가
        const totalQuantity = existingPosition.quantity + order.quantity;
        const totalInvested = existingPosition.totalInvested + order.totalAmount;
        existingPosition.avgPrice = totalInvested / totalQuantity;
        existingPosition.quantity = totalQuantity;
        existingPosition.totalInvested = totalInvested;
      } else {
        // 새 포지션 생성
        positions.push({
          market: order.market,
          quantity: order.quantity,
          avgPrice: order.price,
          totalInvested: order.totalAmount,
          currentValue: order.totalAmount,
          profitLoss: 0,
          profitLossRate: 0
        });
      }

      // 거래 내역 추가
      this.addTrade({
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        market: order.market,
        type: 'buy',
        price: order.price,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        fee,
        timestamp: new Date().toISOString()
      });

    } else {
      // 매도 체결
      const position = positions.find(p => p.market === order.market);
      if (!position) {
        throw new Error('포지션을 찾을 수 없습니다.');
      }

      // 수량 차감
      position.quantity -= order.quantity;
      if (position.quantity <= 0) {
        // 포지션 완전 매도
        const index = positions.findIndex(p => p.market === order.market);
        positions.splice(index, 1);
      }

      // 잔고 추가 (수수료 차감)
      account.balance += (order.totalAmount - fee);

      // 거래 내역 추가
      this.addTrade({
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        market: order.market,
        type: 'sell',
        price: order.price,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        fee,
        timestamp: new Date().toISOString()
      });
    }

    // 주문 상태 업데이트
    order.status = 'completed';
    order.completedAt = new Date().toISOString();

    // 데이터 저장
    this.updateAccount(account);
    this.updatePositions(positions);
    this.updateOrder(orderId, { status: 'completed', completedAt: order.completedAt });
  }

  // 포지션 가치 업데이트 (현재가 반영)
  updatePositionValues(currentPrices: { [market: string]: number }): void {
    const positions = this.getPositions();
    const account = this.getAccount();

    let totalPositionValue = 0;

    positions.forEach(position => {
      const currentPrice = currentPrices[position.market];
      if (currentPrice) {
        position.currentValue = position.quantity * currentPrice;
        position.profitLoss = position.currentValue - position.totalInvested;
        position.profitLossRate = (position.profitLoss / position.totalInvested) * 100;
        totalPositionValue += position.currentValue;
      }
    });

    // 총 자산 가치 업데이트
    account.totalValue = account.balance + totalPositionValue;

    this.updatePositions(positions);
    this.updateAccount(account);
  }

  // 거래 통계 계산
  getTradingStats(): MockTradingStats {
    const trades = this.getTrades();
    const completedTrades = trades.filter(trade => trade.type === 'sell'); // 매도 완료된 거래만

    let totalProfit = 0;
    let totalLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let maxDrawdown = 0;
    let peakValue = 0;

    // 매수/매도 쌍으로 손익 계산
    const buyTrades = trades.filter(t => t.type === 'buy');
    const sellTrades = trades.filter(t => t.type === 'sell');

    for (let i = 0; i < Math.min(buyTrades.length, sellTrades.length); i++) {
      const buyTrade = buyTrades[i];
      const sellTrade = sellTrades[i];
      
      if (buyTrade.market === sellTrade.market) {
        const profit = sellTrade.totalAmount - buyTrade.totalAmount - buyTrade.fee - sellTrade.fee;
        
        if (profit > 0) {
          totalProfit += profit;
          winningTrades++;
        } else {
          totalLoss += Math.abs(profit);
          losingTrades++;
        }
      }
    }

    const totalTrades = completedTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const netProfit = totalProfit - totalLoss;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      totalLoss,
      netProfit,
      maxDrawdown
    };
  }

  // 계정 잔고 수정
  updateBalance(newBalance: number): void {
    if (newBalance < 0) {
      throw new Error('잔고는 0 이상이어야 합니다.');
    }

    const account = this.getAccount();
    account.balance = newBalance;
    account.totalValue = account.balance + this.getPositions().reduce((sum, pos) => sum + pos.currentValue, 0);
    account.updatedAt = new Date().toISOString();
    
    this.updateAccount(account);
  }

  // 포지션 수량 수정
  updatePositionQuantity(market: string, newQuantity: number): void {
    if (newQuantity < 0) {
      throw new Error('수량은 0 이상이어야 합니다.');
    }

    const positions = this.getPositions();
    const positionIndex = positions.findIndex(p => p.market === market);
    
    if (positionIndex === -1) {
      throw new Error('해당 마켓의 포지션을 찾을 수 없습니다.');
    }

    const position = positions[positionIndex];
    const oldValue = position.currentValue;
    
    // 수량과 투자 금액 업데이트
    position.quantity = newQuantity;
    position.currentValue = newQuantity * (position.currentValue / position.quantity);
    position.totalInvested = position.currentValue;
    position.avgPrice = position.totalInvested / position.quantity;
    
    // 손익 재계산
    position.profitLoss = position.currentValue - position.totalInvested;
    position.profitLossRate = (position.profitLoss / position.totalInvested) * 100;

    // 총 자산 가치 업데이트
    const account = this.getAccount();
    account.totalValue = account.balance + positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    
    this.updatePositions(positions);
    this.updateAccount(account);
  }

  // 계정 초기화
  resetAccount(): void {
    const initialAccount: MockAccount = {
      id: 'mock-account-1',
      balance: 10000000,
      totalValue: 10000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.ACCOUNT_KEY, JSON.stringify(initialAccount));
    localStorage.setItem(this.POSITIONS_KEY, JSON.stringify([]));
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify([]));
    localStorage.setItem(this.TRADES_KEY, JSON.stringify([]));
  }
}

export const mockTradingService = new MockTradingService(); 