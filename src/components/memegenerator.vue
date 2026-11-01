<template>
    <div class="plugin-dogecoin-wallet-meme">
        <button
            class="kiwi-inputtool-icon"
            type="button"
            :title="$t('plugin-dogecoin-wallet:meme_title')"
            @click="openGenerator"
        >
            🎨
        </button>
    </div>
</template>

<script>
import MemeForm from './memeform.vue';

export default {
    name: 'MemeGenerator',

    props: ['pluginState'],

    methods: {
        openGenerator() {
            if (!this.pluginState.connected) {
                alert(this.$t('plugin-dogecoin-wallet:meme_wallet_required'));
                return;
            }

            this.pluginState.memeStatus = '';

            this.$state.$emit('input.tool', {
                ...MemeForm,
                props: {
                    pluginState: {
                        default: () => this.pluginState,
                    },
                },
            });
        },
    },
};
</script>
