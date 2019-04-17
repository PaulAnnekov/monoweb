<template>
  <div class="info-view">
    <div class="user">
      <img class="photo" :src="personalData.photoAbsoluteUrl">
      <div class="name">{{ personalData.fullNameUk }}</div>
    </div>
    <div class="statement">
      <div class="card-info" v-if="card.balance">
        <span
          class="balance"
        >{{ card.balance.balance | numberFormat }} {{ card.balance.ccy | currency }}</span> (
        <span class="card">*{{ card.cardNum.slice(-4) }}</span>)
      </div>
      <div class="list">
        <div class="operation" v-for="o in statements" :key="o.id">
          <img class="icon" :src="o.iconUrl || 'empty'">
          <div class="description">{{ o.descr }}</div>
          <div class="amount-wrapper">
            <div class="amount">{{ o.debit ? -o.amt : o.amt | numberFormat }}</div>
            <div class="balance">{{ o.rest | numberFormat }}</div>
          </div>
        </div>
      </div>
    </div>
    <loader v-if="loading"/>
    <div class="error" v-if="error">{{ error }}</div>
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Action, State } from 'vuex-class';

function getLanguage(): string {
  const valid = ['ru', 'uk'];
  let lang = '';
  if (navigator.language) {
    lang = navigator.language.split('-')[0];
  }

  return lang && valid.includes(lang) ? lang : 'uk';
}

@Component({
  filters: {
    numberFormat(num: number) {
      const formatter = new Intl.NumberFormat(getLanguage(), {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
      return formatter.format(num);
    },
    currency(ccy: string): string {
      const CURRENCIES: { [index: string]: string } = {
        980: '₴',
        840: '$',
        978: '€',
      };

      return CURRENCIES[ccy];
    },
  },
})
export default class Transactions extends Vue {
  @Action('getTransactions') getTransactions: any;
  @State('card') card: {};
  @State('personalData') personalData: object;
  @State('error') error: string;
  @State('loading') loading: string;

  get statements() {
    return this.$store.state.statements.filter(
      (o: any) => o.type === 'FINANCIAL',
    );
  }

  mounted() {
    this.getTransactions();
  }
}
</script>

<style scoped lang="less">
.info-view {
  margin: 30px 30px 0 30px;

  .user {
    display: flex;
    align-items: center;
  }

  .photo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .statement {
    width: 500px;
  }

  .card-info {
    display: flex;
    align-items: center;
    height: 55px;

    .balance {
      font-size: 130%;
      margin-right: 15px;
      color: #fff;
    }
  }

  .list {
    background-color: #fff;
    border-radius: 20px 20px 0 0;
    padding: 20px;

    .date {
      text-align: center;
      color: grey;
      font-size: 80%;
      margin-top: 20px;
    }

    .date:first-child {
      margin-top: 0;
    }
  }

  .operation {
    display: flex;
    align-items: center;
    margin-top: 20px;

    .icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      position: relative;
      overflow: hidden;

      &:after {
        content: "";
        background: #c09dae;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }

    .description {
      margin-left: 20px;
    }

    .amount-wrapper {
      flex-grow: 1;
      text-align: right;
    }

    .amount-wrapper .balance {
      font-size: 70%;
      color: grey;
    }
  }
}
</style>
