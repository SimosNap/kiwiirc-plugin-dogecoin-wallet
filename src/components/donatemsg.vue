<template>
    <div :class="['tip-card', { 'tip-card--error': error }]">
        <div class="tip-card-icon">
            <div class="tip-card-wallet-icon">
                <img
                    src="/plugins/plugin-dogecoin-wallet/imgs/dogedrop.png"
                    alt="DogeDrop"
                >

                <i
                    v-if="error"
                    class="fa fa-exclamation-triangle tip-card-wallet-alert"
                    aria-hidden="true"
                />
            </div>
        </div>

        <div class="tip-card-content">
            <template v-if="!error">
                <div class="tip-card-title">
                    {{ $t('plugin-dogecoin-wallet:you_donated') }}
                    <strong>{{ amount }} Ð</strong>
                    {{ $t('plugin-dogecoin-wallet:to') }}
                    <a
                        class="u-link kiwi-channel"
                        :data-channel="channel"
                    >{{ channel }}</a>
                </div>

                <a
                    class="tip-card-transaction"
                    :href="dogechain"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {{ $t('plugin-dogecoin-wallet:view_transaction') }}
                    <i class="fa fa-external-link" aria-hidden="true" />
                </a>
            </template>

            <template v-else>
                <div class="tip-card-title">
                    {{ $t('plugin-dogecoin-wallet:donation_not_sent') }}
                    {{ $t('plugin-dogecoin-wallet:to') }}
                    <a
                        class="u-link kiwi-channel"
                        :data-channel="channel"
                    >{{ channel }}</a>
                </div>

                <div class="tip-card-reason">
                    {{ reason }}
                </div>
            </template>
        </div>
    </div>
</template>

<script>
export default {
    props: ['id', 'amount', 'channel', 'self', 'error', 'reason'],

    data() {
        return {
            dogechain: 'https://dogecoinlab.org/blockchain/tx/' + this.id,
        };
    },
};
</script>

<style>
/* ============================================================
   DOGECOIN CHANNEL DONATION MESSAGE
============================================================ */

.tip-card {
    width: 480px;
    max-width: 100%;
    display: flex !important;
    align-items: center;
    gap: 6px;

    padding: 4px;
    overflow: hidden;

    background: var(--brand-default-bg);
    border: 1px solid var(--comp-border);
    border-radius: 4px;

    color: var(--brand-default-fg);
    line-height: 1.3;

    box-sizing: border-box;
}

.tip-card div {
    white-space: normal !important;
}

/* ============================================================
   ICON
============================================================ */

.tip-card-icon {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--brand-primary);
}

.tip-card-icon .fa {
    width: 20px;
    text-align: center;
}

.tip-card-wallet-icon {
    position: relative;
    width: 44px;
    height: 44px;
}

.tip-card-wallet-icon img {
    display: block;
    width: 44px;
    height: 44px;
    border-radius: 3px;
    object-fit: contain;
}

.tip-card-wallet-icon .tip-card-wallet-alert {
    position: absolute;
    right: -4px;
    bottom: -4px;

    width: auto;

    color: var(--brand-error);
    font-size: 16px;
    line-height: 1;
}

/* ============================================================
   CONTENT
============================================================ */

.tip-card-content {
    min-width: 0;
    flex: 1 1 0%;
    padding: 0;
}

.tip-card-title {
    color: var(--brand-default-fg);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.35;
}

.tip-card-title strong {
    margin-left: 3px;

    color: var(--brand-primary);
    font-size: 13px;
    font-weight: 700;
}

.tip-card-title .kiwi-channel {
    font-weight: 600;
}

.tip-card-transaction {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    margin-top: 4px;

    color: var(--brand-primary);
    font-size: 10px;
    font-weight: 600;
    line-height: 1.3;
    text-decoration: none;
}

.tip-card-transaction:hover {
    text-decoration: underline;
}

.tip-card-transaction .fa {
    font-size: 9px;
}

/* ============================================================
   ERROR
============================================================ */

.tip-card--error .tip-card-icon {
    color: var(--brand-error);
}

.tip-card--error .tip-card-title {
    color: var(--brand-error);
}

.tip-card-reason {
    margin-top: 4px;

    color: var(--brand-default-fg);
    font-size: 10px;
    line-height: 1.35;

    opacity: 0.75;
}

/* ============================================================
   MOBILE
============================================================ */

@media (max-width: 600px) {
    .tip-card {
        width: 100%;
    }
}
</style>
