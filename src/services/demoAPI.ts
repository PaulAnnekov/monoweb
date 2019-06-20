import API, { MainAPIError, PkiAPIError, APIError } from './api';
import { IToken, IKeys, IOverall, ICategory, IStatement } from './api/types';
import { IGrantTypeRefreshToken, IGrantTypePassword } from '../types';
import { t } from './i18n';

export default class DemoAPI extends API {
  async otp(phone: string): Promise<object> {
    return this.handle(phone === '380333333333' ?
      new PkiAPIError(400, {
        errCode: 'INVALID_PHONE',
        errText: 'Эта комбинация используется для теста ошибок',
        errType: 'toast',
      }) : {});
  }

  async token(grant: IGrantTypePassword | IGrantTypeRefreshToken): Promise<IToken> {
    return this.handle((grant as IGrantTypePassword).password === '3333' ?
      new PkiAPIError(400, {
        errCode: 'INVALID_PASSWORD',
        errText: 'Эта комбинация используется для теста ошибок',
        errType: 'toast',
      }) : {
        access_token: '1',
        refresh_token: '1',
        expires_in: 300,
      });
  }

  async keys(): Promise<IKeys> {
    return this.handle({
      keys: [{name: 'uah', enc_key: btoa('12345678901234567890123456789012')}],
    });
  }

  async auth(token: IToken, sign: any): Promise<IToken> {
    // When PIN code is '3333'.
    return this.handle(sign.sign === 'zlNeflaDXzmNHjgSq1KOjTX3WQyUi9kRe8Ec54KWru0v/ywYO4CLH+6UN4O6+DXRAFb3VjEyLAr3peOOlbL+1A==' ?
      new PkiAPIError(400, {
        errCode: 'INVALID_PIN',
        errText: 'Эта комбинация используется для теста ошибок',
        errType: 'toast',
      }) : {
        access_token: '1',
        refresh_token: '1',
        expires_in: 300,
        name: 'uah',
      });
  }

  async appOverall(): Promise<IOverall> {
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
          balance: 1955.75,
          ccy: '980',
          credit: 0,
          personal: 1955.75,
          usedCreditLimit: 0,
        },
        cardNum: '5555555555554444',
        currency: '980',
        expire: '1225',
        uid: '1',
        cardState: 1,
      }],
    }});
  }

  async categories(): Promise<ICategory[]> {
    return this.handle([{
      colorEndItem: '#5e4844',
      colorStartItem: '#4e3b37',
      icon: 'https://icons.monobank.com.ua/stmt/taxi_icon.png',
      id: 1,
      names: {RU: 'Такси', UK: 'Таксі'},
      noFin: false,
      refused: false,
    }, {
      colorEndItem: '#693ecc',
      colorStartItem: '#5d34ba',
      icon: 'https://icons.monobank.com.ua/stmt/restaurant_icon.png',
      id: 3,
      names: {RU: 'Кафе и рестораны', UK: 'Кафе та ресторани'},
      noFin: false,
      refused: false,
    }, {
      colorEndItem: '#000000',
      colorStartItem: '#000000',
      icon: 'https://icons.monobank.com.ua/stmt/refill_card_icon.png',
      id: 14,
      names: {RU: 'Пополнение карты', UK: 'Поповнення картки'},
      noFin: false,
      refused: false,
    }, {
      colorEndItem: '#078d97',
      colorStartItem: '#079096',
      icon: 'https://icons.monobank.com.ua/stmt/accrual_percent_icon.png',
      id: 21,
      names: {RU: '% на остаток', UK: '% на залишок'},
      noFin: false,
      refused: false,
    }, {
      colorEndItem: '#3e75b0',
      colorStartItem: '#4a7eb6',
      icon: 'https://icons.monobank.com.ua/stmt/deposit_icon.png',
      id: 32,
      names: {RU: 'Открытие депозита', UK: 'Відкриття депозиту'},
      noFin: false,
      refused: false,
    }]);
  }

  async cardStatement(): Promise<IStatement> {
    return this.handle({panStatement: {
      full: true,
      listStmt: [{
        amt: 93,
        category: '1',
        ccy: '980',
        debit: true,
        descr: 'Uber',
        iconUrl: 'https://icons.monobank.com.ua/inf/icon-mdpi/uber1.png',
        id: '6',
        rest: 1955.75,
        dateTime: '2019-04-03T03:00:00.000+02:00',
        tranDate: '2019-04-03T03:00:00+02:00',
        type: 'FINANCIAL',
      }, {
        amt: 68,
        category: '1',
        ccy: '980',
        debit: true,
        descr: 'Uber',
        iconUrl: 'https://icons.monobank.com.ua/inf/icon-mdpi/uber1.png',
        id: '5',
        rest: 2048.75,
        dateTime: '2019-04-03T02:00:00.000+02:00',
        tranDate: '2019-04-03T02:00:00+02:00',
        type: 'FINANCIAL',
      }, {
        amt: 20000,
        category: '32',
        ccy: '980',
        debit: true,
        descr: t('Відкриття депозиту'),
        id: '4',
        rest: 2116.75,
        dateTime: '2019-04-02T02:00:00.000+02:00',
        tranDate: '2019-04-02T02:00:00+02:00',
        type: 'FINANCIAL',
      }, {
        amt: 20000,
        category: '14',
        ccy: '980',
        debit: false,
        descr: t('За реквізитами'),
        id: '3',
        rest: 22116.75,
        dateTime: '2019-04-01T12:25:00.000+02:00',
        tranDate: '2019-04-01T12:25:00+02:00',
        type: 'FINANCIAL',
      }, {
        amt: 44.25,
        category: '3',
        ccy: '980',
        debit: true,
        descr: 'McDonalds',
        iconUrl: 'https://icons.monobank.com.ua/inf/icon-mdpi/mcdonalds.png',
        id: '2',
        rest: 2116.75,
        dateTime: '2019-03-25T13:59:02.000+02:00',
        tranDate: '2019-03-25T13:59:02+02:00',
        type: 'FINANCIAL',
      }, {
        amt: 161,
        category: '21',
        ccy: '980',
        debit: false,
        descr: t('Нарахування відсотків за лютий'),
        id: '1',
        rest: 2161,
        dateTime: '2019-03-01T09:15:14.000+02:00',
        tranDate: '2019-03-01T09:15:14+02:00',
        type: 'FINANCIAL',
      }, {
        amt: 2000,
        category: '14',
        ccy: '980',
        debit: false,
        descr: t('Від: {{whom}}', {whom: 'Джефф Безос'}),
        iconUrl: 'https://twitter.com/jeffbezos/profile_image?size=bigger',
        id: '0',
        rest: 2000,
        dateTime: '2019-02-01T00:00:00.000+02:00',
        tranDate: '2019-02-01T00:00:00+02:00',
        type: 'FINANCIAL',
      }],
    }});
  }

  private handle<T>(data: T | MainAPIError | PkiAPIError): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (data instanceof APIError) {
          reject(data);
        } else {
          resolve(data);
        }
      }, 200);
    });
  }
}
