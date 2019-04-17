<template>
  <div class="pin-view">
    <input class="pin" placeholder="ПИН код" v-model="pin" />
    <div v-if="error" class="error">{{ error }}</div>
    <loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';
import {
  Action,
  State,
} from 'vuex-class';

@Component
export default class Pin extends Vue {
  @Action('setPIN') setPIN: any;
  @State('loading') loading: string;
  @State('error') error: string;
  pin: string = '';

  @Watch('pin')
  onPinChange(pin: string) {
    if (pin.length !== 4) {
      return;
    }
    this.setPIN(pin);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
