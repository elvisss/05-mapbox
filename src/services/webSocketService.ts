import { io, Socket } from 'socket.io-client';

export default class WebsocketService {
  private static _instance: WebsocketService;
  public socket: Socket;
  public socketStatus = false;
  public usuario = null;

  constructor() {
    this.socket = io(process.env.VUE_APP_WSURL);
    this.checkStatus();
  }

  static get instance(): WebsocketService {
    if (!this._instance) {
      this._instance = new WebsocketService();
    }
    return this._instance;
  }

  checkStatus(): void {
    this.socket.on('connect', () => {
      console.log('connected');
      this.socketStatus = true;
    });

    this.socket.on('disconnect', () => {
      console.log('disconnected');
      this.socketStatus = false;
    });
  }

  emit(event: string, payload?: any, callback?: () => void): void {
    console.log('emitting...', event);
    this.socket.emit(event, payload, callback);
  }

  listen(event: string, callback: (payload: any) => void): void {
    this.socket.on(event, (payload) => {
      callback(payload);
    });
  }
}
