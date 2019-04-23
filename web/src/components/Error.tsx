import * as React from 'react';
import * as s from './Error.scss';

export default class extends React.Component<{className?: string, message: string | boolean}, {}> {
  render() {
    return <div className={s.error}>{ this.props.message}</div>;
  }
}
