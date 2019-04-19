<template>
  <div class="home">
    <div class="auth-wrapper" v-if="!token || token.isExpired()">
      <auth v-if="!token && !hasGrantData" />
      <pin v-if="token && token.isExpired() || !token && hasGrantData" />
    </div>
    <transactions v-else />
  </div>
</template>

<script lang="ts">
import { mapState } from 'vuex';
import { Component, Vue } from 'vue-property-decorator';
import Auth from '@/components/Auth.vue';
import Pin from '@/components/Pin.vue';
import Transactions from '@/components/Transactions.vue';
import {
  State,
  Getter,
} from 'vuex-class';
import { Token } from '../types';

@Component({
  components: {
    Auth,
    Pin,
    Transactions,
  },
})
export default class Home extends Vue {
  @State('token') token: Token;
  @Getter('hasGrantData') hasGrantData: boolean;
}
</script>

<style scoped lang="less">
.auth-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    background-color: #fff;
    padding: 20px 0 0;
    border-radius: 30px;
    width: 500px;
    height: 200px;
    transform: translate(-50%, -50%);
    overflow: hidden;
}
</style>
