export interface IToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  name?: string;
}

export interface ICategory {
  id: number;
  icon: string;
  colorStartItem: string;
  colorEndItem: string;
  names: {
    RU: string;
    UK: string;
  };
  refused: boolean;
  noFin: boolean;
}

export interface IKeys {
  keys: {
    name: string;
    enc_key: string;
  }[];
}

export interface IOverall {
  result: {
    personalData: IPersonalData;
    cards: ICard[];
  };
}

export interface IPersonalData {
  email: string;
  fullNameRu: string;
  fullNameUk: string;
  // 10 digits.
  id: string;
  phone: string;
  photoAbsoluteUrl: string;
  // 32 uppercase alphanumeric characters, same as first card uid.
  uid: string;
}

export interface ICard {
  balance: {
    balance: number;
    ccy: string;
    credit: number;
    personal: number;
    usedCreditLimit: number;
  };
  cardNum: string;
  currency: string;
  expire: string;
  // 32 uppercase alphanumeric characters.
  uid: string;
  // 1 - opened, 4 - blocked, 8 - compromised, 12 - not active, 14 - closed
  cardState: number;
}

export interface IOperation {
  // Only relevant for type: "FINANCIAL".
  amt?: number;
  category: string;
  // Only relevant for type: "FINANCIAL".
  ccy?: string;
  // Only relevant for type: "FINANCIAL".
  debit?: boolean;
  descr: string;
  // Only relevant for type: "PUSH".
  descrFull?: string;
  id: string;
  // Only relevant for type: "FINANCIAL".
  rest?: number;
  // Only relevant for type: "FINANCIAL", not always present.
  iconUrl?: string;
  dateTime: string;
  tranDate: string;
  type: string;
}

export interface IStatement {
  panStatement: {
    full: boolean;
    listStmt: IOperation[];
  };
}
