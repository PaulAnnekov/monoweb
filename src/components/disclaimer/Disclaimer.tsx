import { observer } from 'mobx-react';
import { RootStore } from '../../services/store';
import * as React from 'react';
import * as s from './Disclaimer.scss';
import { withTranslation, WithTranslation, Trans } from 'react-i18next';
import Tooltip from 'rc-tooltip';

@observer
class Disclaimer extends React.Component<{store: RootStore} & WithTranslation, {}> {
  onAgree() {
    this.props.store.disclaimer = true;
  }

  onDemo() {
    this.props.store.toggleDemo();
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
        <div className={s.buttons}>
          <button className="form-button" onClick={() => this.onAgree()}>{this.props.t('Приймаю')}</button>
          <Tooltip placement="top" overlay={this.props.t('Не хочу поки вводити свої дані, спершу спробую демо')}>
            <button className={'form-button ' + s.demo} onClick={() => this.onDemo()}>{this.props.t('Демо')}</button>
          </Tooltip>
        </div>
      </div>
    );
  }
}

export default withTranslation()(Disclaimer);
