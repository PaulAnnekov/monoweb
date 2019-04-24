import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Error from './Error';
import Loader from './Loader';
import * as s from './Transactions.scss';

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

  moneyFormat(num: number) {
    const formatter = new Intl.NumberFormat('en', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    return formatter.format(num).replace(/,/g, ' ');
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
      <div className={s["info-view"]}>
      {!store.loading && !store.error &&
        <div>
        {store.personalData &&
          <div className={s.user}>
            <img className={s.photo} src={store.personalData.photoAbsoluteUrl} />
            <div className="name">{store.personalData.fullNameUk}</div>
          </div>
        }
        {store.card && store.statements &&
          <div className={s.statement}>
            <div className={s["card-info"]}>
              <span
                className={s.balance}
              >{ this.moneyFormat(store.card.balance.balance) } { this.currency(store.card.balance.ccy) }</span> (
              <span className="card">*{ store.card.cardNum.slice(-4) }</span>)
            </div>
            <div className={s.list}>
            {store.statements.map((o) => {
              if (o.type !== 'FINANCIAL') {
                return;
              }
              const category = this.props.store.categories
                .find((c) => c.id == +o.category);
              return <div className={s.operation} key={o.id}>
                <div className={s.icon}
                  style={{backgroundImage: `url(${o.iconUrl}), url(${category.icon}), linear-gradient(to bottom right, ${category.colorStartItem}, ${category.colorEndItem})`}}>
                </div>
                <div className={s.description}>{o.descr}</div>
                <div className={s["amount-wrapper"]}>
                  <div className={o.debit ? 'amount-debit' : s['amount-credit']}>{this.moneyFormat(o.debit ? -o.amt : o.amt)}</div>
                  <div className={s.balance}>{this.moneyFormat(o.rest)}</div>
                </div>
              </div>;
            })}
            </div>
          </div>
        }
        </div>
      }
      { store.error && <Error message={store.error} /> }
      { store.loading && <Loader /> }
      </div>
    );
  }
}
