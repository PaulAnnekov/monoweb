import Vue from 'vue';
import Vuex, { ActionContext } from 'vuex';
import 'reflect-metadata'; // required by 'class-transformer'
import { serialize, deserialize, Type } from 'class-transformer';
import { Token, IGrantTypePassword, IGrantTypeRefreshToken } from './types';
import ky from 'ky';
import * as api from './services/api';
import * as crypto from './services/crypto';

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

Vue.use(Vuex);

const initialState = {
  token: getToken(),
  phone: '',
  otp: false,
  code: '',
  pin: '',
  loading: false,
  error: false as string | boolean,
  personalData: {},
  card: {},
  statements: [],
};

type StateType = typeof initialState;

export default new Vuex.Store({
  state: initialState,
  getters: {
    hasGrantData(state: StateType) {
      return state.code && state.phone || state.token;
    },
  },
  mutations: {
    setPersonalData(state: StateType, personalData: object) {
      state.personalData = personalData;
    },
    setStatements(state: StateType, statements: []) {
      state.statements = statements;
    },
    setCard(state: StateType, card: object) {
      state.card = card;
    },
    setPin(state: StateType, pin: string) {
      state.pin = pin;
    },
    setToken(state: StateType, token: Token) {
      state.token = token;
      saveToken(token);
    },
    setCode(state: StateType, code: string) {
      state.code = code;
    },
    setPhone(state: StateType, phone: string) {
      state.phone = phone;
    },
    loading(state: StateType, isLoading: boolean) {
      state.loading = isLoading;
    },
    otpSuccess(state: StateType) {
      state.otp = true;
    },
    error(state: StateType, message: string) {
      state.error = message;
    },
  },
  actions: {
    async getTransactions({ commit }: ActionContext<StateType, StateType>) {
      commit('loading', true);
      commit('error', false);
      try {
        const overall = await api.appOverall(this.state.token as Token);
        const card = overall.result.cards[0];
        const statement = await api.cardStatement(this.state.token as Token, card.uid);
        commit('setPersonalData', overall.result.personalData);
        commit('setStatements', statement.panStatement.listStmt);
        commit('setCard', card);
      } catch (e) {
        commit('error', e.toString());
      } finally {
        commit('loading', false);
      }
    },
    async getOTP({ commit }: ActionContext<StateType, StateType>, phone: string) {
      commit('loading', true);
      commit('error', false);
      try {
        await api.otp(phone);
        commit('otpSuccess');
        commit('setPhone', phone);
      } catch (e) {
        commit('error', e.toString());
      } finally {
        commit('loading', false);
      }
    },
    async setPIN({ commit }: ActionContext<StateType, StateType>, pin: string) {
      commit('loading', true);
      commit('error', false);
      let grant;
      if (this.state.code) {
        grant = {
          channel: 'sms',
          grant_type: 'password',
          password: this.state.code,
          username: this.state.phone,
        };
      } else if (this.state.token) {
        grant = {
          grant_type: 'refresh_token',
          refresh_token: this.state.token.refreshToken,
        };
      } else {
        commit('error', 'Ошибка приложения');
        commit('loading', false);
        return;
      }
      try {
        const tempToken = await api.token(grant);
        const keys = await api.keys(tempToken);
        // TODO: Should we support >1 keys?
        const key = keys.keys[0];
        const sign = crypto.gen(key.enc_key, pin, tempToken.access_token);
        const token = await api.auth(tempToken, {
          name: key.name,
          sign,
        });
        commit('setPin', pin);
        commit('setToken', Token.fromAPI(token));
      } catch (e) {
        commit('error', e.toString());
      } finally {
        commit('loading', false);
      }
    },

  },
});
