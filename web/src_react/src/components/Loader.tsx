import * as React from "react";

export default class extends React.Component<{}, {}> {
  render() {
    return <img className="loader" src="https://loading.io/spinners/google/index.svg" />;
  }
}

{/* <style scoped lang="less">
.loader {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
}
</style> */}
