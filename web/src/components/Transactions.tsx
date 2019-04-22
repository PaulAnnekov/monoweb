import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Error from './Error';
import Loader from './Loader';

function getLanguage(): string {
  const valid = ['ru', 'uk'];
  let lang = '';
  if (navigator.language) {
    lang = navigator.language.split('-')[0];
  }

  return lang && valid.includes(lang) ? lang : 'uk';
}

@observer
export default class extends React.Component<{store: RootStore}, {}> {
  componentDidMount() {
    this.props.store.getTransactions();
  }

  numberFormat(num: number) {
    const formatter = new Intl.NumberFormat(getLanguage(), {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    return formatter.format(num);
  }

  currency(ccy: string): string {
    const CURRENCIES: { [index: string]: string } = {
      980: '₴',
      840: '$',
      978: '€',
    };

    return CURRENCIES[ccy];
  }

  render() {
    const store = this.props.store;
    const state = this.state;

    return (
      <div className="info-view">
        <div className="user">
          <img className="photo" src={store.personalData.photoAbsoluteUrl} />
          <div className="name">{store.personalData.fullNameUk}</div>
        </div>
        <div className="statement">
          <div className="card-info" v-if="card.balance">
            <span
              className="balance"
            >{ this.numberFormat(store.card.balance.balance) } { this.currency(store.card.balance.ccy) }</span> (
            <span className="card">*{ store.card.cardNum.slice(-4) }</span>)
          </div>
          <div className="list">
          {store.statements.map((o) => {
            if (o.type !== 'FINANCIAL') {
              return;
            }
            return <div className="operation" key={o.id}>
              <img className="icon" src={o.iconUrl || 'empty'} />
              <div className="description">{o.descr}</div>
              <div className="amount-wrapper">
                <div className="amount">{this.numberFormat(o.debit ? -o.amt : o.amt)}}</div>
                <div className="balance">{this.numberFormat(o.rest)}</div>
              </div>
            </div>;
          })}
          </div>
        </div>
        { store.error && <Error message={store.error} /> }
        { store.loading && <Loader /> }
      </div>
    );
  }
}

{/* <style scoped lang="less">
.info-view {
  margin: 30px 30px 0 30px;

  .user {
    display: flex;
    align-items: center;
  }

  .photo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .statement {
    width: 500px;
  }

  .card-info {
    display: flex;
    align-items: center;
    height: 55px;

    .balance {
      font-size: 130%;
      margin-right: 15px;
      color: #fff;
    }
  }

  .list {
    background-color: #fff;
    border-radius: 20px 20px 0 0;
    padding: 20px;

    .date {
      text-align: center;
      color: grey;
      font-size: 80%;
      margin-top: 20px;
    }

    .date:first-child {
      margin-top: 0;
    }
  }

  .operation {
    display: flex;
    align-items: center;
    margin-top: 20px;

    .icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      position: relative;
      overflow: hidden;

      &:after {
        content: "";
        background: #c09dae;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }

    .description {
      margin-left: 20px;
    }

    .amount-wrapper {
      flex-grow: 1;
      text-align: right;
    }

    .amount-wrapper .balance {
      font-size: 70%;
      color: grey;
    }
  }
}
</style> */}
