export interface UpbitTicker {
  market: string;
  trade_date: string;
  trade_time: string;
  trade_price: number;
  trade_volume: number;
  prev_closing_price: number;
  change: 'RISE' | 'FALL' | 'EVEN';
  change_price: number;
  change_rate: number;
  signed_change_price: number;
  signed_change_rate: number;
  trade_timestamp: number;
  acc_trade_volume_24h: number;
  acc_trade_price_24h: number;
  acc_trade_volume: number;
  acc_trade_price: number;
  acc_ask_volume: number;
  acc_bid_volume: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  market_warning: string;
}

export interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning: string;
}

class UpbitWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;
  private subscriptions = new Set<string>();
  private eventHandlers = new Map<string, Set<Function>>();
  private connectionId = 0;

  // 이벤트 핸들러 등록
  private addEventHandler(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  // 이벤트 핸들러 제거
  private removeEventHandler(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // 이벤트 발생
  private emitEvent(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`이벤트 핸들러 오류 (${event}):`, error);
        }
      });
    }
  }

  // WebSocket 연결
  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket이 이미 연결 중이거나 연결됨');
      return;
    }

    this.isConnecting = true;
    this.connectionId++;
    console.log(`WebSocket 연결 시도 중... (ID: ${this.connectionId})`);
    
    try {
      this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');
      
      this.ws.onopen = () => {
        console.log(`업비트 WebSocket 연결 성공! (ID: ${this.connectionId})`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emitEvent('connect');
        
        // 이전 구독 복원
        if (this.subscriptions.size > 0) {
          console.log('이전 구독 복원:', Array.from(this.subscriptions));
          this.subscribeToMarkets(Array.from(this.subscriptions));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          // Blob 데이터인 경우 텍스트로 변환
          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const data = JSON.parse(reader.result as string);
                this.handleMessage(data);
              } catch (error) {
                console.error('WebSocket Blob 메시지 파싱 오류:', error);
              }
            };
            reader.readAsText(event.data);
          } else {
            // 일반 텍스트 데이터인 경우
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          }
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`업비트 WebSocket 연결 종료 (ID: ${this.connectionId}):`, event.code, event.reason);
        this.isConnecting = false;
        this.emitEvent('disconnect');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error(`업비트 WebSocket 오류 (ID: ${this.connectionId}):`, error);
        this.isConnecting = false;
        this.emitEvent('error', error);
      };

    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  // 재연결 처리
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (ID: ${this.connectionId})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('WebSocket 최대 재연결 시도 횟수 초과');
    }
  }

  // 마켓 구독
  subscribeToMarkets(markets: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket이 연결되지 않았습니다. 연결 후 구독합니다.');
      markets.forEach(market => this.subscriptions.add(market));
      this.connect();
      return;
    }

    // 업비트 WebSocket API 정확한 형식 (배열로 전송)
    const subscribeMessage = [
      {
        ticket: `TICKET_${this.connectionId}`
      },
      {
        type: 'ticker',
        codes: markets,
        isOnlyRealtime: true
      }
    ];

    try {
      console.log('구독 메시지 전송:', subscribeMessage);
      this.ws.send(JSON.stringify(subscribeMessage));
      
      // 구독 목록 업데이트
      markets.forEach(market => this.subscriptions.add(market));
      
      console.log('마켓 구독 완료:', markets);
    } catch (error) {
      console.error('구독 메시지 전송 실패:', error);
    }
  }

  // 호가 구독
  subscribeOrderBook(markets: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket이 연결되지 않았습니다. 연결 후 호가 구독합니다.');
      this.connect();
      return;
    }

    // 업비트 WebSocket API 호가 구독 형식
    const subscribeMessage = [
      {
        ticket: `ORDERBOOK_${this.connectionId}`
      },
      {
        type: 'orderbook',
        codes: markets,
        isOnlyRealtime: true
      }
    ];

    try {
      console.log('호가 구독 메시지 전송:', JSON.stringify(subscribeMessage, null, 2));
      this.ws.send(JSON.stringify(subscribeMessage));
      console.log('호가 구독 완료:', markets);
    } catch (error) {
      console.error('호가 구독 메시지 전송 실패:', error);
    }
  }

  // 호가 구독 해제
  unsubscribeOrderBook(markets: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // 업비트는 개별 해제를 지원하지 않으므로 전체 재구독
    console.log('호가 구독 해제:', markets);
  }

  // 마켓 구독 해제
  unsubscribeFromMarkets(markets: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // 구독 목록에서 제거
    markets.forEach(market => this.subscriptions.delete(market));
    
    // 전체 구독을 다시 설정 (업비트는 개별 해제를 지원하지 않음)
    if (this.subscriptions.size > 0) {
      const allMarkets = Array.from(this.subscriptions);
      this.subscribeToMarkets(allMarkets);
    }
    
    console.log('마켓 구독 해제:', markets);
  }

  // 메시지 처리
  private handleMessage(data: any) {
    console.log('WebSocket 메시지 수신:', data.type, data);
    
    if (data.type === 'ticker') {
      // code 필드를 market으로 매핑
      const tickerData = {
        ...data,
        market: data.code // code를 market으로 변환
      };
      console.log('티커 데이터 수신:', tickerData.market, tickerData.trade_price);
      // 티커 데이터 이벤트 발생
      this.emitEvent('tickerUpdate', tickerData);
    } else if (data.type === 'orderbook') {
      // code 필드를 market으로 매핑
      const orderBookData = {
        ...data,
        market: data.code // code를 market으로 변환
      };
      console.log('호가 데이터 수신:', orderBookData.market, '호가 단위 수:', orderBookData.orderbook_units?.length || 0);
      // 호가 데이터 이벤트 발생
      this.emitEvent('orderBookUpdate', orderBookData);
    } else if (data.type === 'trade') {
      console.log('체결 데이터 수신:', data);
    } else {
      console.log('기타 메시지 수신:', data);
    }
  }

  // 연결 해제
  disconnect() {
    if (this.ws) {
      console.log(`WebSocket 연결 해제 (ID: ${this.connectionId})`);
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // 연결 상태 상세 확인
  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  // 이벤트 리스너 등록
  on(event: string, handler: Function) {
    this.addEventHandler(event, handler);
  }

  // 이벤트 리스너 제거
  off(event: string, handler: Function) {
    this.removeEventHandler(event, handler);
  }

  // 기존 호환성을 위한 속성들
  get onTickerUpdate() {
    const handlers = this.eventHandlers.get('tickerUpdate');
    return handlers ? Array.from(handlers)[0] as ((ticker: UpbitTicker) => void) : undefined;
  }

  set onTickerUpdate(handler: ((ticker: UpbitTicker) => void) | undefined) {
    if (handler) {
      this.addEventHandler('tickerUpdate', handler);
    }
  }

  get onConnect() {
    const handlers = this.eventHandlers.get('connect');
    return handlers ? Array.from(handlers)[0] as (() => void) : undefined;
  }

  set onConnect(handler: (() => void) | undefined) {
    if (handler) {
      this.addEventHandler('connect', handler);
    }
  }

  get onDisconnect() {
    const handlers = this.eventHandlers.get('disconnect');
    return handlers ? Array.from(handlers)[0] as (() => void) : undefined;
  }

  set onDisconnect(handler: (() => void) | undefined) {
    if (handler) {
      this.addEventHandler('disconnect', handler);
    }
  }

  get onError() {
    const handlers = this.eventHandlers.get('error');
    return handlers ? Array.from(handlers)[0] as ((error: Event) => void) : undefined;
  }

  set onError(handler: ((error: Event) => void) | undefined) {
    if (handler) {
      this.addEventHandler('error', handler);
    }
  }

  // 호가 업데이트 이벤트 핸들러
  get onOrderBookUpdate() {
    const handlers = this.eventHandlers.get('orderBookUpdate');
    return handlers ? Array.from(handlers)[0] as ((orderBook: any) => void) : undefined;
  }

  set onOrderBookUpdate(handler: ((orderBook: any) => void) | undefined) {
    if (handler) {
      this.addEventHandler('orderBookUpdate', handler);
    }
  }
}

// 싱글톤 인스턴스
export const upbitWebSocket = new UpbitWebSocketService(); 