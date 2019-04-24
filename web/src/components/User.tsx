import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Error from './Error';
import Loader from './Loader';
import * as s from './User.scss';
import { moneyFormat, currency } from '../services/utils';

@observer
export default class extends React.Component<{store: RootStore}, {}> {
  componentDidMount() {
    this.props.store.getPersonalData();
  }

  render() {
    const store = this.props.store;

    return (
      <div className={s.user}>
      {store.personalData &&
        <div className={s["user-info"]}>
          <img className={s.photo} src={store.personalData.photoAbsoluteUrl} />
          <div className="name">{store.personalData.fullNameUk}</div>
        </div>
      }
      {store.cards &&
        <div className={s["card-info"]}>
          <span
            className={s.balance}
          >{ moneyFormat(store.cards[0].balance.balance) } { currency(store.cards[0].balance.ccy) }</span> (
          <span className="card">*{ store.cards[0].cardNum.slice(-4) }</span>)
        </div>
      }
      { store.error && <Error message={store.error} /> }
      { store.loading && <Loader /> }
      </div>
    );
  }
}
