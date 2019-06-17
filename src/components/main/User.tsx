import { observer } from 'mobx-react';
import { UserStore } from '../../services/store';
import * as React from 'react';
import Error from '../common/Error';
import Loader from '../common/Loader';
import * as s from './User.scss';
import { moneyFormat, currency } from '../../services/utils';
import { Card, Language } from '../../types';
import { withTranslation, WithTranslation } from 'react-i18next';

@observer
class User extends React.Component<{store: UserStore} & WithTranslation, {}> {
  componentDidMount() {
    this.props.store.getPersonalData();
  }

  getCardName(card: Card) {
    const names: {[index: string]: string} = {
      '980': this.props.t('Гривнева'),
      '840': this.props.t('Доларова'),
      '978': this.props.t('Єврова'),
    };

    return names[card.currency];
  }

  getUserName() {
    if (this.props.store.language === Language.ru) {
      return this.props.store.personalData.fullNameRu;
    } else {
      return this.props.store.personalData.fullNameUk;
    }
  }

  onCardChange(uid: string) {
    this.props.store.changeCard(uid);
  }

  render() {
    const store = this.props.store;

    return (
      <div className={s.user}>
        {store.cards &&
          <div className={s.cards}>
            {store.cards.map((c) => {
              return (
                <div
                  className={s['card-info'] + (c.uid === store.selectedCard ? ` ${s.selected}` : '')}
                  key={c.uid}
                  onClick={() => this.onCardChange(c.uid)}>
                  <div className={s.name}>
                    {this.getCardName(c)} <span className="number">(*{ c.cardNum.slice(-4) })</span>
                  </div>
                  <div className={s.balance}>
                    { moneyFormat(c.balance.balance) } { currency(c.balance.ccy) }
                  </div>
                </div>
              );
            })}
          </div>
        }
        {store.personalData &&
          <div className={s['user-info']}>
            <img className={s.photo} src={store.personalData.photoAbsoluteUrl} />
            <div className="name">{this.getUserName()}</div>
          </div>
        }
        { store.error && <Error message={store.error} /> }
        { store.loading && <Loader /> }
      </div>
    );
  }
}

export default withTranslation()(User);
