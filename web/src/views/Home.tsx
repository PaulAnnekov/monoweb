import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Auth from '../components/Auth';
import Pin from '../components/Pin';
import Transactions from '../components/Main';
import * as s from './Home.scss';

@observer
export class Home extends React.Component<{store: RootStore}, {}> {
  render() {
    const store = this.props.store;
    return (
      <div className={s.home}>
      {!store.token || store.isTokenExpired ? (
        <div className={s['auth-wrapper']}>
          {!store.token && !store.hasGrantData && <Auth store={store} />}
          {(store.token && store.isTokenExpired || !store.token && store.hasGrantData) && <Pin store={store} />}
        </div>
      ) : (<Transactions store={store} />)}
      </div>
    );
  }
}
