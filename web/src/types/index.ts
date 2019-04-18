import 'reflect-metadata'; // required by 'class-transformer'
import { Type } from 'class-transformer';

export interface Operation {
  id: string;
  type: string;
  category: string;
  descr: string;
  tranDate: string;
  // Only relevant for type='PUSH'.
  descrFull?: string;
  // Only relevant for type='FINANCIAL'.
  ccy?: string;
  iconUrl?: string;
  debit?: boolean;
  amt?: number;
  rest?: number;
}

export interface PersonalData {
  id: string;
  uid: string;
  email: string;
  fullNameEn: string;
  fullNameRu: string;
  fullNameUk: string;
  phone: string;
  photoAbsoluteUrl: string;
}

export interface Card {
  cardNum: string;
  balance: {
    balance: number;
    credit: number;
    personal: number;
    ccy: string;
  };
}

export interface IApiToken {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    name?: string;
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
    public static fromAPI(data: IApiToken): Token {
        const t = new Token();
        t.date = new Date();
        t.accessToken = data.access_token;
        t.refreshToken = data.refresh_token;
        t.expiresIn = data.expires_in;
        t.name = data.name;
        return t;
    }

    public accessToken!: string;
    public refreshToken!: string;
    @Type(() => Date)
    private date!: Date;
    private expiresIn!: number;
    // Only exists for full privileged token.
    private name?: string;

    public isExpired(): boolean {
        return (Date.now() - this.date.getTime()) / 1000 >= this.expiresIn;
    }
}
