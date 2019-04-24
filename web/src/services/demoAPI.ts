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
          balance: 83.95,
          ccy: '980',
          credit: 0,
          personal: 83.95,
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
      colorEndItem: '#693ecc',
      colorStartItem: '#5d34ba',
      icon: 'https://icons.monobank.com.ua/stmt/restaurant_icon.png',
      id: 3,
      names: {RU: 'Кафе и рестораны', UK: 'Кафе та ресторани'},
      noFin: false,
      refused: false,
    }, {
      colorEndItem: '#078d97',
      colorStartItem: '#079096',
      icon: 'https://icons.monobank.com.ua/stmt/accrual_percent_icon.png',
      id: 21,
      names: {RU: '% на остаток', UK: '% на залишок'},
      noFin: false,
      refused: false
    }]);
  }

  async cardStatement({ accessToken }: Token, uid: string): Promise<IStatement> {
    return this.handle({panStatement: {
      listStmt: [{
        amt: 44.25,
        category: '3',
        ccy: '980',
        debit: true,
        descr: 'McDonalds',
        iconUrl: 'https://icons.monobank.com.ua/inf/icon-mdpi/mcdonalds.png',
        id: '2',
        rest: 83.95,
        tranDate: '2019-03-25T13:59:02+02:00',
        type: 'FINANCIAL',
      }, {
        amt: 128.2,
        category: '21',
        ccy: '980',
        debit: false,
        descr: 'Нарахування відсотків за лютий',
        id: '1',
        rest: 128.2,
        tranDate: '2019-03-01T09:15:14+02:00',
        type: 'FINANCIAL',
      }]
    }});
  }
}
