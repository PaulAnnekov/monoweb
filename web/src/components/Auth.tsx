import { observer } from 'mobx-react';
import { UserStore } from '../store';
import * as React from 'react';
import Error from './Error';
import Loader from './Loader';
import * as s from './Auth.scss';
import NumberFormat, { NumberFormatValues } from 'react-number-format';
import { withTranslation, WithTranslation } from 'react-i18next';

@observer
class Auth extends React.Component<{store: UserStore} & WithTranslation, {phone: string}> {
  constructor(props: {store: UserStore} & WithTranslation) {
    super(props);

    this.state = {
      phone: '380',
    };
  }

  handleSubmit(event: React.FormEvent) {
    this.props.store.getOTP(this.state.phone);
    event.preventDefault();
  }

  get hint(): string {
    return Array(this.props.store.code.length)
      .fill(' ')
      .concat(Array(4 - this.props.store.code.length).fill('_'))
      .join('');
  }

  onCodeChange(v: NumberFormatValues) {
    const code = v.value;
    this.props.store.code = code;
    if (code.length !== 4) {
      return;
    }
    this.props.store.sms();
  }

  onPhoneChange(v: NumberFormatValues) {
    this.setState(Object.assign(this.state, {phone: v.value}));
  }

  render() {
    const store = this.props.store;
    const state = this.state;

    return (
      <div className={s.auth}>
      { !store.otp &&
        <form onSubmit={(e) => this.handleSubmit(e)}>
          <div className={s['phone-wrapper']}>
            <span className={s.sign}>+</span>
            <NumberFormat
              className={s.phone}
              autoFocus
              type="tel"
              defaultValue={state.phone}
              onValueChange={(v) => this.onPhoneChange(v)}
              disabled={store.loading}
              format="### ## ### ####" />
          </div>
          { store.error && <Error message={store.error} /> }
          <button
            className="form-button"
            disabled={state.phone.length !== 12 || store.loading}>
            {this.props.t('Далі')}
          </button>
        </form>
      }
      { store.otp &&
        <div className={s['sms-wrapper']}>
          <div>{this.props.t('Введіть код з СМС')}</div>
          <div className={s['sms-input']}>
            <NumberFormat
              className={s.sms}
              autoFocus
              value={store.code}
              onValueChange={(v) => this.onCodeChange(v)}
              disabled={store.loading}
              format="####"
              size={4} />
            <input className={s.hint} value={this.hint} size={4} readOnly />
          </div>
          { store.error && <Error message={store.error} /> }
        </div>
      }
      { store.loading && <Loader /> }
      </div>
    );
  }
}

export default withTranslation()(Auth);
