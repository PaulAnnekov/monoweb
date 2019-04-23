import API, { APIError } from "./api";
import { IToken, IKeys, IOverall, ICategory, IStatement } from "./api/types";
import { IGrantTypeRefreshToken, IGrantTypePassword, Token } from "../types";

export default class DemoAPI extends API {
  private handle<T>(data: T | APIError): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (data instanceof APIError) {
          reject(data);
        } else {
          resolve(data);
        }
      }, 1000);
    });
  }

  async otp(phone: string): Promise<object> {
    return this.handle(phone === '380333333333' ? new APIError(400, {}) : {});
  }

  async token(grant: IGrantTypePassword | IGrantTypeRefreshToken): Promise<IToken> {
    return this.handle({
      access_token: '1',
      refresh_token: '1',
      expires_in: 300,
    });
  }

  async keys({ access_token }: IToken): Promise<IKeys> {
    return this.handle({
      keys: [{name: 'uah', enc_key: btoa('12345678901234567890123456789012')}],
    });
  }

  async auth({ access_token }: IToken, sign: any): Promise<IToken> {
    return this.handle(sign.sign === 'zlNeflaDXzmNHjgSq1KOjTX3WQyUi9kRe8Ec54KWru0v/ywYO4CLH+6UN4O6+DXRAFb3VjEyLAr3peOOlbL+1A==' ?
      new APIError(400, {}) : {
        access_token: '1',
        refresh_token: '1',
        expires_in: 300,
        name: 'uah',
      });
  }

  async appOverall({ accessToken }: Token): Promise<IOverall> {
    return this.handle({result: {
      personalData: {
        email: 'elon.musk@tesla.com',
        fullNameRu: 'Илон Маск',
        fullNameUk: 'Ілон Маск',
        id: '1',
        phone: '+3801234567890',
        photoAbsoluteUrl: 'https://shortlist.imgix.net/app/uploads/2018/08/02103415/elon-musk-is-finally-doing-something-we-can-all-agree-on-and-it-involves-atari-games-256x256.jpg',
        uid: '1',
      },
      cards: [{
        balance: {
          balance: 100,
          ccy: '980',
          credit: 0,
          personal: 100,
          usedCreditLimit: 0,
        },
        cardNum: '5555555555554444',
        currency: '980',
        expire: '1225',
        uid: '1',
      }],
    }});
  }

  async categories({ accessToken }: Token): Promise<ICategory[]> {
    return this.handle([{
      id: 4,
      icon: 'https://icons.monobank.com.ua/stmt/products_icon.png',
      colorStartItem: '#d9541b',
      colorEndItem: '#e96026',
      names: {
        RU: 'Продукты и супермаркеты',
        UK: 'Продукти та супермаркети',
      },
      refused: false,
      noFin: false,
    }]);
  }

  async cardStatement({ accessToken }: Token, uid: string): Promise<IStatement> {
    return this.handle({panStatement: {
      listStmt: [{
        amt: 100,
        category: '4',
        ccy: '980',
        debit: false,
        descr: 'Test',
        id: '1',
        rest: 200,
        tranDate: '2019-02-24T11:02:14+02:00',
        type: 'FINANCIAL',
      }]
    }});
  }
}
