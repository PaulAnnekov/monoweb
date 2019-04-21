import { observer } from "mobx-react";
import { RootStore } from "../store";
import * as React from "react";
import Error from "./Error";
import Loader from "./Loader";

@observer
export default class extends React.Component<{store: RootStore}, {phone: string; code: string}> {
  constructor(props: {store: RootStore}) {
    super(props);

    this.state = {
      phone: '380',
      code: '',
    };
  }

  handleSubmit(event) {
    this.props.store.getOTP(this.state.phone);
    event.preventDefault();
  }

  get hint(): string {
    return Array(this.state.code.length).fill(' ').concat(Array(4 - this.state.code.length).fill('_')).join('');
  }

  onCodeChange(event) {
    this.setState(Object.assign(this.state, {code: event.target.value}));
    const code = event.target.value.replace(/\D/g, '');
    if (code.length !== 4) {
      return;
    }
    this.props.store.setCode(code);
  }

  onPhoneChange(event) {
    this.setState(Object.assign(this.state, {phone: event.target.value}));
  }

  render() {
    const store = this.props.store;
    const state = this.state;

    return (
      <div className="auth">
      { !store.otp &&
        <form onSubmit={(e) => this.handleSubmit(e)}>
          <div className="phone-wrapper">
            <span className="sign">+</span>
            // v-focus="true" mask="### ## ### ####"
            <input className="phone" type="tel" defaultValue={state.phone} onInput={(e) => this.onPhoneChange(e)} disabled={store.loading} />
          </div>
          <button disabled={state.phone.length !== 12 || store.loading}>Далее</button>
        </form>
      }
      { store.otp &&
        <div className="sms-wrapper">
          <div className="title">Введите код из СМС</div>
          <div className="sms-input">
            // v-focus="true" mask="####"
            <input className="sms" defaultValue={state.code} onInput={(e) => this.onCodeChange(e)} disabled={store.loading} size={4} />
            <input className="hint" value={this.hint} size={4} readOnly />
          </div>
        </div>
      }
      { store.error && <Error message={store.error} /> }
      { store.loading && <Loader /> }
      </div>
    );
  }
}

{/* <style scoped lang="less">
.auth {
  height: 100%;
}
.phone-wrapper {
  margin: 0 auto;
  align-self: flex-end;
}
.sign {
  user-select: none;
}
.phone, .sign, .sms, .hint {
  font-size: 200%;
}
.phone, .sms, .hint {
  border: 0;
  background: none;
  outline: 0 !important;
}
.sms-input {
  position: relative;
  text-align: center;
  margin-top: 50px;
  .sms, .hint {
    font-family: 'Roboto Mono', monospace;
    letter-spacing: 9px;
  }
  .hint {
    position: absolute;
    bottom: 0px;
    z-index: -1;
    left: 50%;
    transform: translateX(-50%);
  }
}
.sms-wrapper {
  .title {
    text-align: center;
  }
}
form {
  display: flex;
  flex-direction: row;
  height: 100%;
  flex-wrap: wrap;
}
button {
  border: 0;
  outline: 0;
  line-height: 240%;
  font-size: 120%;
  background-color: #fa5255;
  color: #fff;
  width: 100%;
  align-self: flex-end;
  cursor: pointer;

  &:disabled {
    background-color: #ccc;
  }

  &:enabled:hover {
    background-color: #cc4345;
  }
}
</style> */}
