import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Root from './components/root/Root';
import getStore from './services/store';
import './services/i18n';
import 'rc-tooltip/assets/bootstrap.css';
import './index.scss';

(async () => {
  const store = await getStore();
  ReactDOM.render(
    <Root store={store} />, document.getElementById('app')
  );
})();
