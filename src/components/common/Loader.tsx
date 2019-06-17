import * as React from 'react';
import * as s from './Loader.scss';

export default class Loader extends React.Component<{}, {}> {
  render() {
    return <img className={s.loader} src="https://loading.io/spinners/google/index.svg" />;
  }
}
