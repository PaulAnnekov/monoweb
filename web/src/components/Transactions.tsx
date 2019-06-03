import { observer } from 'mobx-react';
import { UserStore } from '../store';
import * as React from 'react';
import Error from './Error';
import { moneyFormat } from '../services/utils';
import InfiniteScroll from 'react-infinite-scroller';

import * as s from './Transactions.scss';
import { withTranslation, WithTranslation } from 'react-i18next';

@observer
class Transactions extends React.Component<{store: UserStore} & WithTranslation, {}> {
  private TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAA' +
    'AABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  render() {
    const store = this.props.store;
    let lastDate: Date;
    const list = [];
    if (store.statement) {
      store.statement.operations.forEach((o) => {
        if (o.type !== 'FINANCIAL') {
          return;
        }
        const transactionDate = new Date(o.tranDate);
        if (!lastDate || !this.isSameDay(transactionDate, lastDate)) {
          list.push(<div className={s.date} key={transactionDate+''}>{this.formatDate(transactionDate)}</div>)
        }
        lastDate = transactionDate;
        const category = this.props.store.categories
          .find((c) => c.id === +o.category);
        const background = `url(${o.iconUrl || this.TRANSPARENT}),
          url(${category.icon}),
          linear-gradient(to bottom right, ${category.colorStartItem},
          ${category.colorEndItem})`;
        list.push(
          <div className={s.operation} key={o.id}>
            <div className={s.icon}
              style={{backgroundImage: background}}>
            </div>
            <div className={s.description}>{o.descr}</div>
            <div className={s['amount-wrapper']}>
              <div className={o.debit ? 'amount-debit' : s['amount-credit']}>
                {moneyFormat(o.debit ? -o.amt : o.amt)}
              </div>
              <div className={s.balance}>{moneyFormat(o.rest)}</div>
            </div>
          </div>
        );
      });
    }
    const isEmpty = store.statement && !store.statement.operations.length;

    return (
      <div className={s.statement}>
      {isEmpty && <div className={s.empty}>{this.props.t('Нічого немає 🤷')}</div>}
      {!store.error && store.selectedCard &&
        <div className={s.list}>
          <InfiniteScroll
            pageStart={0}
            loadMore={() => this.loadTransactions()}
            hasMore={!store.statement || !store.statement.isFull}
            loader={<div className={s.loader} key={0}>{this.props.t('Завантаження…')}</div>}
            useWindow={false}
          >
            {list}
          </InfiniteScroll>
        </div>
      }
      { store.error && <Error message={store.error} /> }
      </div>
    );
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
  }

  private formatDate(date: Date) {
    const now = new Date();
    const options: {[index: string]: string} = {month: 'long', day: 'numeric'};
    if (now.getFullYear() !== date.getFullYear()) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString(this.props.store.language, options);
  }

  private loadTransactions() {
    this.props.store.getTransactions();
  }
}

export default withTranslation()(Transactions);
