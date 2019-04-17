<template>
  <div class="auth">
    <form v-on:submit.prevent="submit" v-if="!otp">
      <input class="phone" placeholder="Введите номер телефона: 380... + Enter" v-model="phone" />
      <button>Далее</button>
    </form>
    <input v-if="otp" class="sms" placeholder="Код из SMS" v-model="code" />
    <div v-if="error" class="error">{{ error }}</div>
    <loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import {
  Action,
  State,
  Mutation,
} from 'vuex-class';

@Component
export default class Auth extends Vue {
  @Action('getOTP') getOTP: any;
  @Mutation('setCode') setCode: any;
  @State('error') error: string;
  @State('loading') loading: string;
  @State('otp') otp: boolean;
  phone: string = '';
  code: string = '';

  submit() {
    this.getOTP(this.phone);
  }

  @Watch('code')
  onCodeChange(code: string) {
    code = code.replace(/\D/g, '');
    if (code.length !== 4) {
      return;
    }
    this.setCode(code);
  }
}
</script>

<style scoped lang="less">
.phone {
    width: 250px;
}
</style>
