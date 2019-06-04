import { Token, PersonalData, Card, Language } from './types';
import API, { APIError } from './services/api';
import * as crypto from './services/crypto';
import {observable, computed, flow, action} from 'mobx';
import DemoAPI from './services/demoAPI';
import { ICategory, IOperation, IToken, IKeys } from './services/api/types';
import { getLanguage as getBrowserLanguage, genDeviceID } from './services/utils';
import { t } from './services/i18n';
import i18next from 'i18next';
import { create, persist } from 'mobx-persist';

export class UserStore {
  @persist @observable language = getBrowserLanguage();
  @persist('object', Token) @observable token: Token;
  @persist @observable deviceID = genDeviceID();
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
  @observable tempToken: IToken;
  @observable keys: IKeys;

  getTransactions = flow(function *(this: UserStore) {
    this.error = false;
    try {
      if (!this.categories) {
        const categories = yield this.api.categories(this.token as Token);
        this.categories = categories;
      }
      const lastStatement = this.statement && this.statement.operations.length
        && this.statement.operations[this.statement.operations.length - 1];
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
      if (e instanceof APIError && e.status === 401) {
        this.resetUserData();
        this.isTokenExpiredError = true;
        this.error = t('Час сесії вийшов, увійдіть заново');
        return;
      }
      this.error = e.toString();
    }
  });

  getPersonalData = flow(function *(this: UserStore) {
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

  getOTP = flow(function *(this: UserStore, phone: string) {
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

  sms = flow(function *(this: UserStore) {
    this.loading = true;
    this.error = false;
    try {
      this.tempToken = yield this.api.token({
        channel: 'sms',
        grant_type: 'password',
        password: this.code,
        username: this.phone,
      });
      this.keys = yield this.api.keys(this.tempToken);
    } catch (e) {
      this.error = e.toString();
    } finally {
      this.loading = false;
    }
    this.code = '';
  });

  auth = flow(function *(this: UserStore) {
    this.loading = true;
    this.error = false;
    try {
      if (this.token) {
        this.tempToken = yield this.api.token({
          grant_type: 'refresh_token',
          refresh_token: this.token.refreshToken,
        });
        this.keys = yield this.api.keys(this.tempToken);
      }
      // TODO: Should we support >1 keys?
      const key = this.keys.keys[0];
      const sign = crypto.gen(key.enc_key, this.pin, this.tempToken.access_token);
      const token = yield this.api.auth(this.tempToken, {
        name: key.name,
        sign,
      });
      this.token = Token.fromAPI(token);
      // Reset authorization-related state after successful auth to don't reuse
      // it when access_token will be invalidated and we will return back to
      // authorization.
      this.resetAuthData();
    } catch (e) {
      this.pin = '';
      // Most likely refresh_token is invalidated by logging in on another
      // device.
      if (e instanceof APIError && e.status === 400 && this.token) {
        this.tempToken = null;
        this.keys = null;
        this.token = undefined;
        this.error = t('Авторизація на цьому пристрої скинулася, увійдіть заново');
        return;
      }
      this.error = e.toString();
    } finally {
      this.loading = false;
    }
  });

  private api: API;

  init(isDemo: boolean) {
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
    this.keys = null;
    this.tempToken = null;
    this.otp = false;
    this.isTokenExpiredError = false;
  }

  @computed
  get hasGrantData() {
    return this.tempToken && this.keys || this.token;
  }

  @computed
  get isTokenExpired() {
    return this.token && (this.token.isExpired() || this.isTokenExpiredError);
  }
}

export class RootStore {
  @persist @observable isDemo = false;
  @persist @observable disclaimer = false;
  @persist('object', UserStore) @observable userStore = new UserStore();
  @persist('object', UserStore) @observable demoUserStore = new UserStore();

  init() {
    this.userStore.init(false);
    this.demoUserStore.init(true);
    i18next.changeLanguage(this.currentUserStore.language);
  }

  @computed
  get currentUserStore() {
    return this.isDemo ? this.demoUserStore : this.userStore;
  }

  @action
  toggleDemo() {
    this.isDemo = !this.isDemo;
    i18next.changeLanguage(this.currentUserStore.language);
  }
}

const hydrate = create({});
const rootStore = new RootStore();
const hydration = hydrate('monowebStorage', rootStore)
  .then(rootStore.init.bind(rootStore));

export default async () => {
  await hydration;
  return rootStore;
};
