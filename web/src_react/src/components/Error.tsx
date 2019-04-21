import * as React from "react";

export default class extends React.Component<{message: string | boolean}, {}> {
  render() {
    return <div className="error">{ this.props.message}</div>;
  }
}
