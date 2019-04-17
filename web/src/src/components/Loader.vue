<template>
    <img class="loader" src="https://loading.io/spinners/google/index.svg" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Loader extends Vue {}
</script>

<style scoped lang="less">
.loader {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
}
</style>
