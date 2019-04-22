import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Home } from './views/Home';
import store from './store';
import "./index.scss";

ReactDOM.render(
  <div id="app">
    <Home store={store} />
  </div>, document.getElementById('app'),
);
