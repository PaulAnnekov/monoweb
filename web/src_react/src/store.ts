import 'reflect-metadata'; // required by 'class-transformer'
import { serialize, deserialize, Type } from 'class-transformer';
import { Token, PersonalData, Card, Operation } from './types';
import * as api from './services/api';
import * as crypto from './services/crypto';
import {observable, computed, flow, action} from 'mobx';

function saveToken(token: Token) {
  localStorage.setItem('token', serialize(token));
}

function resetToken() {
  localStorage.removeItem('token');
}

function getToken(): Token | undefined {
  const data = localStorage.getItem('token');
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
  @observable error = false as string | boolean;
  @observable personalData = {} as PersonalData;
  @observable card = {} as Card;
  @observable statements = [] as Operation[];

  getTransactions = flow(function *(this: RootStore) {
    this.loading = true;
    this.error = false;
    try {
      const categories = yield api.categories(this.token as Token);
      const overall = yield api.appOverall(this.token as Token);
      const card = overall.result.cards[0];
      const statement = yield api.cardStatement(this.token as Token, card.uid);
      this.personalData = overall.result.personalData;
      this.statements = statement.panStatement.listStmt;
      this.card = card;
    } catch (e) {
      this.error = e.toString();
    } finally {
      this.loading = false;
    }
  });

  getOTP = flow(function *(this: RootStore, phone: string) {
    this.loading = true;
    this.error = false;
    try {
      yield api.otp(phone);
      this.otp = true;
      this.phone = phone;
    } catch (e) {
      this.error = e.toString();
    } finally {
      this.loading = false;
    }
  });

  setPIN = flow(function *(this: RootStore, pin: string) {
    this.loading = true;
    this.error = false;
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
      return;
    }
    try {
      const tempToken = yield api.token(grant);
      const keys = yield api.keys(tempToken);
      // TODO: Should we support >1 keys?
      const key = keys.keys[0];
      const sign = crypto.gen(key.enc_key, pin, tempToken.access_token);
      const token = yield api.auth(tempToken, {
        name: key.name,
        sign,
      });
      this.pin = pin;
      this.token = Token.fromAPI(token);
      saveToken(this.token);
    } catch (e) {
      this.error = e.toString();
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
