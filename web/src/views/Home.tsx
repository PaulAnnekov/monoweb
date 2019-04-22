import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Auth from '../components/Auth';
import Pin from '../components/Pin';
import Transactions from '../components/Transactions';
import * as style from './Home.scss';

@observer
export class Home extends React.Component<{store: RootStore}, {}> {
  render() {
    const store = this.props.store;
    return (
      <div className="home">
      {!store.token || store.token.isExpired() ? (
        <div className={style['auth-wrapper']}>
          {!store.token && !store.hasGrantData && <Auth store={store} />}
          {store.token && store.token.isExpired() || !store.token && store.hasGrantData && <Pin store={store} />}
        </div>
      ) : (<Transactions store={store} />)}
      </div>
    );
  }
}
