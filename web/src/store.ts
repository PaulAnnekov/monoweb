import 'reflect-metadata'; // required by 'class-transformer'
import { serialize, deserialize, Type } from 'class-transformer';
import { Token, PersonalData, Card, Operation } from './types';
import API from './services/api';
import * as crypto from './services/crypto';
import {observable, computed, flow, action} from 'mobx';
import DemoAPI from './services/demoAPI';
import { ICategory } from './services/api/types';
import { getLanguage } from './services/utils';

const isDemo = false;
const tokenName = isDemo ? 'demoToken' : 'token';

function saveToken(token: Token) {
  localStorage.setItem(tokenName, serialize(token));
}

function resetToken() {
  localStorage.removeItem(tokenName);
}

function getToken(): Token | undefined {
  const data = localStorage.getItem(tokenName);
  if (!data) {
    return;
  }

  return deserialize(Token, data);
}

export class RootStore {
  @observable token = getToken();
  @observable phone = '';
  @observable otp = false;
  @observable code = '';
  @observable pin = '';
  @observable loading = false;
  @observable error: string | boolean;
  @observable personalData: PersonalData;
  @observable cards: Card[];
  @observable statement: Operation[];
  @observable categories: ICategory[];

  private api: API;

  constructor() {
    if (isDemo) {
      this.api = new DemoAPI();
    } else {
      this.api = new API({
        fetch: (input: RequestInfo, init?: RequestInit) => {
          input = 'https://cors-anywhere.herokuapp.com/' + input;
          return fetch(input, init);
        },
        language: getLanguage()
      });
    }
  }

  getTransactions = flow(function *(this: RootStore, cardUID: string) {
    this.loading = true;
    this.error = false;
    try {
      // TODO: Load once.
      const categories = yield this.api.categories(this.token as Token);
      const statement = yield this.api.cardStatement(this.token as Token, cardUID);
      this.statement = statement.panStatement.listStmt;
      this.categories = categories;
    } catch (e) {
      this.error = e.toString();
    } finally {
      this.loading = false;
    }
  });

  getPersonalData = flow(function *(this: RootStore) {
    this.loading = true;
    this.error = false;
    try {
      const overall = yield this.api.appOverall(this.token as Token);
      this.cards = overall.result.cards;
      this.personalData = overall.result.personalData;
    } catch (e) {
      this.error = e.toString();
      return;
    } finally {
      this.loading = false;
    }
    yield this.getTransactions(this.cards[0].uid);
  });

  getOTP = flow(function *(this: RootStore, phone: string) {
    this.loading = true;
    this.error = false;
    try {
      yield this.api.otp(phone);
      this.otp = true;
      this.phone = phone;
    } catch (e) {
      this.error = e.toString();
    } finally {
      this.loading = false;
    }
  });

  auth = flow(function *(this: RootStore, pin: string) {
    this.loading = true;
    this.error = false;
    this.pin = pin;
    let grant;
    if (this.code) {
      grant = {
        channel: 'sms',
        grant_type: 'password',
        password: this.code,
        username: this.phone,
      };
    } else if (this.token) {
      grant = {
        grant_type: 'refresh_token',
        refresh_token: this.token.refreshToken,
      };
    } else {
      this.error = 'Ошибка приложения';
      this.loading = false;
      this.pin = '';
      return;
    }
    try {
      const tempToken = yield this.api.token(grant);
      const keys = yield this.api.keys(tempToken);
      // TODO: Should we support >1 keys?
      const key = keys.keys[0];
      const sign = crypto.gen(key.enc_key, pin, tempToken.access_token);
      const token = yield this.api.auth(tempToken, {
        name: key.name,
        sign,
      });
      this.token = Token.fromAPI(token);
      saveToken(this.token);
    } catch (e) {
      this.error = e.toString();
      this.pin = '';
    } finally {
      this.loading = false;
    }
  });

  @action
  setCode(code: string) {
    this.code = code;
  }

  @computed
  get hasGrantData() {
    return this.code && this.phone || this.token;
  }
}

export default new RootStore();
