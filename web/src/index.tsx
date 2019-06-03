import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Home from './views/Home';
import getStore from './store';
import './services/i18n';
import 'rc-tooltip/assets/bootstrap.css';
import './index.scss';

(async () => {
  const store = await getStore();
  ReactDOM.render(
    <Home store={store} />, document.getElementById('app'),
  );
})();
