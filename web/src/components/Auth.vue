<template>
  <div class="auth">
    <form v-on:submit.prevent="submit" v-if="!otp">
      <div class="phone-wrapper">
        <span class="sign">+</span>
        <the-mask class="phone" type="tel" v-focus="true" v-model="phone" mask="### ## ### ####" :disabled="loading"></the-mask>
      </div>
      <button :disabled="phone.length != 12 || loading">Далее</button>
    </form>
    <div class="sms-wrapper" v-if="otp">
      <div class="title">Введите код из СМС</div>
      <div class="sms-input">
        <the-mask class="sms" v-focus="true" v-model="code" mask="####" :disabled="loading" size="4"></the-mask>
        <input class="hint" :value="hint" size="4" />
      </div>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <loader v-if="loading" />
  </div>
</template>
// <security-code class="sms" v-if="otp" v-model="code" placeholder="_"></security-code>
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
  phone: string = '380';
  code: string = '';

  get hint(): string {
    return Array(this.code.length).fill(' ').concat(Array(4 - this.code.length).fill('_')).join('');
  }

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
.auth {
  height: 100%;
}
.phone-wrapper {
  margin: 0 auto;
  align-self: flex-end;
}
.sign {
  user-select: none;
}
.phone, .sign, .sms, .hint {
  font-size: 200%;
}
.phone, .sms, .hint {
  border: 0;
  background: none;
  outline: 0 !important;
}
.sms-input {
  position: relative;
  text-align: center;
  margin-top: 50px;
  .sms, .hint {
    font-family: 'Roboto Mono', monospace;
    letter-spacing: 9px;
  }
  .hint {
    position: absolute;
    bottom: 0px;
    z-index: -1;
    left: 50%;
    transform: translateX(-50%);
  }
}
.sms-wrapper {
  .title {
    text-align: center;
  }
}
form {
  display: flex;
  flex-direction: row;
  height: 100%;
  flex-wrap: wrap;
}
button {
  border: 0;
  outline: 0;
  line-height: 240%;
  font-size: 120%;
  background-color: #fa5255;
  color: #fff;
  width: 100%;
  align-self: flex-end;
  cursor: pointer;

  &:disabled {
    background-color: #ccc;
  }

  &:enabled:hover {
    background-color: #cc4345;
  }
}
</style>
