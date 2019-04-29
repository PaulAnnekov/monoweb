import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Auth from '../components/Auth';
import Pin from '../components/Pin';
import Transactions from '../components/Main';
import * as s from './Home.scss';
import Disclaimer from '../components/Disclaimer';

@observer
export class Home extends React.Component<{store: RootStore}, {}> {
  render() {
    const store = this.props.store;

    let auth;
    if (!store.disclaimer) {
      auth = <Disclaimer store={store} />
    } else if (!store.token && !store.hasGrantData) {
      auth = <Auth store={store} />
    } else if (store.token && store.isTokenExpired || !store.token && store.hasGrantData) {
      auth = <Pin store={store} />
    }

    return (
      <div className={s.home}>
      {auth ? (
        <div className={s['auth-wrapper']}>{auth}</div>
      ) : (
        <Transactions store={store} />
      )}
      </div>
    );
  }
}
