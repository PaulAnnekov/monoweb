import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Error from './Error';
import Loader from './Loader';
import * as s from './User.scss';
import { moneyFormat, currency } from '../services/utils';
import { Card } from '../types';

@observer
export default class extends React.Component<{store: RootStore}, {}> {
  componentDidMount() {
    this.props.store.getPersonalData();
  }

  getCardName(card: Card) {
    // TODO: Translate.
    const names = {
      980: 'Гривнева',
      840: 'Доларова',
      978: 'Єврова',
    };

    return names[card.currency];
  }

  render() {
    const store = this.props.store;

    return (
      <div className={s.user}>
      {store.cards &&
        <div className={s.cards}>
          {store.cards.map((c) => {
            return <div className={s['card-info'] + (c.uid == store.selectedCard ? ` ${s.selected}` : '')} key={c.uid}>
              <div className={s.name}>{this.getCardName(c)} <span className="number">(*{ c.cardNum.slice(-4) })</span></div>
              <div className={s.balance}>{ moneyFormat(c.balance.balance) } { currency(c.balance.ccy) }</div>
            </div>
          })}
        </div>
      }
      {store.personalData &&
        <div className={s["user-info"]}>
          <img className={s.photo} src={store.personalData.photoAbsoluteUrl} />
          <div className="name">{store.personalData.fullNameUk}</div>
        </div>
      }
      { store.error && <Error message={store.error} /> }
      { store.loading && <Loader /> }
      </div>
    );
  }
}
