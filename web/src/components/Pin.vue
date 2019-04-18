<template>
  <div class="pin-view">
    <div class="title">Введите ПИН-код</div>
    <input class="pin" v-model="pin" type="password" size="4" />
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

<style scoped lang="less">
.pin-view {
  text-align: center;
}
.pin {
  font-size: 200%;
  color: #fa5255;
  border: 0;
  background: none;
  outline: 0 !important;
  letter-spacing: 23px;
  margin-top: 50px;
}
</style>
