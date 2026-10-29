<template>
    <div class="kiwi-extra-info-container">

        <div v-if="registered" class="extra-info-details">
            <div class="extra-info-row">
                <span class="extra-info-label">{{ $t('plugin-dogecoin-wallet:founder') }}</span>
                <span class="extra-info-value">{{ founder }}</span>
            </div>

            <div class="extra-info-row">
                <span class="extra-info-label">{{ $t('plugin-dogecoin-wallet:category') }}</span>
                <span class="extra-info-value">
                    <a
                        v-if="categoria"
                        :href="categoria_url"
                        class="u-link"
                        target="_blank"
                        rel="noopener noreferrer"
                    >{{ categoria }}</a>
                    <span v-else>{{ $t('plugin-dogecoin-wallet:not_set') }}</span>
                </span>
            </div>

            <div class="extra-info-row">
                <span class="extra-info-label">{{ $t('plugin-dogecoin-wallet:user_peak') }}</span>
                <span class="extra-info-value extra-info-peak">
                    <span>{{ peak }}</span>
                    <span class="extra-info-peak-time">{{ peak_time }}</span>
                </span>
            </div>
        </div>

        <div v-else class="extra-info-unregistered">
            {{ $t('plugin-dogecoin-wallet:unregistered_channel') }}
        </div>

        <div class="extra-info-actions">
            <a
                v-if="url"
                class="extra-url"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                :title="$t('plugin-dogecoin-wallet:website')"
            >
                <i class="fa fa-globe" />
            </a>

            <a
                v-if="twitter"
                class="extra-twitter"
                :href="twitter"
                target="_blank"
                rel="noopener noreferrer"
                title="Twitter"
            >
                <i class="fa fa-twitter" />
            </a>

            <a
                v-if="twitch"
                class="extra-twitch"
                title="Twitch"
                @click="twitchShow()"
            >
                <i class="fa fa-twitch" />
            </a>

            <a
                v-if="facebook"
                class="extra-facebook"
                :href="facebook"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
            >
                <i class="fa fa-facebook" />
            </a>

            <a
                v-if="youtube"
                class="extra-youtube"
                :href="youtube"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
            >
                <i class="fa fa-youtube-play" />
            </a>

            <a
                v-if="github"
                class="extra-github"
                :href="github"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
            >
                <i class="fa fa-github" />
            </a>

            <a
                v-if="address"
                class="kiwi-channelinfo-action extra-dogecoin"
                :title="$t('plugin-dogecoin-wallet:dogecoin_tip')"
                @click="isHidden = false;tipAmount = ''"
            >
                <span class="doge-button">Ð</span>
            </a>
        </div>

        <div v-if="!isHidden" class="modal" @click="isHidden = true" />

        <div v-if="!isHidden" class="tipform">
            <div class="tipform-header">
                <i class="fa fa-paw" aria-hidden="true" />
                <span>{{ $t('plugin-dogecoin-wallet:dogecoin_tip') }}</span>

                <button
                    class="tipform-close"
                    type="button"
                    @click="isHidden = true"
                >
                    <i class="fa fa-times" aria-hidden="true" />
                </button>
            </div>

            <div v-if="!pluginState.connected" class="external-wallet">
                <img
                    v-if="generatedQR"
                    :src="generatedQR"
                    class="qrcode"
                    :alt="$t('plugin-dogecoin-wallet:wallet_qr_code')"
                >

                <div class="address-link">
                    <i
                        class="fa fa-clipboard clipboard-copy"
                        aria-hidden="true"
                        :title="$t('plugin-dogecoin-wallet:copy_address')"
                        @click="copyAddress()"
                    />

                    <span class="tip-address">{{ address }}</span>
                </div>
            </div>

            <div v-if="pluginState.connected" class="tipform-connected">
                <label class="tipsend">
                    <span class="tipsend-label">{{ $t('plugin-dogecoin-wallet:dogecoin_amount') }}</span>

                    <input
                        v-model="tipAmount"
                        type="number"
                        placeholder="0.69"
                        step="0.01"
                        min="0.01"
                    >
                </label>

                <div class="tipform-actions">
                    <button
                        class="tipform-button tipform-button--confirm"
                        type="button"
                        @click="onTip()"
                    >
                        {{ $t('plugin-dogecoin-wallet:send_dogecoin') }}
                    </button>

                    <button
                        class="tipform-button tipform-button--cancel"
                        type="button"
                        @click="isHidden = true"
                    >
                        {{ $t('plugin-dogecoin-wallet:cancel') }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
/* global kiwi */

'kiwi public';

import WAValidator from 'multicoin-address-validator';
import QRCode from 'qrcode';
import DonateMsg from './donatemsg.vue';
import twitchIframe from './twitchiframe.vue';

const twitterRegex = /^(https?:\/\/)?(www\.)?twitter\.com\/(?:#!\/)?(\w+\/status\/\d+|\w+)$/;
const youtubeRegex = /^(https?:\/\/)?(www\.)?youtube\.com\/(c\/|channel\/|user\/|@)?([a-zA-Z0-9-_.]{1,})$/;
const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9_.-]+$/;
const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/.+$/;
const twitchRegex = /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})$/;

export default {
    props: ['network', 'user', 'pluginState'],
    data() {
        return {
            address: '',
            generatedQR: '',
            twitter: '',
            twitch: '',
            youtube: '',
            facebook: '',
            github: '',
            url: '',
            categoria: '',
            categoria_url: '',
            founder: '',
            peak: '',
            peak_time: '',
            registered: false,
            isHidden: true,
            tipAmount: '',
            addrerror: false,
            tiperror: false,
        };
    },
    computed: {
        buffer() {
            return this.$state.getActiveBuffer();
        },
    },
    watch: {
        buffer() {
            this.address = '';
            this.generatedQR = '';
            this.twitter = '';
            this.twitch = '';
            this.youtube = '';
            this.facebook = '';
            this.github = '';
            this.url = '';
            this.categoria = '';
            this.categoria_url = '';
            this.founder = '';
            this.peak = '';
            this.peak_time = '';
            this.registered = false;
            this.getExtra();
            this.getFounder();
        },
    },
    mounted() {
        this.listen(kiwi, 'irc.channel info', (event) => {
            this.getExtra();
            this.getFounder();
        });
        this.getExtra();
        this.getFounder();
    },
    methods: {
        copyAddress() {
            navigator.clipboard.writeText(this.address);
        },

        twitchShow() {
            kiwi.Vue.nextTick(() => {
                kiwi.state.$emit('mediaviewer.show', {
                    component: twitchIframe,
                    componentProps: {
                        twitch: this.twitch,
                    },
                });
            });
        },

        getFounder() {
            const buffer = kiwi.state.getActiveBuffer();

            if (!('r' in buffer.modes)) {
                this.registered = false;
                this.founder = '';
                return;
            } else {
                this.registered = true;
            }

            const xhr = new XMLHttpRequest();
            xhr.open(
                'GET',
                'https://www.simosnap.org/rest/service.php/fullchannels/' +
                    encodeURIComponent(buffer.name)
            );
            xhr.responseType = 'json';
            xhr.onload = (e) => {
                if (xhr.status !== 200) {
                    return;
                }

                const founder = xhr.response.chan_founder;
                if (founder) {
                    this.founder = founder;
                }

                const peak = xhr.response.users_max;
                if (peak) {
                    this.peak = peak;
                }

                const peakTime = xhr.response.users_max_time;
                if (peakTime) {
                    const date = new Date(Date.parse(peakTime));
                    this.peak_time = date.toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    });
                }
            };
            xhr.send();
        },
        getExtra() {
            this.isHidden = true;

            const buffer = kiwi.state.getActiveBuffer();

            if (!('r' in buffer.modes)) {
                this.registered = false;
                this.categoria = '';
                this.categoria_url = '';
                this.address = '';
                this.generatedQR = '';
                this.twitter = '';
                this.twitch = '';
                this.youtube = '';
                this.facebook = '';
                this.github = '';
                this.url = '';
                return;
            } else {
                this.registered = true;
            }

            const xhr = new XMLHttpRequest();
            xhr.open(
                'GET',
                'https://www.simosnap.org/rest/service.php/cmisc/' +
                    encodeURIComponent(buffer.name)
            );
            xhr.responseType = 'json';
            xhr.onload = (e) => {
                if (xhr.status !== 200) {
                    return;
                }

                const categoria = xhr.response.CATEGORIA;
                if (categoria) {
                    this.categoria = categoria;
                    this.categoria_url = 'https://www.simosnap.org/channel#' + categoria;
                } else {
                    this.categoria = '';
                    this.categoria_url = '';
                }

                const dogecoin = xhr.response.DOGECOIN;
                if (dogecoin && WAValidator.validate(dogecoin, 'doge')) {
                    this.address = dogecoin;

                    QRCode.toDataURL(this.address, {
                        quality: 1,
                        errorCorrectionLevel: 'H',
                        width: 200,
                    }).then((result) => {
                        this.generatedQR = result;
                    });
                } else {
                    this.address = '';
                    this.generatedQR = '';
                }

                const twitter = xhr.response.TWITTER;
                if (twitter && twitterRegex.test(twitter)) {
                    this.twitter = twitter;
                } else {
                    this.twitter = '';
                }

                const twitch = xhr.response.TWITCH;
                if (twitch && twitchRegex.test(twitch)) {
                    const match = twitch.match(twitchRegex);
                    this.twitch = match[1];
                } else {
                    this.twitch = '';
                }

                const facebook = xhr.response.FACEBOOK;
                if (facebook && facebookRegex.test(facebook)) {
                    this.facebook = facebook;
                } else {
                    this.facebook = '';
                }

                const youtube = xhr.response.YOUTUBE;
                if (youtube && youtubeRegex.test(youtube)) {
                    this.youtube = youtube;
                } else {
                    this.youtube = '';
                }

                const github = xhr.response.GITHUB;
                if (github && githubRegex.test(github)) {
                    this.github = github;
                } else {
                    this.github = '';
                }

                const url = xhr.response.URL;
                if (url) {
                    this.url = url;
                } else {
                    this.url = '';
                }
            };
            xhr.send();
        },
        onTip() {
            if (!this.pluginState.connected) {
                this.tiperror = true;
                return;
            }

            let transaction;

            if (this.pluginState.activeWallet === 'dogesoft') {
                const dogesoft = window.dogesoft;

                transaction = dogesoft.sendDoge({
                    to: this.address,
                    amount: Number(this.tipAmount),
                }).then((result) => ({
                    txId: result.txid,
                }));
            } else if (this.pluginState.activeWallet === 'mydoge') {
                const mydoge = window.doge;

                transaction = mydoge.requestTransaction({
                    recipientAddress: this.address,
                    dogeAmount: this.tipAmount,
                });
            } else {
                this.tiperror = true;
                return;
            }

            transaction.then((txReqRes) => {
                // console.log('request transaction result', txReqRes);
                let buffer = this.$state.getActiveBuffer();
                let mynick = this.$state.getActiveNetwork().nick;

                this.$state.addMessage(
                    buffer,
                    {
                        message: '⚠ You sent a tip of ' + this.tipAmount +
                           ' Ðogecoin to ' + buffer.name +
                           ' check the transaction on dogechain ' +
                           'https://dogechain.info/tx/' + txReqRes.txId,
                        bodyTemplate: DonateMsg,
                        bodyTemplateProps: {
                            id: txReqRes.txId,
                            amount: this.tipAmount,
                            channel: buffer.name,
                            self: true,
                            error: false,
                            reason: '',
                            wallet: this.pluginState.activeWallet,
                        },
                        nick: '',
                        ident: 'INFO',
                        hostname: 'INFO',
                        target: mynick,
                    }
                );

                this.isHidden = true;
                this.tiperror = false;
            })
                .catch((error) => {
                    console.error(`onRejected function called: ${error.message}`);
                    let buffer = this.$state.getActiveBuffer();
                    let mynick = this.$state.getActiveNetwork().nick;
                    this.$state.addMessage(
                        buffer,
                        {
                            message: '⚠ You failed to send a tip of ' + this.tipAmount +
                               ' Ðogecoin to ' + buffer.name +
                               ': ' + error.message,
                            bodyTemplate: DonateMsg,
                            bodyTemplateProps: {
                                id: error.message,
                                amount: this.tipAmount,
                                channel: buffer.name,
                                self: true,
                                error: true,
                                reason: error.message,
                                wallet: this.pluginState.activeWallet,
                            },
                            nick: '',
                            ident: 'INFO',
                            hostname: 'INFO',
                            target: mynick,
                        }
                    );

                    this.isHidden = true;
                    this.tiperror = true;
                });
        },
    },
};
</script>

<style scoped>

/* ============================================================
   EXTRA INFO - Dettagli canale
============================================================ */

.kiwi-extra-info-container {
    box-sizing: border-box;
}

.extra-info-details {
    width: 100%;
}

.extra-info-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 5px 0;
    border-bottom: 1px solid rgba(127, 127, 127, 0.14);
}

.extra-info-row:last-child {
    border-bottom: 0;
}

.extra-info-label {
    flex: 0 0 auto;
    color: var(--brand-darktone);
    font-size: 11px;
}

.extra-info-value {
    min-width: 0;
    text-align: right;
    font-size: 12px;
    font-weight: 600;
    overflow-wrap: anywhere;
}

.extra-info-value .u-link {
    font-weight: 600;
    text-decoration: none;
}

.extra-info-peak {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.extra-info-peak-time {
    margin-top: 2px;
    color: var(--brand-darktone);
    font-size: 10px;
    font-weight: 400;
}

.extra-info-unregistered {
    color: var(--brand-darktone);
    font-size: 11px;
    line-height: 1.4;
}

/* Social / azioni */

.extra-info-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;

    margin-top: 8px;
    padding-top: 8px;

    border-top: 1px solid rgba(127, 127, 127, 0.14);
}

.extra-info-actions > a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 24px;

    width: 24px;
    height: 24px;
    margin: 0;
    padding: 0;

    background: rgba(127, 127, 127, 0.08);
    border: 1px solid rgba(127, 127, 127, 0.18);
    border-radius: 50%;

    color: var(--brand-darktone) !important;
    cursor: pointer;
    text-decoration: none;

    box-sizing: border-box;

    transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
}

.extra-info-actions > a:hover {
    background: rgba(127, 127, 127, 0.14);
    border-color: var(--brand-primary);
    color: var(--brand-primary) !important;
}

.extra-info-actions .fa {
    width: auto;
    height: auto;

    font-size: 12px;
    line-height: 1;
    text-align: center;
}

.extra-info-actions .fa-youtube-play {
    transform: translateX(0.5px);
}

.doge-button {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 14px;
    height: 14px;

    border: 0;

    color: inherit;
    font-family: Arial, sans-serif;
    font-size: 12px;
    font-weight: 700;
    line-height: 14px;

    transform: translateY(-0.5px);
}

/* ============================================================
   DOGECOIN TIP POPUP
============================================================ */

.tipform {
    position: absolute;
    z-index: 99999999999999;
    top: 20px;
    left: 5px;
    right: 5px;

    display: block;
    height: auto;
    padding: 10px;

    background: var(--comp-statebrowser-bg);
    border-radius: 8px;

    color: var(--comp-statebrowser-fg);
    text-align: left;
    box-sizing: border-box;
}

/* Header */

.tipform-header {
    display: flex;
    align-items: center;
    gap: 7px;

    padding-bottom: 8px;
    margin-bottom: 10px;

    border-bottom: 1px solid var(--comp-ui-surface-border);

    color: var(--comp-statebrowser-fg);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
}

.tipform-header > .fa {
    flex: 0 0 auto;

    color: var(--brand-primary);
    font-size: 12px;
}

.tipform-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;
    padding: 0;
    margin-left: auto;

    background: transparent;
    border: 0;

    color: var(--comp-statebrowser-fg);
    font-size: 11px;

    cursor: pointer;
    opacity: 0.55;
}

.tipform-close:hover {
    opacity: 1;
}

/* Wallet esterno / QR */

.external-wallet {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.qrcode {
    width: 150px;
    height: 150px;
    margin: 2px 0 10px;

    background: #fff;
    border: 1px solid var(--comp-ui-surface-border);
    border-radius: 4px;
}

.address-link {
    display: flex;
    align-items: center;
    gap: 7px;

    width: 100%;
    min-width: 0;
    padding: 6px 7px;

    border: 1px solid var(--comp-ui-surface-border);
    border-radius: 3px;

    box-sizing: border-box;
}

.clipboard-copy {
    flex: 0 0 auto;

    color: var(--brand-primary);
    font-size: 12px;

    cursor: pointer;
}

.tip-address {
    min-width: 0;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    color: var(--comp-statebrowser-fg);
    font-size: 10px;
}

/* MyDoge connesso */

.tipform-connected {
    width: 100%;
}

.tipsend {
    display: block;
    margin: 0 0 10px;
}

.tipsend-label {
    display: block;
    margin-bottom: 5px;

    color: var(--comp-statebrowser-fg);
    font-size: 10px;
    font-weight: 600;
}

.tipform input[type="number"] {
    width: 100%;
    padding: 6px 7px;

    background: var(--comp-statebrowser-bg);
    border: 1px solid var(--comp-ui-surface-border);
    border-radius: 3px;

    color: var(--comp-statebrowser-fg);
    font-family: inherit;
    font-size: 14px;
    text-align: center;

    box-sizing: border-box;
    outline: none;
}

.tipform input[type="number"]:focus {
    border-color: var(--brand-primary);
}

/* Azioni */

.tipform-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tipform-button {
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

.tipform-button:hover {
    background: var(--comp-ui-surface-hover-bg);
}

.tipform-button--confirm {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
}

.tipform-button--cancel {
    opacity: 0.7;
}

.tipform-button--cancel:hover {
    opacity: 1;
}

</style>
