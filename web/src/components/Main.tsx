import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import * as s from './Main.scss';
import Transactions from './Transactions';
import User from './User';

@observer
export default class extends React.Component<{store: RootStore}, {}> {
  render() {
    const store = this.props.store;

    return (
      <div className={s.main}>
        <Transactions store={store} />
        <User store={store} />
      </div>
    );
  }
}
