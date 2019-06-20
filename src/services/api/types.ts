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
    personalData: {
      email: string;
      fullNameRu: string;
      fullNameUk: string;
      id: string;
      phone: string;
      photoAbsoluteUrl: string;
      uid: string;
    };
    cards: {
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
      uid: string;
      // Looks like when state=IDLE card is not visible in UI.
      state?: string;
    }[];
  };
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
