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
