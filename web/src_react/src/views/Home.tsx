import { observer } from "mobx-react";
import { RootStore } from "../store";
import * as React from "react";
import Auth from "../components/Auth";
import Pin from "../components/Pin";
import Transactions from "../components/Transactions";

@observer
export class Home extends React.Component<{store: RootStore}, {}> {
  render() {
    const store = this.props.store;
    return (
      <div className="home">
      {!store.token || store.token.isExpired() ? (
        <div className="auth-wrapper">
          {!store.token && !store.hasGrantData && <Auth store={store} />}
          {store.token && store.token.isExpired() || !store.token && store.hasGrantData && <Pin store={store} />}
        </div>
      ) : (<Transactions store={store} />)}
      </div>
    );
  }
}

<style scoped lang="less">
{/* .auth-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    background-color: #fff;
    padding: 20px 0 0;
    border-radius: 30px;
    width: 500px;
    height: 200px;
    transform: translate(-50%, -50%);
    overflow: hidden;
} */}
</style>
