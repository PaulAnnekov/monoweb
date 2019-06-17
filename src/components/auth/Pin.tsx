import { observer } from 'mobx-react';
import { UserStore } from '../../store';
import * as React from 'react';
import Error from '../common/Error';
import Loader from '../common/Loader';
import * as s from './Pin.scss';
import { withTranslation, WithTranslation } from 'react-i18next';

@observer
class Pin extends React.Component<{store: UserStore} & WithTranslation, {}> {
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
    this.props.store.auth();
  }

  render() {
    const store = this.props.store;

    return (
      <div className={s['pin-view']}>
        <div className="title">{this.props.t('Введіть ПІН-код')}</div>
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

export default withTranslation()(Pin);
