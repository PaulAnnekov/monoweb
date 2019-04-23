import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Error from './Error';
import Loader from './Loader';
import * as s from './Pin.scss';
import Auth from './Auth';
import { observe } from 'mobx';
import { SyntheticInputEvent } from 'react-number-format';

@observer
export default class extends React.Component<{store: RootStore}, {}> {
  private pinRef = React.createRef<HTMLInputElement>();

  componentDidUpdate() {
    if (this.props.store.pin === '') {
      this.pinRef.current.focus();
    }
  }

  onCodeChange(event: React.ChangeEvent) {
    const pin = (event.target as HTMLInputElement).value;
    this.props.store.pin = pin;
    if (pin.length !== 4) {
      return;
    }
    this.props.store.auth(pin);
  }

  render() {
    const store = this.props.store;

    return (
      <div className={s["pin-view"]}>
        <div className="title">Введите ПИН-код</div>
        <input autoFocus
          ref={this.pinRef}
          className={s.pin}
          value={store.pin}
          onChange={(e) => this.onCodeChange(e)}
          type="password"
          disabled={store.loading} />
      { store.error && <Error message={store.error} /> }
      { store.loading && <Loader /> }
      </div>
    );
  }
}
