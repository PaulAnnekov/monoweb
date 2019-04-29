import { IToken } from '../services/api/types';
import { serializable, date } from 'serializr';

export enum Language {
  ru = 'ru',
  uk = 'uk',
}

export interface PersonalData {
  id: string;
  uid: string;
  email: string;
  fullNameRu: string;
  fullNameUk: string;
  phone: string;
  photoAbsoluteUrl: string;
}

export interface Card {
  cardNum: string;
  uid: string;
  currency: string;
  balance: {
    balance: number;
    credit: number;
    personal: number;
    ccy: string;
  };
}

export interface IGrantTypePassword {
    channel: string;
    grant_type: string;
    password: string;
    username: string;
}

export interface IGrantTypeRefreshToken {
    grant_type: string;
    refresh_token: string;
}

export class Token {
    public static fromAPI(data: IToken): Token {
        const t = new Token();
        t.date = new Date();
        t.accessToken = data.access_token;
        t.refreshToken = data.refresh_token;
        t.expiresIn = data.expires_in;
        t.name = data.name;
        return t;
    }

    @serializable public accessToken!: string;
    @serializable public refreshToken!: string;
    @serializable(date()) private date!: Date;
    @serializable private expiresIn!: number;
    // Only exists for full privileged token.
    @serializable private name?: string;

    public isExpired(): boolean {
        return (Date.now() - this.date.getTime()) / 1000 >= this.expiresIn;
    }
}
