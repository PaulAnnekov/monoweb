import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import Error from './Error';
import Loader from './Loader';
import { moneyFormat, getLanguage } from '../services/utils';

import * as s from './Transactions.scss';

@observer
export default class extends React.Component<{store: RootStore}, {}> {
  private TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
  }

  private formatDate(date: Date) {
    return date.toLocaleDateString(getLanguage(),
      {month: 'long', day: 'numeric'});
  }

  render() {
    const store = this.props.store;
    let lastDate: Date;
    const list = [];
    store.statement && store.statement.forEach((o) => {
      if (o.type !== 'FINANCIAL') {
        return;
      }
      const transactionDate = new Date(o.tranDate);
      if (!lastDate || !this.isSameDay(transactionDate, lastDate)) {
        list.push(<div className={s.date} key={transactionDate+''}>{this.formatDate(transactionDate)}</div>)
      }
      lastDate = transactionDate;
      const category = this.props.store.categories
        .find((c) => c.id == +o.category);
      let background = `url(${o.iconUrl||this.TRANSPARENT}), url(${category.icon}), linear-gradient(to bottom right, ${category.colorStartItem}, ${category.colorEndItem})`;
      list.push(
        <div className={s.operation} key={o.id}>
          <div className={s.icon}
            style={{backgroundImage: background}}>
          </div>
          <div className={s.description}>{o.descr}</div>
          <div className={s["amount-wrapper"]}>
            <div className={o.debit ? 'amount-debit' : s['amount-credit']}>{moneyFormat(o.debit ? -o.amt : o.amt)}</div>
            <div className={s.balance}>{moneyFormat(o.rest)}</div>
          </div>
        </div>
      );
    })

    return (
      <div className={s.statement}>
      {!store.loading && !store.error && list.length &&
        <div className={s.list}>{list}</div>
      }
      { store.error && <Error message={store.error} /> }
      { store.loading && <Loader /> }
      </div>
    );
  }
}
