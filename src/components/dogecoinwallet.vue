<template>
    <main class="DogeDropMain">

        <div class="DogeDropToggle" @click="walletOpen = !walletOpen">
            <span class="DogeDropToggleLabel">
                <i class="fa fa-credit-card" aria-hidden="true" />
                <span>Wallet</span>

                <span
                    :class="[
                        'DogeDropStatus',
                        pluginState.connected ? 'DogeDropStatus--connected' : 'DogeDropStatus--disconnected',
                    ]"
                    :title="pluginState.connected
                        ? $t('plugin-dogecoin-wallet:wallet_connected')
                        : $t('plugin-dogecoin-wallet:wallet_disconnected')"
                />
            </span>

            <i
                :class="['fa', 'DogeDropToggleIcon', walletOpen ? 'fa-angle-up' : 'fa-angle-down']"
                aria-hidden="true"
            />
        </div>

        <div v-if="walletOpen" class="DogeDropWallet">
            <template v-if="!isChromiumBrowser && !isDogeDropInstalled">
                <div class="DogeDropNotice">
                    {{ $t('plugin-dogecoin-wallet:chromium_only') }}
                </div>
            </template>

            <template v-else-if="!isDogeDropInstalled">
                <div class="DogeDropNotice">
                    <span>{{ $t('plugin-dogecoin-wallet:wallet_not_installed') }}</span>

                    <a
                        class="DogeDropStoreLink"
                        :href="dogeDropStoreUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i class="fa fa-paw" aria-hidden="true" />
                        {{ $t('plugin-dogecoin-wallet:install_dogedrop') }}
                    </a>

                </div>
            </template>

            <template v-else>
                <button
                    v-if="isDogeDropInstalled && !pluginState.connected"
                    type="button"
                    class="DogeDropConnect"
                    @click="connectDogeDrop"
                >
                    <img
                        class="DogeDropIcon"
                        src="/plugins/plugin-dogecoin-wallet/imgs/dogedrop.png"
                        alt=""
                    >
                    <span>DogeDrop Connect</span>
                </button>

                <button
                    v-if="pluginState.connected"
                    type="button"
                    class="DogeDropConnect"
                    @click="disconnectWallet"
                >
                    <img
                        class="DogeDropIcon"
                        src="/plugins/plugin-dogecoin-wallet/imgs/dogedrop.png"
                        alt=""
                    >
                    {{ $t('plugin-dogecoin-wallet:disconnect') }}
                </button>

                <div v-if="pluginState.connected" class="address">
                    {{ $t('plugin-dogecoin-wallet:address') }}: <span>{{ address }}</span>
                </div>

                <div v-if="pluginState.connected" class="balance">
                    <span>
                        {{ $t('plugin-dogecoin-wallet:balance') }}: {{ pluginState.balance }} Ð
                    </span>

                    <button
                        type="button"
                        class="DogeDropOpenWallet"
                        @click="openWallet"
                    >
                        <i class="fa fa-external-link" aria-hidden="true" />
                        Wallet
                    </button>
                </div>
            </template>
        </div>

        <div v-if="!Hidden" class="modal" @click="Hidden = true" />

        <div v-if="!Hidden" class="addrconf">
            <div class="addrconf-header">
                <i class="fa fa-paw" aria-hidden="true" />
                <span>Dogecoin Sync</span>
            </div>

            <input v-model="nsdogecoin" type="hidden">

            <div class="addrconf-content">
                {{ $t('plugin-dogecoin-wallet:use_wallet_for_tips') }}
            </div>

            <div class="addrconf-actions">
                <button
                    type="button"
                    class="addrconf-button addrconf-button--confirm"
                    @click="onSynchAddress();Hidden = true;"
                >
                    {{ $t('plugin-dogecoin-wallet:sync') }}
                </button>

                <button
                    type="button"
                    class="addrconf-button addrconf-button--cancel"
                    @click="Hidden = true;"
                >
                    {{ $t('plugin-dogecoin-wallet:cancel') }}
                </button>
            </div>

        </div>

    </main>
</template>

<script>
/* global kiwi */

import sb from 'satoshi-bitcoin';

export default {
    props: ['pluginState'],
    data() {
        return {
            address: false,
            nsdogecoin: false,
            Hidden: true,
            timeout: 0,
            walletOpen: false,
            dogeDropStoreUrl: 'https://chromewebstore.google.com/detail/dogedrop-dogecoin-wallet/' +
            'mljponncmhdlacmjbophphkbgcgjdnff?pli=1',
        };
    },
    computed: {
        isChromiumBrowser() {
            const ua = navigator.userAgent;
            const isChromium = /Chrome|Chromium|CriOS|Edg|OPR|Brave/i.test(ua);
            const isFirefox = /Firefox|FxiOS/i.test(ua);
            const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR/i.test(ua);

            return isChromium && !isFirefox && !isSafari;
        },
        isDogeDropInstalled() {
            return !!(
                window.doge &&
                typeof window.doge.connect === 'function' &&
                typeof window.doge.open === 'function'
            );
        },
    },
    methods: {
        openWallet() {
            if (window.doge && typeof window.doge.open === 'function') {
                window.doge.open();
            }
        },
        connectDogeDrop() {
            this.dogeDropConnect().then(this.dogePoll).catch((err) => {
                console.error('failed', err);
            });
        },
        disconnectWallet() {
            this.dogeDropDisconnect().then(() => {
                window.clearTimeout(this.timeout);
            });
        },
        async dogeDropConnect() {
            const dogedrop = window.doge;

            const connectRes = await dogedrop.connect();

            if (connectRes.approved) {
                this.pluginState.activeWallet = 'dogedrop';
                this.pluginState.connected = true;
                this.address = connectRes.address;
                this.nsdogecoin = this.address;

                if (this.$state.getActiveNetwork().currentUser().account) {
                    this.Hidden = false;
                }
            } else {
                throw new Error(this.$t('plugin-dogecoin-wallet:connection_denied'));
            }
        },
        async dogeDropDisconnect() {
            const dogedrop = window.doge;
            const disconnectRes = await dogedrop.disconnect();

            if (disconnectRes.disconnected) {
                this.pluginState.activeWallet = false;
                this.pluginState.connected = false;
                this.pluginState.balance = 0;
                this.address = false;
                this.nsdogecoin = false;
            }
        },
        async dogePoll() {
            if (this.pluginState.activeWallet === 'dogedrop') {
                const dogedrop = window.doge;

                await dogedrop
                    .getConnectionStatus()
                    .catch(console.error);
            }

            if (!this.pluginState.connected) {
                this.timeout = setTimeout(this.dogePoll, 60000);
                return;
            }

            await this.dogeDropBalance();

            this.timeout = setTimeout(this.dogePoll, 60000);
        },
        async dogeDropBalance() {
            const dogedrop = window.doge;
            const balanceRes = await dogedrop.getBalance();
            const balanceBC = sb.toBitcoin(balanceRes.balance);
            this.pluginState.balance = balanceBC;
        },
        onSynchAddress() {
            kiwi.state.$emit('input.raw', '/NS SET DOGECOIN ' + this.nsdogecoin);
        },
    },
};
</script>
<style>
    .DogeDropMain {
        margin: 3px 6px;
        padding: 0;
        box-sizing: border-box;
    }

    .DogeDropToggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-height: 32px;
        padding: 0 8px;
        box-sizing: border-box;
        cursor: pointer;

        background: var(--comp-ui-surface-bg);
        border: 1px solid var(--comp-ui-surface-border);
        border-radius: 4px;

        color: var(--comp-statebrowser-fg);

        transition:
            background-color 0.15s ease,
            border-color 0.15s ease;
    }

    .DogeDropToggle:hover {
        background: var(--comp-ui-surface-hover-bg);
        border-color: var(--comp-ui-surface-hover-border);
    }

    .DogeDropToggleLabel {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        height: 32px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
    }

    .DogeDropToggleLabel > .fa {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        line-height: 14px;
        color: var(--brand-primary);
        text-align: center;
    }

    .DogeDropToggleIcon {
        color: var(--comp-statebrowser-fg);
        font-size: 12px;
        opacity: 0.55;
    }

    .DogeDropStatus {
        display: block;
        width: 6px;
        height: 6px;
        margin-left: 1px;
        border-radius: 50%;
    }

    .DogeDropStatus--connected {
        background: var(--brand-primary);
    }

    .DogeDropStatus--disconnected {
        background: var(--brand-error);
        opacity: 0.65;
    }

    /* Wallet aperto */

    .DogeDropWallet {
        margin-top: 3px;
        padding: 8px;

        background: var(--comp-ui-surface-bg);
        border: 1px solid var(--comp-ui-surface-border);
        border-radius: 4px;

        color: var(--comp-statebrowser-fg);
        box-sizing: border-box;
    }

    /* Connect / Disconnect */

    .DogeDropConnect {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;

        width: 100%;
        min-height: 30px;
        padding: 5px 8px;

        background: transparent;
        border: 1px solid var(--comp-ui-surface-border);
        border-radius: 3px;

        color: var(--comp-statebrowser-fg);
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        text-align: left;

        cursor: pointer;
        box-sizing: border-box;

        transition:
            background-color 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
    }

    .DogeDropConnect:hover {
        background: var(--comp-ui-surface-hover-bg);
        border-color: var(--brand-primary);
        color: var(--brand-primary);
    }

    .DogeDropConnect i.DogeDropIcon {
        color: var(--brand-primary);
        font-size: 12px;
    }

    .DogeDropConnect img.DogeDropIcon {
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
        border-radius: 3px;
        object-fit: contain;
    }

    /* Browser / estensione non disponibile */

    .DogeDropNotice {
        display: flex;
        flex-direction: column;
        gap: 8px;

        font-size: 11px;
        line-height: 1.4;
        color: var(--comp-statebrowser-fg);
    }

    .DogeDropStoreLink {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;

        min-height: 30px;
        padding: 5px 8px;

        background: transparent;
        border: 1px solid var(--comp-ui-surface-border);
        border-radius: 3px;

        color: var(--brand-primary);
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;

        box-sizing: border-box;

        transition:
            background-color 0.15s ease,
            border-color 0.15s ease;
    }

    .DogeDropStoreLink:hover {
        background: var(--comp-ui-surface-hover-bg);
        border-color: var(--brand-primary);
        text-decoration: none;
    }

    .DogeDropStoreLink .fa {
        color: var(--brand-primary);
    }

    /* Wallet connesso */

    .DogeDropWallet .address {
        margin-top: 10px;
        padding: 8px 3px 0;

        border-top: 1px solid var(--comp-ui-surface-border);

        font-size: 9px;
        font-weight: 600;
        line-height: 1.4;
        color: var(--comp-statebrowser-fg);
        text-align: left;
        opacity: 0.65;
    }

    .DogeDropWallet .address span {
        display: block;
        margin-top: 3px;

        font-size: 10px;
        font-weight: 400;
        line-height: 1.35;
        color: var(--comp-statebrowser-fg);
        overflow-wrap: anywhere;

        opacity: 1;
    }

    .DogeDropWallet .balance {
        margin-top: 8px;
        padding: 7px 3px 1px;

        border-top: 1px solid var(--comp-ui-surface-border);

        font-size: 11px;
        font-weight: 600;
        line-height: 1.3;
        color: var(--comp-statebrowser-fg);
        text-align: left;
    }

    /* Conferma sincronizzazione NickServ */

    .kiwi-userbox-plugin-actions div.addrconf {
        width: auto;
    }

    .addrconf {
        position: absolute;
        z-index: 99999999999999;
        left: 5px;
        right: 5px;
        height: auto;
        top: 20px;
        display: block;
        padding: 10px;

        background: var(--comp-statebrowser-bg);
        border-radius: 8px;

        color: var(--comp-statebrowser-fg);
        text-align: left;
        box-sizing: border-box;
    }

    .addrconf-header {
        display: flex;
        align-items: center;
        gap: 7px;

        padding-bottom: 8px;
        margin-bottom: 9px;

        border-bottom: 1px solid var(--comp-ui-surface-border);

        color: var(--comp-statebrowser-fg);
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
    }

    .addrconf-header .fa {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        width: 14px;
        height: 14px;

        color: var(--brand-primary);
        font-size: 12px;
        line-height: 14px;
        text-align: center;
    }

    .addrconf-content {
        padding: 1px 2px 10px;

        color: var(--comp-statebrowser-fg);
        font-size: 11px;
        font-weight: 400;
        line-height: 1.45;
    }

    .addrconf-actions {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .addrconf-button {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 100%;
        min-height: 30px;
        padding: 5px 8px;

        background: transparent;
        border: 1px solid var(--comp-ui-surface-border);
        border-radius: 3px;

        color: var(--comp-statebrowser-fg);
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;

        cursor: pointer;
        box-sizing: border-box;

        transition:
            background-color 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease,
            opacity 0.15s ease;
    }

    .addrconf-button:hover {
        background: var(--comp-ui-surface-hover-bg);
    }

    .addrconf-button--confirm {
        border-color: var(--brand-primary);
        color: var(--brand-primary);
    }

    .addrconf-button--confirm:hover {
        border-color: var(--brand-primary);
        color: var(--brand-primary);
    }

    .addrconf-button--cancel {
        opacity: 0.7;
    }

    .addrconf-button--cancel:hover {
        opacity: 1;
    }

</style>
