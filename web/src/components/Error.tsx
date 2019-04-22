import * as React from 'react';

export default class extends React.Component<{className?: string, message: string | boolean}, {}> {
  render() {
    return <div className={this.props.className || 'error'}>{ this.props.message}</div>;
  }
}
