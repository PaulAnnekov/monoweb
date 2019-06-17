import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Auth from '../components/Auth';
import Pin from '../components/Pin';
import Main from '../components/Main';
import * as s from './Home.scss';
import Disclaimer from '../components/Disclaimer';
import { withTranslation, WithTranslation } from 'react-i18next';

@observer
export class Home extends React.Component<{store: RootStore} & WithTranslation, {}> {
  onDemo() {
    this.props.store.toggleDemo();
  }

  render() {
    const store = this.props.store;
    const userStore = store.currentUserStore;

    let auth;
    if (store.disclaimerView) {
      auth = <Disclaimer store={store} />;
    } else if (store.authView) {
      auth = <Auth store={userStore} />;
    } else if (store.pinView) {
      auth = <Pin store={userStore} />;
    }

    return (
      <div className={s.home}>
      {store.isDemo &&
        <button className={s['demo-exit']} onClick={() => this.onDemo()}>{this.props.t('Вийти з демо')}</button>}
      {auth ? (
        <div className={s['auth-wrapper']}>{auth}</div>
      ) : (
        <Main store={userStore} />
      )}
      </div>
    );
  }
}

export default withTranslation()(Home);
