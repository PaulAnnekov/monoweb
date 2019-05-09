import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Home } from './views/Home';
import store from './store';
import './services/i18n';
import 'rc-tooltip/assets/bootstrap.css';
import './index.scss';

ReactDOM.render(
  <Home store={store} />, document.getElementById('app'),
);
