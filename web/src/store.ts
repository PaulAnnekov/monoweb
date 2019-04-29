import { Token, PersonalData, Card, Language } from './types';
import API, { APIError } from './services/api';
import * as crypto from './services/crypto';
import {observable, computed, flow, action} from 'mobx';
import DemoAPI from './services/demoAPI';
import { ICategory, IOperation } from './services/api/types';
import { getLanguage as getBrowserLanguage, genDeviceID } from './services/utils';
import { t } from './services/i18n';
import i18next from 'i18next';
import { create, persist } from 'mobx-persist';

const isDemo = false;

export class RootStore {
  @persist @observable language = getBrowserLanguage();
  @persist('object', Token) @observable token: Token;
  @persist @observable deviceID = genDeviceID();
  @persist @observable disclaimer = false;
  /**
   * Companion of token.isExpired() but for cases when we got HTTP error.
   */
  @observable isTokenExpiredError = false;
  @observable phone = '';
  @observable otp = false;
  @observable code = '';
  @observable pin = '';
  @observable loading = false;
  @observable error: string | boolean;
  @observable personalData: PersonalData;
  @observable cards: Card[];
  @observable statement: {isFull: boolean, operations: IOperation[]};
  @observable categories: ICategory[];
  @observable selectedCard: string;

  private api: API;

  constructor() {
    if (isDemo) {
      this.api = new DemoAPI(this.deviceID);
    } else {
      this.api = new API(this.deviceID, {
        fetch: (input: RequestInfo, init?: RequestInit) => {
          input = 'https://cors-anywhere.herokuapp.com/' + input;
          return fetch(input, init);
        },
        language: this.language,
      });
    }
    i18next.changeLanguage(this.language);
  }

  getTransactions = flow(function *(this: RootStore) {
    this.error = false;
    try {
      if (!this.categories) {
        const categories = yield this.api.categories(this.token as Token);
        this.categories = categories;
      }
      let lastStatement = this.statement && this.statement.operations.length &&
        this.statement.operations[this.statement.operations.length-1];
      const statement = yield this.api.cardStatement(
        this.token as Token,
        this.selectedCard,
        {
          direction: this.statement && 'DOWN',
          stmtId: lastStatement && lastStatement.id,
          dateFrom: lastStatement && new Date(lastStatement.dateTime),
        },
      );
      if (!this.statement) {
        this.statement = {
          isFull: statement.panStatement.full,
          operations: statement.panStatement.listStmt,
        };
      } else {
        this.statement.isFull = statement.panStatement.full;
        this.statement.operations.push(...statement.panStatement.listStmt);
      }
    } catch (e) {
      // TODO: Make a separate algorithm to check this for any request after
      // authorization.
      // Most likely 5 minutes passed and access_token expired.
      if (e instanceof APIError && e.status == 401) {
        this.resetUserData();
        this.isTokenExpiredError = true;
        this.error = t('Час сесії вийшов, увійдіть заново');
        return;
      }
      this.error = e.toString();
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
    this.changeCard(this.cards[0].uid);
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
      this.error = t('Помилка програми') as string;
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
    } catch (e) {
      this.pin = '';
      // Most likely refresh_token is invalidated by logging in on another
      // device.
      if (e instanceof APIError && e.status == 400 && this.token) {
        this.token = undefined;
        this.error = t('Авторизація на цьому пристрої скинулася, увійдіть заново');
        return;
      }
      this.error = e.toString();
    } finally {
      this.loading = false;
    }
    // Reset authorization-related state after successful auth to don't reuse
    // it when access_token will be invalidated and we will return back to
    // authorization.
    this.resetAuthData();
  });

  @action
  setCode(code: string) {
    this.code = code;
  }

  @action
  changeCard(uid: string) {
    this.selectedCard = uid;
    this.statement = undefined;
  }

  @action
  resetUserData() {
    this.personalData = undefined;
    this.cards = undefined;
    this.statement = undefined;
    this.categories = undefined;
    this.selectedCard = undefined;
  }

  @action
  resetAuthData() {
    this.code = '';
    this.pin = '';
    this.phone = '';
    this.otp = false;
    this.isTokenExpiredError = false;
  }

  @computed
  get hasGrantData() {
    return this.code && this.phone || this.token;
  }

  @computed
  get isTokenExpired() {
    return this.token && (this.token.isExpired() || this.isTokenExpiredError);
  }
}

const hydrate = create({})
const rootStore = new RootStore();
hydrate(!isDemo ? 'monowebStorage' : 'monowebDemoStorage', rootStore)

export default rootStore;
