import { Token, PersonalData, Card } from '../types';
import API, { MainAPIError, PkiAPIError, APIError } from './api';
import * as crypto from './crypto';
import {observable, computed, flow, action, autorun} from 'mobx';
import DemoAPI from './demoAPI';
import { ICategory, IOperation, IToken, IKeys, IOverall } from './api/types';
import { getLanguage as getBrowserLanguage, genDeviceID, sha1 } from './utils';
import { t } from './i18n';
import config from '../../config.json';
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
  @observable statement: {isFull: boolean; operations: IOperation[]};
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
        }
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
      this.processAPIError(e);
    }
  });

  getPersonalData = flow(function *(this: UserStore) {
    this.loading = true;
    this.error = false;
    try {
      const overall: IOverall = yield this.api.appOverall(this.token as Token);
      this.cards = overall.result.cards.filter((c) => {
        return c.state !== 'IDLE';
      });
      this.personalData = overall.result.personalData;
    } catch (e) {
      this.processAPIError(e);
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
      this.processAPIError(e);
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
      this.processAPIError(e);
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
        if (!this.tempToken) {
          this.tempToken = yield this.api.token({
            grant_type: 'refresh_token',
            refresh_token: this.token.refreshToken,
          });
        }
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
      this.processAPIError(e);
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
          input = config.CORS_PROXY.replace('{url}', encodeURIComponent(input as string));
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

  private processAPIError(e: Error) {
    if (e instanceof APIError) {
      console.error(e.verbose());
    }
    if (e instanceof MainAPIError && e.isInvalidToken()) {
      this.resetUserData();
      this.isTokenExpiredError = true;
      this.error = t('Час сесії вийшов, увійдіть заново');
      return;
    }
    if (e instanceof PkiAPIError && this.token && e.isInvalidToken()) {
      this.tempToken = null;
      this.keys = null;
      this.token = undefined;
      this.error = t('Авторизація на цьому пристрої скинулася, увійдіть заново');
      return;
    }
    this.error = e.toString();
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
    autorun(this.trackNavigation.bind(this));
  }

  @computed
  get currentUserStore() {
    return this.isDemo ? this.demoUserStore : this.userStore;
  }

  @computed
  get disclaimerView() {
    return !this.disclaimer && !this.isDemo;
  }

  @computed
  get authView() {
    const userStore = this.currentUserStore;
    return !this.disclaimerView && !userStore.token && !userStore.hasGrantData;
  }

  @computed
  get pinView() {
    const userStore = this.currentUserStore;
    return userStore.token && userStore.isTokenExpired || !userStore.token && userStore.hasGrantData;
  }

  @computed
  get mainView() {
    return !this.disclaimerView && !this.authView && !this.pinView;
  }

  @action
  toggleDemo() {
    this.isDemo = !this.isDemo;
    i18next.changeLanguage(this.currentUserStore.language);
  }

  private trackNavigation() {
    const userStore = this.currentUserStore;
    // For privacy don't store original monobank user ID.
    ga('set', 'userId', userStore.personalData ? sha1(userStore.personalData.id) : null);
    const views = {
      '/disclaimer': this.disclaimerView,
      '/auth': this.authView,
      '/auth/pin': this.pinView,
      '/': this.mainView,
    };
    Object.entries(views).some(([view, isCurrent]) => {
      if (!isCurrent) {
        return;
      }
      ga('set', 'page', view);
      ga('send', 'pageview');
      return true;
    });
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
