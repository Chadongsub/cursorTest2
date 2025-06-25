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
  private pingInterval: NodeJS.Timeout | null = null;

  // WebSocket 연결
  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');
      
      this.ws.onopen = () => {
        console.log('업비트 WebSocket 연결됨');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // 핑 인터벌 시작
        this.startPingInterval();
        
        // 이전 구독 복원
        if (this.subscriptions.size > 0) {
          this.subscribeToMarkets(Array.from(this.subscriptions));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('업비트 WebSocket 연결 종료:', event.code, event.reason);
        this.isConnecting = false;
        this.stopPingInterval();
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('업비트 WebSocket 오류:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  // 핑 인터벌 시작
  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30초마다 핑
  }

  // 핑 인터벌 중지
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // 재연결 처리
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
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

    // 업비트 WebSocket API 형식에 맞게 수정
    const subscribeMessage = [
      {
        ticket: 'UNIQUE_TICKET'
      },
      {
        type: 'ticker',
        codes: markets,
        isOnlyRealtime: true
      }
    ];

    try {
      this.ws.send(JSON.stringify(subscribeMessage));
      
      // 구독 목록 업데이트
      markets.forEach(market => this.subscriptions.add(market));
      
      console.log('마켓 구독:', markets);
    } catch (error) {
      console.error('구독 메시지 전송 실패:', error);
    }
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
    if (data.type === 'ticker') {
      // 티커 데이터 이벤트 발생
      this.onTickerUpdate?.(data);
    } else if (data.type === 'pong') {
      // 핑 응답 처리
      console.log('WebSocket 핑 응답 받음');
    }
  }

  // 연결 해제
  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
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

  // 콜백 함수들
  onTickerUpdate?: (ticker: UpbitTicker) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

// 싱글톤 인스턴스
export const upbitWebSocket = new UpbitWebSocketService(); 