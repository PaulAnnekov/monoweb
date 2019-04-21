import { observer } from "mobx-react";
import { RootStore } from "../store";
import * as React from "react";
import Error from "./Error";
import Loader from "./Loader";

@observer
export default class extends React.Component<{store: RootStore}, {pin: string}> {
  constructor(props: {store: RootStore}) {
    super(props);

    this.state = {
      pin: '',
    };
  }

  onCodeChange(event) {
    this.setState(Object.assign(this.state, {pin: event.target.value}));
    const pin = event.target.value;
    if (pin.length !== 4) {
      return;
    }
    this.props.store.setPIN(pin);
  }

  render() {
    const store = this.props.store;
    const state = this.state;

    return (
      <div className="pin-view">
        <div className="title">Введите ПИН-код</div>
        // v-focus="true"
        <input className="pin" defaultValue={state.pin} onInput={(e) => this.onCodeChange(e)} type="password" disabled={store.loading} />
        { store.error && <Error message={store.error} /> }
        { store.loading && <Loader /> }
      </div>
    );
  }
}

{/* <style scoped lang="less">
.pin-view {
  text-align: center;
}
.pin {
  font-size: 200%;
  color: #fa5255;
  border: 0;
  background: none;
  outline: 0 !important;
  letter-spacing: 23px;
  margin-top: 50px;
  width: 180px;
  margin-left: 65px;
}
</style> */}
