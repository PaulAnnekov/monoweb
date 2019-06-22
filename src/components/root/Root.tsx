import { observer } from 'mobx-react';
import { RootStore } from '../../services/store';
import * as React from 'react';
import Auth from '../auth/Auth';
import Pin from '../auth/Pin';
import Main from '../main/Main';
import * as s from './Root.scss';
import Disclaimer from '../disclaimer/Disclaimer';
import { withTranslation, WithTranslation } from 'react-i18next';

@observer
export class Root extends React.Component<{store: RootStore} & WithTranslation, {}> {
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
        <div className={s.header}>
          <div className={s.github}><a href="https://github.com/PaulAnnekov/monoweb">GitHub</a></div>
          {store.isDemo &&
            <button className={s['demo-exit']} onClick={() => this.onDemo()}>{this.props.t('Вийти з демо')}</button>}
        </div>
        {auth ? (
          <div className={s['auth-wrapper']}>{auth}</div>
        ) : (
          <Main store={userStore} />
        )}
      </div>
    );
  }
}

export default withTranslation()(Root);
