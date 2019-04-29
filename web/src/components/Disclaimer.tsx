import { observer } from 'mobx-react';
import { RootStore } from '../store';
import * as React from 'react';
import * as s from './Disclaimer.scss';
import { withTranslation, WithTranslation, Trans } from 'react-i18next';

@observer
class Disclaimer extends React.Component<{store: RootStore} & WithTranslation, {}> {
  onAgree() {
    this.props.store.disclaimer = true;
  }

  render() {
    return (
      <div className={s.disclaimer}>
        <div className={s.warning}>{this.props.t('⚠️ Попередження')}</div>
        <div className={s.text}>
          <Trans>
            <p>
              Це неофіційний порт monobank для вебу. Він read-only, тобто ніяких
              фінансових операцій здійснювати не вміє. Проте, все ще є мала
              ймовірність, що вам можуть відмовити в обслуговуванні основі пункту
              8.17 <a href="https://www.monobank.com.ua/umovy">договору</a>.
            </p>
            <p>Використовуйте на свій страх і ризик.</p>
          </Trans>
        </div>
        <button onClick={() => this.onAgree()}>{this.props.t('Принимаю')}</button>
      </div>
    );
  }
}

export default withTranslation()(Disclaimer);
